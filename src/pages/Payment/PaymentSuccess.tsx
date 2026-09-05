import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Download, Calendar, MapPin, Users, AlertTriangle } from 'lucide-react';
import { ChapaService } from '../../services/chapaService';
import { doc, updateDoc, getDoc, query, collection, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  const txRef = searchParams.get('tx_ref');
  const status = searchParams.get('status');

  // Get dashboard route based on user role
  const getDashboardRoute = useMemo(() => {
    if (!currentUser) return '/dashboard';
    switch (currentUser.role) {
      case 'tourist':
        return '/tourist';
      case 'agency':
        return '/agency';
      case 'admin':
        return '/dashboard';
      case 'cashier':
        return '/cashier';
      default:
        return '/dashboard';
    }
  }, [currentUser]);

  useEffect(() => {
    if (txRef && status === 'success') {
      verifyPayment();

      // Fallback: If verification takes too long or fails, still redirect after 5 seconds
      const fallbackTimeout = setTimeout(() => {
        if (isVerifying) {
          console.log('Verification taking too long...');
        }
      }, 5000);

      return () => clearTimeout(fallbackTimeout);
    } else if (txRef && status === 'failed') {
      setError('Payment was not completed successfully');
      setIsVerifying(false);
    } else {
      setError('Invalid payment parameters');
      setIsVerifying(false);
    }
  }, [txRef, status, navigate, getDashboardRoute, isVerifying]);

  const verifyPayment = async () => {
    try {
      setIsVerifying(true);

      // Add delay to ensure Chapa has processed the payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Verifying payment for tx_ref:', txRef);

      // Verify payment with Chapa
      const verification = await ChapaService.verifyPayment(txRef!);

      console.log('Verification result:', verification);

      if (verification.status === 'success' && verification.data.status === 'success') {
        // Get booking details from meta data or find by payment record
        let bookingId = verification.data.meta?.booking_id;

        if (!bookingId) {
          // Try to find payment record by tx_ref
          const paymentsQuery = query(
            collection(db, 'payments'),
            where('txRef', '==', txRef)
          );
          const paymentDocs = await getDocs(paymentsQuery);

          if (!paymentDocs.empty) {
            const paymentData = paymentDocs.docs[0].data();
            bookingId = paymentData.bookingId;
          }
        }

        if (bookingId) {
          // Update booking status - ensure paymentStatus is set to 'paid'
          console.log('Updating booking:', bookingId, 'with paymentStatus: paid');
          try {
            await updateDoc(doc(db, 'bookings', bookingId), {
              paymentStatus: 'paid',
              paymentMethod: 'chapa',
              paymentReference: txRef,
              paymentVerifiedAt: Timestamp.now(),
              status: 'confirmed',
              updatedAt: Timestamp.now()
            });
            console.log('Booking updated successfully');

            // Verify the update
            const updatedBooking = await getDoc(doc(db, 'bookings', bookingId));
            if (updatedBooking.exists()) {
              console.log('Updated booking data:', updatedBooking.data());
            }
          } catch (updateError: any) {
            console.error('Error updating booking:', updateError);
            // Try to get current booking to see what's there
            const currentBooking = await getDoc(doc(db, 'bookings', bookingId));
            if (currentBooking.exists()) {
              console.log('Current booking before update:', currentBooking.data());
            }
            throw updateError;
          }

          // Update payment record if exists
          const paymentsQuery = query(
            collection(db, 'payments'),
            where('txRef', '==', txRef)
          );
          const paymentDocs = await getDocs(paymentsQuery);

          if (!paymentDocs.empty) {
            const paymentDocRef = paymentDocs.docs[0].ref;
            await updateDoc(paymentDocRef, {
              status: 'completed',
              verificationData: verification.data,
              verifiedAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
          }

          // Get updated booking details
          const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
          if (bookingDoc.exists()) {
            setBookingDetails({ id: bookingDoc.id, ...bookingDoc.data() });
          }
        }

        setPaymentVerified(true);
        toast.success('Payment verified successfully!');

        // toast.success('Payment verified successfully!');

        // Auto-redirect to dashboard after 5 seconds
        setRedirectCountdown(5);
        const interval = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              navigate(getDashboardRoute);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        throw new Error(`Payment verification failed: Status is ${verification.data.status}`);
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      // Even if verification fails, if status is success, redirect after showing error
      if (status === 'success') {
        setPaymentVerified(true);
        toast.error('Payment received but verification had issues. Redirecting to dashboard...');

        // Auto-redirect on error too
        setTimeout(() => navigate(getDashboardRoute), 3000);
      } else {
        setError(error.message || 'Failed to verify payment');
        toast.error('Payment verification failed');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const downloadReceipt = () => {
    if (!bookingDetails) return;

    // Generate and download receipt
    const receiptData = {
      bookingId: bookingDetails.id,
      tourName: bookingDetails.tourName,
      amount: bookingDetails.totalPrice,
      participants: bookingDetails.participants,
      paymentReference: txRef,
      date: new Date().toLocaleDateString(),
      customerName: bookingDetails.touristName,
      tourDate: bookingDetails.tourDate?.toDate?.()?.toLocaleDateString() || 'TBD'
    };

    const receiptText = `
WOLAITA TOURS - PAYMENT RECEIPT
================================

Booking ID: ${receiptData.bookingId}
Customer: ${receiptData.customerName}
Tour: ${receiptData.tourName}
Tour Date: ${receiptData.tourDate}
Participants: ${receiptData.participants}
Amount Paid: $${receiptData.amount}
Payment Reference: ${receiptData.paymentReference}
Payment Date: ${receiptData.date}

Status: CONFIRMED

Thank you for choosing Wolaita Tours!
For support, contact: info@wolaitatours.com
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wolaita-tours-receipt-${receiptData.bookingId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Verification Issue</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                If you believe this is an error and money was deducted from your account,
                please contact our support team with reference: <strong>{txRef}</strong>
              </p>
              <Link
                to="/dashboard"
                className="block w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/tours"
                className="block w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Browse Tours
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          {/* Success Header */}
          <div className="bg-green-50 px-6 py-8 text-center border-b">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-lg text-gray-600">
              Your booking has been confirmed. Get ready for an amazing experience!
            </p>
            {txRef && (
              <p className="text-sm text-gray-500 mt-2">
                Reference: {txRef}
              </p>
            )}
            {redirectCountdown > 0 && (
              <p className="text-sm text-amber-600 mt-3 font-medium">
                Redirecting to dashboard in {redirectCountdown}s...
              </p>
            )}

          </div>

          {/* Booking Details */}
          {bookingDetails && (
            <div className="px-6 py-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Booking Details</h2>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Tour Name</label>
                    <p className="text-lg font-semibold text-gray-900">{bookingDetails.tourName}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Booking ID</label>
                    <p className="text-gray-900 font-mono text-sm">{bookingDetails.id}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Payment Reference</label>
                    <p className="text-gray-900 font-mono text-sm">{txRef}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Customer</label>
                    <p className="text-gray-900">{bookingDetails.touristName}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Participants</label>
                      <p className="text-gray-900">{bookingDetails.participants} people</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Tour Date</label>
                      <p className="text-gray-900">
                        {bookingDetails.tourDate?.toDate?.()?.toLocaleDateString() || 'To be confirmed'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 flex items-center justify-center">
                      <span className="text-green-600 font-bold text-lg">$</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Total Amount</label>
                      <p className="text-xl font-bold text-green-600">${bookingDetails.totalPrice}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Status</label>
                      <p className="text-green-600 font-semibold">Confirmed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {bookingDetails.specialRequests && (
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-500 mb-2">Special Requests</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900">{bookingDetails.specialRequests}</p>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-amber-800 mb-3">What's Next?</h3>
                <ul className="space-y-2 text-amber-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>You will receive a confirmation email with detailed itinerary</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Our team will contact you 24-48 hours before your tour</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Check your dashboard for booking updates and messages</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Keep your booking reference for any inquiries: {bookingDetails.id}</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={downloadReceipt}
                  className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
                >
                  <Download className="h-5 w-5" />
                  <span>Download Receipt</span>
                </button>

                <button
                  onClick={() => navigate(getDashboardRoute)}
                  className="flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
                >
                  <span>Go to Dashboard</span>
                </button>

                <Link
                  to="/tours"
                  className="flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors"
                >
                  <span>Browse More Tours</span>
                </Link>
              </div>
            </div>
          )}

          {/* No booking details found */}
          {!bookingDetails && paymentVerified && (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-600 mb-4">
                Payment was successful, but we couldn't retrieve booking details.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please check your dashboard or contact support with reference: {txRef}
              </p>
              <button
                onClick={() => navigate(getDashboardRoute)}
                className="inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                <span>Go to Dashboard</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};