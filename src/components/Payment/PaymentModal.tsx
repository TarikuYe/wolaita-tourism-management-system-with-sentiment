import React, { useState, useEffect, useRef } from 'react';
import { X, CreditCard, Smartphone, DollarSign, AlertCircle, CheckCircle2, Loader, Info, Phone } from 'lucide-react';
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
  selectedPaymentOptions: string | string[];
  paymentReceipt?: FileList;
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
      selectedPaymentOptions: 'telebirr',
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

  const verifyPaymentRef = useRef<(txRef: string) => Promise<void>>();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'PAYMENT_SUCCESS') {
        const txRef = event.data.txRef || currentTxRef;
        if (paymentWindow && !paymentWindow.closed) {
          try {
            paymentWindow.close();
          } catch (e) {}
        }
        setPaymentWindow(null);
        setIsProcessing(false);
        setIsVerifying(false);
        onPaymentSuccess();
        navigate(`/payment/success?tx_ref=${encodeURIComponent(txRef)}&status=success`);
      } else if (event.data.type === 'PAYMENT_FAILED') {
        if (paymentWindow && !paymentWindow.closed) {
          try {
            paymentWindow.close();
          } catch (e) {}
        }
        setPaymentWindow(null);
        setErrorMessage(event.data.message || 'Payment was cancelled or failed');
        setPaymentStep('error');
        setIsProcessing(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentTxRef, paymentWindow, onPaymentSuccess, navigate]);

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

  // Helper to check if a specific payment option is selected
  const isOptionSelected = (optionId: string): boolean => {
    if (Array.isArray(selectedPaymentOptions)) {
      return selectedPaymentOptions.includes(optionId);
    }
    return selectedPaymentOptions === optionId;
  };

  const handlePaymentOptionSelect = (optionId: string) => {
    setValue('selectedPaymentOptions', optionId, { shouldValidate: true });
  };

  const onSubmit = async (data: PaymentForm) => {
    if (!currentUser) {
      toast.error('Please log in to make payment');
      return;
    }

    const hasOptionSelected = Array.isArray(data.selectedPaymentOptions)
      ? data.selectedPaymentOptions.length > 0
      : Boolean(data.selectedPaymentOptions);

    if (data.paymentMethod === 'chapa' && !hasOptionSelected) {
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
      const txRef = ChapaService.generateTxRef('WOLAITA_TOUR');
      setCurrentTxRef(txRef);

      const nameParts = currentUser!.name.split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || 'User';
      const phoneNumber = ChapaService.formatPhoneNumber(data.phone_number);

      sessionStorage.setItem('last_chapa_tx_ref', txRef);
      localStorage.setItem('last_chapa_tx_ref', txRef);

      const formattedPaymentOptions = Array.isArray(data.selectedPaymentOptions)
        ? data.selectedPaymentOptions
        : data.selectedPaymentOptions ? [data.selectedPaymentOptions] : [];

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
        payment_options: formattedPaymentOptions
      };

      paymentRecord = await addDoc(collection(db, 'payments'), {
        bookingId: booking.id,
        tourId: booking.tourId,
        userId: currentUser!.id,
        agencyId: booking.agencyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        method: 'chapa',
        status: 'pending',
        txRef,
        createdAt: Timestamp.now(),
        chapaData: {
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

          let checkInterval: NodeJS.Timeout | null = null;
          let checkCount = 0;
          const maxChecks = 300; // 5 minutes

          const checkClosed = () => {
            if (!popup || popup.closed) {
              console.log('Payment window closed, verifying payment...');
              if (checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
              }
              if (verifyPaymentRef.current) {
                verifyPaymentRef.current(txRef).catch((error) => {
                  console.log('Verification check after popup closed:', error);
                });
              }
            } else {
              try {
                const currentUrl = popup.location.href;
                if (currentUrl.includes('/payment/success') || currentUrl.includes('status=success') || currentUrl.includes('success')) {
                  if (checkInterval) {
                    clearInterval(checkInterval);
                    checkInterval = null;
                  }
                  if (verifyPaymentRef.current) {
                    verifyPaymentRef.current(txRef);
                  }
                  return;
                }
              } catch (e) {
                // Cross-origin restriction expected while on Chapa's domain
              }

              checkCount++;
              if (checkCount >= maxChecks && checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
              }
            }
          };

          checkInterval = setInterval(checkClosed, 1000);
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

  const processManualPayment = async (data: PaymentForm) => {
    setIsProcessing(true);

    try {
      const transferRef = `WOLAITA_${booking.id}_${Date.now()}`;
      let receiptUrl = '';

      if (data.paymentReceipt && data.paymentReceipt.length > 0) {
        receiptUrl = await uploadToCloudinary(data.paymentReceipt[0]);
      }

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
        receiptUrl,
        instructions: {
          bankName: 'Commercial Bank of Ethiopia',
          accountNumber: '1000123456789',
          accountName: 'Wolaita Tours',
          reference: transferRef,
          amount: formatCurrency(getAmount(), data.currency)
        }
      });

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
      const verification = await ChapaService.verifyPayment(txRef);

      if (verification.status === 'success' && verification.data?.status === 'success') {
        try {
          await updateDoc(doc(db, 'bookings', booking.id), {
            paymentStatus: 'paid',
            paymentMethod: 'chapa',
            paymentReference: txRef,
            paymentVerifiedAt: Timestamp.now(),
            status: 'confirmed',
            updatedAt: Timestamp.now()
          });
        } catch (updateError: any) {
          console.error('Error updating booking:', updateError);
          throw updateError;
        }

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
        }

        setPaymentStep('success');
        setIsProcessing(false);
        setIsVerifying(false);
        toast.success('Payment successful!');

        if (paymentWindow && !paymentWindow.closed) {
          paymentWindow.close();
        }
        setPaymentWindow(null);

        setTimeout(() => {
          onPaymentSuccess();
          navigate(`/payment/success?tx_ref=${txRef}&status=success`);
        }, 100);
      } else {
        throw new Error(verification.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setErrorMessage(
        error.message || 'Payment verification failed. Please contact support if money was deducted.'
      );
      setPaymentStep('error');
      setIsProcessing(false);
    }
  };

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
            className="fixed inset-0 transition-opacity bg-slate-950/60 backdrop-blur-xs z-[99998]"
            aria-hidden="true"
          />

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative inline-block w-full max-w-lg p-6 sm:p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl border border-slate-100 z-[100000]"
            onClick={handleModalContentClick}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Complete Payment
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Safe & secure transaction</p>
                </div>
              </div>
              {!isProcessing && (
                <button
                  onClick={handleClose}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Payment Steps */}
            {paymentStep === 'form' && (
              <div className="space-y-6">
                {/* Booking Summary Card */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Booking Summary</h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Tour:</span>
                      <span className="font-bold text-slate-900">{booking.tourName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Participants:</span>
                      <span className="font-bold text-slate-900">{booking.participants}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/80 pt-2 mt-2">
                      <span className="text-slate-700 font-bold">Total Amount:</span>
                      <span className="font-extrabold text-base text-orange-600">
                        {formatCurrency(getAmount(), selectedCurrency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chapa Status */}
                {connectionTested && (
                  <div className={`border rounded-2xl p-4 ${chapaAvailable ? 'bg-emerald-50/70 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex items-center space-x-2">
                      {chapaAvailable ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Info className="h-4 w-4 text-orange-600" />
                      )}
                      <span className={`text-xs font-bold ${chapaAvailable ? 'text-emerald-800' : 'text-orange-800'}`}>
                        {chapaAvailable ? 'Online Instant Gateway Available' : 'Online Gateway Unavailable'}
                      </span>
                    </div>
                    {!chapaAvailable && (
                      <p className="text-xs text-orange-700 mt-1">
                        Manual bank transfer option is available below.
                      </p>
                    )}
                  </div>
                )}

                {/* Payment Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Currency Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Currency
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center space-x-2.5 p-3 border rounded-xl cursor-pointer transition-all ${
                        selectedCurrency === 'ETB' ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}>
                        <input
                          {...register('currency')}
                          type="radio"
                          value="ETB"
                          className="text-orange-500 focus:ring-orange-500 h-4 w-4"
                        />
                        <span className="text-xs font-bold text-slate-800">Ethiopian Birr (ETB)</span>
                      </label>
                      <label className={`flex items-center space-x-2.5 p-3 border rounded-xl cursor-pointer transition-all ${
                        selectedCurrency === 'USD' ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}>
                        <input
                          {...register('currency')}
                          type="radio"
                          value="USD"
                          className="text-orange-500 focus:ring-orange-500 h-4 w-4"
                        />
                        <span className="text-xs font-bold text-slate-800">US Dollar (USD)</span>
                      </label>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Payment Method
                    </label>
                    <div className="space-y-3">
                      {chapaAvailable && (
                        <label className={`flex items-center space-x-3 p-4 border rounded-2xl cursor-pointer transition-all ${
                          selectedPaymentMethod === 'chapa' ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}>
                          <input
                            {...register('paymentMethod')}
                            type="radio"
                            value="chapa"
                            className="text-orange-500 focus:ring-orange-500 h-4 w-4"
                          />
                          <Smartphone className="h-5 w-5 text-orange-500 shrink-0" />
                          <div>
                            <div className="text-sm font-bold text-slate-900">Chapa Online Payment</div>
                            <div className="text-xs text-slate-500">Instant checkout via Telebirr, CBE Birr, cards & bank transfers</div>
                          </div>
                        </label>
                      )}
                      <label className={`flex items-center space-x-3 p-4 border rounded-2xl cursor-pointer transition-all ${
                        selectedPaymentMethod === 'manual' ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}>
                        <input
                          {...register('paymentMethod')}
                          type="radio"
                          value="manual"
                          className="text-orange-500 focus:ring-orange-500 h-4 w-4"
                        />
                        <DollarSign className="h-5 w-5 text-orange-500 shrink-0" />
                        <div>
                          <div className="text-sm font-bold text-slate-900">Manual Bank Payment</div>
                          <div className="text-xs text-slate-500">Bank deposit with receipt upload</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Payment Options for Chapa (FIXED HIGHLIGHT LOGIC) */}
                  {selectedPaymentMethod === 'chapa' && chapaAvailable && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Select Payment Option
                      </label>
                      <div className="grid grid-cols-2 gap-3 max-h-52 overflow-y-auto p-1">
                        {paymentMethods.map((method) => {
                          const isSelected = isOptionSelected(method.id);
                          return (
                            <label
                              key={method.id}
                              onClick={() => handlePaymentOptionSelect(method.id)}
                              className={`flex items-center space-x-3 p-3 border rounded-2xl cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 shadow-xs'
                                  : 'border-slate-200 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="radio"
                                {...register('selectedPaymentOptions', {
                                  required: selectedPaymentMethod === 'chapa' ? 'Please select a payment option' : false
                                })}
                                value={method.id}
                                checked={isSelected}
                                onChange={() => handlePaymentOptionSelect(method.id)}
                                className="text-orange-500 focus:ring-orange-500 h-4 w-4 shrink-0"
                              />
                              <img src={method.icon} alt={method.name} className="h-9 w-9 object-contain shrink-0 rounded-lg" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate">{method.name}</div>
                                <div className="text-[11px] text-slate-500 truncate">{method.description}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      {errors.selectedPaymentOptions && (
                        <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.selectedPaymentOptions.message}</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-2">
                        Select the payment option you'd like to use
                      </p>
                    </div>
                  )}

                  {/* Phone Number for Chapa */}
                  {selectedPaymentMethod === 'chapa' && chapaAvailable && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Phone Number (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <input
                          {...register('phone_number', {
                            pattern: {
                              value: /^(\+251|0)?[9][0-9]{8}$/,
                              message: 'Please enter a valid Ethiopian phone number'
                            }
                          })}
                          type="tel"
                          placeholder="0912345678 or +251912345678"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>
                      {errors.phone_number && (
                        <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.phone_number.message}</p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-400">
                        For mobile wallet checkout (Telebirr, eBirr, CBE Birr)
                      </p>
                    </div>
                  )}

                  {/* Manual Payment Section */}
                  {selectedPaymentMethod === 'manual' && (
                    <div className="space-y-4">
                      <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                        <div className="flex items-center space-x-3 mb-3">
                          <img src="/images/payment/CBElogo.jpg" alt="CBE Logo" className="h-10 w-10 object-contain rounded-lg" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Manual Bank Transfer</h4>
                            <p className="text-xs text-slate-600">Transfer total amount to the account below:</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 text-xs bg-white p-3 rounded-xl border border-slate-100">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Bank Name:</span>
                            <span className="font-bold text-slate-800">Commercial Bank of Ethiopia</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Account Number:</span>
                            <span className="font-mono font-bold text-slate-900">1000123456789</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Account Name:</span>
                            <span className="font-bold text-slate-800">Wolaita Tours</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="paymentReceipt" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Upload Payment Receipt / Screenshot
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
                          className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 transition-colors"
                        />
                        {errors.paymentReceipt && (
                          <p className="mt-1 text-xs text-rose-600 font-medium">{errors.paymentReceipt.message}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Terms Agreement */}
                  <div>
                    <label className="flex items-start space-x-2">
                      <input
                        {...register('agree_terms', { required: 'You must agree to the terms' })}
                        type="checkbox"
                        className="mt-0.5 text-orange-500 focus:ring-orange-500 rounded"
                      />
                      <span className="text-xs text-slate-600">
                        I agree to the{' '}
                        <a href="#" className="text-orange-600 font-semibold hover:underline">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-orange-600 font-semibold hover:underline">
                          Cancellation Policy
                        </a>
                      </span>
                    </label>
                    {errors.agree_terms && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">{errors.agree_terms.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-xs hover:shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Processing...' : `Pay ${formatCurrency(getAmount(), selectedCurrency)}`}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Processing Step */}
            {paymentStep === 'processing' && (
              <div className="text-center py-8 space-y-4">
                <Loader className="h-14 w-14 text-orange-500 animate-spin mx-auto mb-2" />
                <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">Processing Payment</h4>
                <p className="text-slate-600 text-xs max-w-sm mx-auto">
                  {paymentWindow && !paymentWindow.closed
                    ? 'Please complete your payment in the popup window...'
                    : 'Processing your payment transaction...'}
                </p>
                {currentTxRef && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-slate-400 font-mono bg-slate-50 py-1.5 px-3 rounded-xl inline-block border border-slate-100">
                      Ref: {currentTxRef}
                    </p>
                    <div>
                      <button
                        onClick={async () => {
                          if (currentTxRef) {
                            try {
                              setIsVerifying(true);
                              if (verifyPaymentRef.current) {
                                await verifyPaymentRef.current(currentTxRef);
                              } else {
                                await verifyPayment(currentTxRef);
                              }
                            } catch (error: any) {
                              toast.error(error.message || 'Verification failed. Please try again.');
                              setIsVerifying(false);
                            }
                          }
                        }}
                        className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs disabled:opacity-50"
                        disabled={isVerifying || !currentTxRef}
                      >
                        {isVerifying ? 'Verifying...' : 'Check Payment Status'}
                      </button>
                    </div>
                  </div>
                )}
                {paymentUrl && (
                  <div className="pt-2">
                    <a
                      href={paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:text-orange-700 text-xs font-bold underline"
                    >
                      Open payment page manually
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Success Step */}
            {paymentStep === 'success' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">Payment Successful!</h4>
                <p className="text-slate-600 text-xs max-w-sm mx-auto">
                  {selectedPaymentMethod === 'chapa'
                    ? 'Your booking has been confirmed. You will receive a confirmation email shortly.'
                    : 'Your booking request has been submitted. Our team will verify the receipt and confirm your booking.'}
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleClose}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all shadow-xs"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Error Step */}
            {paymentStep === 'error' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                  <AlertCircle className="h-9 w-9" />
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">Payment Issue</h4>
                <p className="text-slate-600 text-xs max-w-sm mx-auto">{errorMessage}</p>
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleRetry}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-all"
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

export default PaymentModal;