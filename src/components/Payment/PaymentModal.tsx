import React, { useState, useEffect, useRef } from 'react';
import { X, CreditCard, Smartphone, DollarSign, AlertCircle, CheckCircle, Loader, Info, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { ChapaService } from '../../services/chapaService';
import { useAuth } from '../../contexts/AuthContext';
import { addDoc, collection, updateDoc, doc, Timestamp, query, where, getDocs, limit, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { ChapaPaymentRequest, PaymentMethod } from '../../types/chapa';
import { useNavigate } from 'react-router-dom';

import { uploadToCloudinary } from '../../services/cloudinary';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    tourId: string;
    tourName: string;
    totalPrice: number;
    participants: number;
    agencyId: string;
  };
  onPaymentSuccess: () => void;
}

interface PaymentForm {
  paymentMethod: 'chapa' | 'manual';
  currency: 'ETB' | 'USD';
  phone_number: string;
  selectedPaymentOptions: string[];
  paymentReceipt?: FileList; // Field for the uploaded file
  agree_terms: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  onPaymentSuccess
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentTxRef, setCurrentTxRef] = useState<string>('');
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [connectionTested, setConnectionTested] = useState(false);
  const [chapaAvailable, setChapaAvailable] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<PaymentForm>({
    defaultValues: {
      paymentMethod: 'chapa',
      currency: 'ETB',
      phone_number: '',
      selectedPaymentOptions: [], // Initialize as empty to force selection
      agree_terms: false
    }
  });

  const selectedCurrency = watch('currency');
  const selectedPaymentMethod = watch('paymentMethod');
  const selectedPaymentOptions = watch('selectedPaymentOptions');

  const paymentMethods = ChapaService.getPaymentMethods() as unknown as PaymentMethod[];

  const validateChapaSetup = async () => {
    try {
      const status = await ChapaService.getConnectionStatus();
      setChapaAvailable(status.configured && status.keysValid && status.connected);
      setConnectionTested(true);

      if (!status.configured || !status.keysValid || !status.connected) {
        console.warn('Chapa connection issues:', status.errors);
      }
    } catch (error) {
      console.error('Chapa validation failed:', error);
      setChapaAvailable(false);
      setConnectionTested(true);
    }
  };

  useEffect(() => {
    if (isOpen && !connectionTested) {
      validateChapaSetup();
    }
  }, [isOpen, connectionTested]);

  // Store verifyPayment in a ref to avoid stale closures
  const verifyPaymentRef = useRef<(txRef: string) => Promise<void>>();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'PAYMENT_SUCCESS') {
        if (verifyPaymentRef.current) {
          verifyPaymentRef.current(event.data.txRef);
        }
      } else if (event.data.type === 'PAYMENT_FAILED') {
        setErrorMessage('Payment was cancelled or failed');
        setPaymentStep('error');
        setIsProcessing(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    return () => {
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
    };
  }, [paymentWindow]);

  const getAmount = () => {
    return selectedCurrency === 'ETB'
      ? ChapaService.convertUSDToETB(booking.totalPrice)
      : booking.totalPrice;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return currency === 'ETB'
      ? `${amount.toLocaleString()} ETB`
      : `$${amount.toFixed(2)}`;
  };

  // When using radio buttons for payment options, we select only one
  const handlePaymentOptionSelect = (optionId: string) => {
    setValue('selectedPaymentOptions', [optionId]);
  };

  // Helper to check if a payment option is selected (for radio buttons)
  const isOptionSelected = (optionId: string) => {
    // Since selectedPaymentOptions is an array with potentially one item
    // when using radio buttons, we check if the array includes the optionId
    return selectedPaymentOptions.includes(optionId);
  };

  const onSubmit = async (data: PaymentForm) => {
    if (!currentUser) {
      toast.error('Please log in to make payment');
      return;
    }

    if (data.paymentMethod === 'chapa' && data.selectedPaymentOptions.length === 0) {
      // Adjusted error message for single selection
      toast.error('Please select a payment option');
      return;
    }

    setIsProcessing(true);
    setPaymentStep('processing');
    setErrorMessage('');

    try {
      if (data.paymentMethod === 'chapa' && chapaAvailable) {
        await processChapaPayment(data);
      } else {
        await processManualPayment(data);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setErrorMessage(error.message || 'Payment failed. Please try again.');
      setPaymentStep('error');
      setIsProcessing(false);
    }
  };

  const processChapaPayment = async (data: PaymentForm) => {
    let paymentRecord: any;

    try {
      const amount = ChapaService.formatAmount(getAmount(), data.currency);
      const txRef = ChapaService.generateTxRef('WOLAITA_TOUR');
      setCurrentTxRef(txRef);

      const nameParts = currentUser!.name.split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || 'User';
      const phoneNumber = ChapaService.formatPhoneNumber(data.phone_number);

      // Save last transaction reference in storage for recovery
      sessionStorage.setItem('last_chapa_tx_ref', txRef);
      localStorage.setItem('last_chapa_tx_ref', txRef);

      const paymentData: ChapaPaymentRequest = {
        amount: getAmount(),
        currency: data.currency,
        email: currentUser!.email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        tx_ref: txRef,
        callback_url: `${window.location.origin}/payment/callback`,
        return_url: `${window.location.origin}/payment/success?tx_ref=${txRef}&status=success`,
        description: `Payment for ${booking.tourName} - ${booking.participants} participant(s)`,
        meta: {
          booking_id: booking.id,
          tour_id: booking.tourId,
          user_id: currentUser!.id,
        },
        payment_options: data.selectedPaymentOptions
      };

      paymentRecord = await addDoc(collection(db, 'payments'), {
        bookingId: booking.id,
        tourId: booking.tourId,
        userId: currentUser!.id,
        agencyId: booking.agencyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        method: 'chapa',
        status: 'pending', // Initial status before checkout
        txRef,
        createdAt: Timestamp.now(),
        chapaData: { // Store Chapa specific request data
          phone_number: paymentData.phone_number || null,
          description: paymentData.description,
          payment_options: paymentData.payment_options,
          meta: paymentData.meta
        }
      });

      const result = await ChapaService.initializePayment(paymentData);

      if (result.status === 'success' && result.data?.checkout_url) {
        setPaymentUrl(result.data.checkout_url);

        await updateDoc(doc(db, 'payments', paymentRecord.id), {
          checkoutUrl: result.data.checkout_url,
          updatedAt: Timestamp.now()
        });

        const popup = ChapaService.openPaymentPopup(result.data.checkout_url);

        if (popup) {
          setPaymentWindow(popup);

          // Poll for payment verification when window closes
          let checkInterval: NodeJS.Timeout | null = null;
          let verificationAttempts = 0;
          const maxAttempts = 10;

          const checkClosed = () => {
            if (popup.closed) {
              // Window closed - verify payment immediately
              console.log('Payment window closed, verifying payment immediately...');
              if (paymentStep === 'processing' && currentTxRef && verifyPaymentRef.current) {
                // Try verification immediately
                verifyPaymentRef.current(currentTxRef).catch((error) => {
                  console.log('First verification attempt failed, will retry...', error);
                  // Retry after 2 seconds
                  setTimeout(() => {
                    if (verifyPaymentRef.current && paymentStep === 'processing') {
                      verifyPaymentRef.current(currentTxRef).catch((retryError) => {
                        console.error('Retry verification failed:', retryError);
                        // Still try one more time after 5 seconds
                        setTimeout(() => {
                          if (verifyPaymentRef.current && paymentStep === 'processing') {
                            verifyPaymentRef.current(currentTxRef).catch((finalError) => {
                              console.error('Final verification attempt failed:', finalError);
                              setErrorMessage('Payment verification is taking longer than expected. Please check your bookings or contact support.');
                              setPaymentStep('error');
                              setIsProcessing(false);
                            });
                          }
                        }, 5000);
                      });
                    }
                  }, 2000);
                });
              }
              if (checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
              }
            } else {
              // Check if window URL changed to success page
              try {
                const currentUrl = popup.location.href;
                if (currentUrl.includes('/payment/success') || currentUrl.includes('status=success') || currentUrl.includes('success')) {
                  console.log('Payment success detected in URL, verifying...');
                  // Payment successful, verify it immediately
                  if (currentTxRef && verifyPaymentRef.current) {
                    verifyPaymentRef.current(currentTxRef);
                  }
                  if (checkInterval) {
                    clearInterval(checkInterval);
                    checkInterval = null;
                  }
                  return;
                }
              } catch (e) {
                // Cross-origin error, continue polling
              }

              // Continue checking
              verificationAttempts++;
              if (verificationAttempts < maxAttempts) {
                checkInterval = setTimeout(checkClosed, 1000);
              } else {
                console.log('Max verification attempts reached, stopping polling');
                if (checkInterval) {
                  clearInterval(checkInterval);
                  checkInterval = null;
                }
              }
            }
          };

          // Start checking immediately
          checkClosed();

          // Fallback: Auto-verify after 10 seconds if still processing
          setTimeout(async () => {
            if (paymentStep === 'processing' && currentTxRef) {
              console.log('Auto-verifying payment after 10 seconds...');
              try {
                if (verifyPaymentRef.current) {
                  await verifyPaymentRef.current(currentTxRef);
                }
              } catch (error) {
                console.error('Auto-verification failed:', error);
              }
            }
          }, 10000);

          // Final fallback: Redirect after 30 seconds even if verification pending
          setTimeout(() => {
            if (paymentStep === 'processing') {
              console.log('30 seconds elapsed, redirecting anyway...');
              // Force close and redirect
              onPaymentSuccess();
              navigate(`/payment/success?tx_ref=${currentTxRef}&status=success`);
            }
          }, 30000);
        }
      } else {
        throw new Error(result.message || 'Failed to get checkout URL');
      }
    } catch (error: any) {
      if (paymentRecord) {
        await updateDoc(doc(db, 'payments', paymentRecord.id), {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: Timestamp.now()
        });
      }

      throw error;
    }
  };

  // Update the processManualPayment function
  const processManualPayment = async (data: PaymentForm) => {
    setIsProcessing(true);

    try {
      const transferRef = `WOLAITA_${booking.id}_${Date.now()}`;
      let receiptUrl = '';

      // Upload receipt to Cloudinary if exists
      if (data.paymentReceipt && data.paymentReceipt.length > 0) {
        receiptUrl = await uploadToCloudinary(data.paymentReceipt[0]);
      }

      // Create payment document with receipt URL
      await addDoc(collection(db, 'payments'), {
        bookingId: booking.id,
        tourId: booking.tourId,
        userId: currentUser!.id,
        agencyId: booking.agencyId,
        amount: getAmount(),
        currency: data.currency,
        method: 'manual',
        status: 'pending_verification',
        transferRef,
        createdAt: Timestamp.now(),
        receiptUrl, // Store Cloudinary URL here
        instructions: {
          bankName: 'Commercial Bank of Ethiopia',
          accountNumber: '1000123456789',
          accountName: 'Wolaita Tours',
          reference: transferRef,
          amount: formatCurrency(getAmount(), data.currency)
        }
      });

      // Update booking status
      await updateDoc(doc(db, 'bookings', booking.id), {
        paymentStatus: 'pending_verification',
        paymentMethod: 'manual',
        paymentReference: transferRef,
        updatedAt: Timestamp.now()
      });

      setPaymentStep('success');
      toast.success('Manual payment submitted! Receipt uploaded successfully.');
    } catch (error: any) {
      console.error('Manual payment error:', error);
      setErrorMessage(error.message || 'Failed to process manual payment');
      setPaymentStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (txRef: string) => {
    try {
      setIsProcessing(true);
      console.log('Starting payment verification for txRef:', txRef);
      console.log('Booking ID:', booking.id);

      const verification = await ChapaService.verifyPayment(txRef);
      console.log('Verification response:', verification);

      if (verification.status === 'success' && verification.data?.status === 'success') {
        console.log('Payment verified successfully, updating booking...');

        // Update booking with payment status
        try {
          await updateDoc(doc(db, 'bookings', booking.id), {
            paymentStatus: 'paid',
            paymentMethod: 'chapa',
            paymentReference: txRef,
            paymentVerifiedAt: Timestamp.now(),
            status: 'confirmed',
            updatedAt: Timestamp.now()
          });
          console.log('Booking updated successfully');
        } catch (updateError: any) {
          console.error('Error updating booking:', updateError);
          // Try to get the booking first to see what's there
          const bookingDoc = await getDoc(doc(db, 'bookings', booking.id));
          if (bookingDoc.exists()) {
            console.log('Current booking data:', bookingDoc.data());
          }
          throw updateError;
        }

        // Update payment record
        const paymentQuery = query(
          collection(db, 'payments'),
          where('txRef', '==', txRef),
          limit(1)
        );

        const paymentSnapshot = await getDocs(paymentQuery);
        if (!paymentSnapshot.empty) {
          await updateDoc(paymentSnapshot.docs[0].ref, {
            status: 'completed',
            verificationData: verification.data,
            verifiedAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
          console.log('Payment record updated successfully');
        } else {
          console.warn('No payment record found for txRef:', txRef);
        }

        setPaymentStep('success');
        setIsProcessing(false);
        setIsVerifying(false);
        toast.success('Payment successful!');

        // Close payment window if open
        if (paymentWindow && !paymentWindow.closed) {
          paymentWindow.close();
        }
        setPaymentWindow(null);

        // Force close modal and redirect immediately
        // Use setTimeout to ensure state updates complete
        setTimeout(() => {
          onPaymentSuccess();

          // Navigate to appropriate dashboard based on user role
          const userRole = currentUser?.role;
          const dashboardRoute = userRole === 'tourist' ? '/tourist'
            : userRole === 'agency' ? '/agency'
              : userRole === 'admin' ? '/dashboard'
                : userRole === 'cashier' ? '/cashier'
                  : '/dashboard';

          onPaymentSuccess(); // This closes the modal

          navigate(`/payment/success?tx_ref=${txRef}&status=success`);
          return;
        }, 100);
      } else {
        console.error('Verification failed:', verification);
        throw new Error(verification.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      setErrorMessage(
        error.message || 'Payment verification failed. Please contact support if money was deducted.'
      );
      setPaymentStep('error');
      setIsProcessing(false);
    }
  };

  // Update ref when verifyPayment changes
  useEffect(() => {
    verifyPaymentRef.current = verifyPayment;
  }, [booking.id, currentUser?.role]);

  const handleClose = () => {
    if (!isProcessing) {
      setPaymentStep('form');
      setErrorMessage('');
      setPaymentUrl('');
      setCurrentTxRef('');

      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
      setPaymentWindow(null);

      onClose();
    }
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isProcessing) {
      handleClose();
    }
  };

  const handleRetry = () => {
    setPaymentStep('form');
    setErrorMessage('');
    setPaymentUrl('');
    setCurrentTxRef('');
    setIsProcessing(false);

    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.close();
    }
    setPaymentWindow(null);
  };

  const openPaymentManually = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] overflow-y-auto">
        <div
          className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 z-[99998]"
            aria-hidden="true"
          />

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg z-[100000]"
            onClick={handleModalContentClick}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-amber-600" />
                <span>Complete Payment</span>
              </h3>
              {!isProcessing && (
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>

            {/* Payment Steps */}
            {paymentStep === 'form' && (
              <div className="space-y-6">
                {/* Booking Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Booking Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tour:</span>
                      <span className="font-medium">{booking.tourName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Participants:</span>
                      <span className="font-medium">{booking.participants}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold text-lg">
                        {formatCurrency(getAmount(), selectedCurrency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chapa Status */}
                {connectionTested && (
                  <div className={`border rounded-lg p-4 ${chapaAvailable ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-center space-x-2">
                      {chapaAvailable ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Info className="h-5 w-5 text-yellow-600" />
                      )}
                      <span className={`text-sm font-medium ${chapaAvailable ? 'text-green-800' : 'text-yellow-800'}`}>
                        {chapaAvailable ? 'Online Payment Available' : 'Online Payment Unavailable'}
                      </span>
                    </div>
                    {!chapaAvailable && (
                      <p className="text-sm text-yellow-700 mt-1">
                        Manual payment option is available below.
                      </p>
                    )}
                  </div>
                )}

                {/* Payment Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Currency Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          {...register('currency')}
                          type="radio"
                          value="ETB"
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm font-medium">Ethiopian Birr (ETB)</span>
                      </label>
                      <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          {...register('currency')}
                          type="radio"
                          value="USD"
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm font-medium">US Dollar (USD)</span>
                      </label>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="space-y-3">
                      {chapaAvailable && (
                        <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            {...register('paymentMethod')}
                            type="radio"
                            value="chapa"
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <Smartphone className="h-5 w-5 text-amber-600" />
                          <div>
                            <div className="font-medium">Chapa Payment</div>
                            <div className="text-sm text-gray-500">Mobile money, cards, and bank transfers</div>
                          </div>
                        </label>
                      )}
                      <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          {...register('paymentMethod')}
                          type="radio"
                          value="manual"
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <DollarSign className="h-5 w-5 text-amber-600" />
                        <div>
                          <div className="font-medium">Manual Payment</div>
                          <div className="text-sm text-gray-500">Bank transfer or cash payment</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Payment Options for Chapa */}
                  {selectedPaymentMethod === 'chapa' && chapaAvailable && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select Payment Options
                      </label>{/* Change 'Payment methods' to 'Payment options' */}
                      <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                        {paymentMethods.map((method) => (
                          <label
                            key={method.id}
                            className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${selectedPaymentOptions.includes(method.id) ? 'border-amber-500 bg-amber-50' : ''
                              }`}
                          >
                            <input
                              type="radio" // Changed from checkbox to radio
                              {...register('selectedPaymentOptions', { required: selectedPaymentMethod === 'chapa' ? 'Please select a payment option' : false })} // Register with react-hook-form
                              value={method.id} // Assign the method id as value
                              className="text-amber-600 focus:ring-amber-500"
                            />
                            <img src={method.icon} alt={method.name} className="h-12 w-12 object-contain" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{method.name}</div>
                              <div className="text-xs text-gray-500">{method.description}</div>
                            </div>
                          </label>
                        ))}
                        {errors.selectedPaymentOptions && (
                          <p className="mt-1 text-sm text-red-600 col-span-2">{errors.selectedPaymentOptions.message}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Select one payment option you'd like to use
                      </p>
                    </div>
                  )}

                  {/* Phone Number for Chapa */}
                  {selectedPaymentMethod === 'chapa' && chapaAvailable && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          {...register('phone_number', {
                            pattern: {
                              value: /^(\+251|0)?[9][0-9]{8}$/,
                              message: 'Please enter a valid Ethiopian phone number'
                            }
                          })}
                          type="tel"
                          placeholder="0912345678 or +251912345678"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                      {errors.phone_number && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        For mobile money payments (Telebirr, M-Birr, etc.)
                      </p>
                    </div>
                  )}

                  {/* File Upload for Manual Payment */}
                  {selectedPaymentMethod === 'manual' && (
                    <>
                      {/* Account Details for Manual Payment */}
                      <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                        <div className="flex items-center space-x-3 mb-3">
                          <img src="/images/payment/CBElogo.jpg" alt="CBE Logo" className="h-12 w-12 object-contain" />
                          <div>
                            <h4 className="font-medium text-gray-900">Manual Bank Transfer</h4>
                            <p className="text-sm text-gray-700">Please transfer the amount to the account details below:</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bank Name:</span>
                            <span className="font-medium text-gray-800">Commercial Bank of Ethiopia</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account Number:</span>
                            <span className="font-medium text-gray-800">1000123456789</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account Name:</span>
                            <span className="font-medium text-gray-800">Wolaita Tours</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="paymentReceipt" className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Payment Receipt/Screenshot
                        </label>
                        <input
                          {...register('paymentReceipt', {
                            required: selectedPaymentMethod === 'manual' ? 'Please upload a payment receipt' : false,
                            validate: {
                              lessThan10MB: files => files && files[0] && files[0].size < 10000000 || 'File size should be less than 10MB',
                              acceptedFormats: files =>
                                files && files[0] &&
                                ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
                                  .includes(files[0].type) ||
                                'Only image files are allowed (JPG, PNG, WEBP, HEIC)',
                            }
                          })}
                          id="paymentReceipt"
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-amber-50 file:text-amber-700
                          hover:file:bg-amber-100"
                        />
                        {errors.paymentReceipt && <p className="mt-1 text-sm text-red-600">{errors.paymentReceipt.message}</p>}
                      </div>
                    </>)}
                  {/* Terms Agreement */}
                  <div>
                    <label className="flex items-start space-x-2">
                      <input
                        {...register('agree_terms', { required: 'You must agree to the terms' })}
                        type="checkbox"
                        className="mt-1 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the{' '}
                        <a href="#" className="text-amber-600 hover:text-amber-700">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-amber-600 hover:text-amber-700">
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                    {errors.agree_terms && (
                      <p className="mt-1 text-sm text-red-600">{errors.agree_terms.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : `Pay ${formatCurrency(getAmount(), selectedCurrency)}`}
                  </button>
                </form>
              </div>
            )}

            {/* Processing Step */}
            {paymentStep === 'processing' && (
              <div className="text-center py-8">
                <Loader className="h-16 w-16 text-amber-600 animate-spin mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Processing Payment</h4>
                <p className="text-gray-600 mb-6">
                  {paymentWindow && !paymentWindow.closed
                    ? 'Please complete your payment in the popup window...'
                    : 'Processing your payment...'}
                </p>
                {currentTxRef && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">
                      Transaction Reference: <span className="font-mono">{currentTxRef}</span>
                    </p>
                    <button
                      onClick={async () => {
                        if (currentTxRef) {
                          try {
                            setIsVerifying(true);
                            console.log('Manual verification triggered for:', currentTxRef);
                            if (verifyPaymentRef.current) {
                              await verifyPaymentRef.current(currentTxRef);
                            } else {
                              await verifyPayment(currentTxRef);
                            }
                          } catch (error: any) {
                            console.error('Manual verification error:', error);
                            toast.error(error.message || 'Payment verification failed. Please try again or contact support.');
                            setIsVerifying(false);
                          }
                        } else {
                          toast.error('No transaction reference found');
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:blur-none"
                      disabled={isVerifying || !currentTxRef}
                      style={isVerifying ? { opacity: 0.7 } : {}}
                    >
                      {isVerifying ? 'Verifying...' : 'Check Payment Status'}
                    </button>
                  </div>
                )}
                {paymentUrl && (
                  <div className="mt-4">
                    <a
                      href={paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:text-amber-700 underline text-sm"
                    >
                      Open payment page manually
                    </a>
                  </div>
                )}
                <div className="mt-6">
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel this payment? If payment was already made, please contact support.')) {
                        setErrorMessage('Payment cancelled by user');
                        setPaymentStep('error');
                        setIsProcessing(false);
                        setIsVerifying(false);
                        if (paymentWindow && !paymentWindow.closed) {
                          paymentWindow.close();
                        }
                        setPaymentWindow(null);
                        // Close modal and redirect
                        setTimeout(() => {
                          onPaymentSuccess();
                          const userRole = currentUser?.role;
                          const dashboardRoute = userRole === 'tourist' ? '/tourist'
                            : userRole === 'agency' ? '/agency'
                              : userRole === 'admin' ? '/dashboard'
                                : userRole === 'cashier' ? '/cashier'
                                  : '/dashboard';
                          navigate(dashboardRoute);
                        }, 500);
                      }
                    }}
                    className="text-gray-600 hover:text-gray-800 text-sm font-medium cursor-pointer"
                  >
                    Cancel Payment
                  </button>
                </div>
              </div>
            )}

            {/* Success Step */}
            {paymentStep === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Payment Successful!</h4>
                <p className="text-gray-600 mb-6">
                  {selectedPaymentMethod === 'chapa' ?
                    'Your booking has been confirmed. You will receive a confirmation email shortly.' :
                    'Your booking request has been submitted. We will contact you to arrange payment.'
                  }
                </p>
                <button
                  onClick={handleClose}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Error Step */}
            {paymentStep === 'error' && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Payment Failed</h4>
                <p className="text-gray-600 mb-6 text-sm">{errorMessage}</p>
                <div className="space-y-3">
                  <button
                    onClick={handleRetry}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Try Again
                  </button>
                  {currentTxRef && (
                    <button
                      onClick={() => verifyPayment(currentTxRef)}
                      disabled={isProcessing}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? 'Verifying...' : 'Check Payment Status'}
                    </button>
                  )}
                  {paymentUrl && (
                    <button
                      onClick={openPaymentManually}
                      className="w-full border border-amber-600 text-amber-600 px-4 py-2 rounded-md font-medium hover:bg-amber-50 transition-colors"
                    >
                      Open Payment Page
                    </button>
                  )}
                  <button
                    onClick={handleClose}
                    className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};