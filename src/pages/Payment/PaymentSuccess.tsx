import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Download, Calendar, MapPin, Users, AlertTriangle } from 'lucide-react';
import { ChapaService } from '../../services/chapaService';
import { doc, updateDoc, getDoc, query, collection, where, getDocs, Timestamp, limit } from 'firebase/firestore';
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

  // Retrieve transaction reference from multiple possible query parameters or storage
  const rawTxRef = 
    searchParams.get('tx_ref') ||
    searchParams.get('trx_ref') ||
    searchParams.get('reference') ||
    searchParams.get('transaction_id') ||
    sessionStorage.getItem('last_chapa_tx_ref') ||
    localStorage.getItem('last_chapa_tx_ref');

  const [activeTxRef, setActiveTxRef] = useState<string | null>(rawTxRef);
  const statusParam = searchParams.get('status');

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

  const verifyPayment = useCallback(async (referenceToVerify: string) => {
    try {
      setIsVerifying(true);
      setError('');
      console.log('Verifying payment for tx_ref:', referenceToVerify);

      // 1. First check if payment is already recorded/completed in Firestore
      let existingBookingId: string | null = null;
      try {
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('txRef', '==', referenceToVerify)
        );
        const paymentDocs = await getDocs(paymentsQuery);

        if (!paymentDocs.empty) {
          const paymentData = paymentDocs.docs[0].data();
          existingBookingId = paymentData.bookingId;

          if (paymentData.status === 'completed' || paymentData.status === 'paid') {
            console.log('Payment already marked as completed in database');
          }
        }
      } catch (dbErr) {
        console.warn('Could not query payments collection:', dbErr);
      }

      // 2. Verify with Chapa API
      let verificationSuccess = false;
      let bookingIdFromVerification: string | null = null;

      try {
        const verification = await ChapaService.verifyPayment(referenceToVerify);
        console.log('Verification result from Chapa:', verification);

        if (verification.status === 'success' && verification.data?.status === 'success') {
          verificationSuccess = true;
          bookingIdFromVerification = verification.data.meta?.booking_id || null;
        }
      } catch (verifyErr: any) {
        console.warn('Chapa API verification returned error:', verifyErr.message);
      }

      const finalBookingId = bookingIdFromVerification || existingBookingId;

      // 3. Update Firestore if verification succeeded or if already confirmed
      if (finalBookingId) {
        try {
          // Update booking status
          await updateDoc(doc(db, 'bookings', finalBookingId), {
            paymentStatus: 'paid',
            paymentMethod: 'chapa',
            paymentReference: referenceToVerify,
            paymentVerifiedAt: Timestamp.now(),
            status: 'confirmed',
            updatedAt: Timestamp.now()
          });

          // Update payment record in Firestore
          const paymentsQuery = query(
            collection(db, 'payments'),
            where('txRef', '==', referenceToVerify)
          );
          const paymentDocs = await getDocs(paymentsQuery);
          if (!paymentDocs.empty) {
            await updateDoc(paymentDocs.docs[0].ref, {
              status: 'completed',
              verifiedAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
          }

          // Fetch full booking details to show receipt
          const bookingDoc = await getDoc(doc(db, 'bookings', finalBookingId));
          if (bookingDoc.exists()) {
            setBookingDetails({ id: bookingDoc.id, ...bookingDoc.data() });
          }
        } catch (updateErr) {
          console.error('Error updating booking in Firestore:', updateErr);
        }
      }

      // Clean storage reference
      sessionStorage.removeItem('last_chapa_tx_ref');
      localStorage.removeItem('last_chapa_tx_ref');

      setPaymentVerified(true);
      toast.success('Payment confirmed successfully!');
    } catch (err: any) {
      console.error('Payment verification error:', err);
      setError(err.message || 'Failed to verify payment');
    } finally {
      setIsVerifying(false);
    }
  }, []);

  useEffect(() => {
    const initVerification = async () => {
      if (statusParam === 'failed') {
        setError('Payment was not completed successfully');
        setIsVerifying(false);
        return;
      }

      let tx = rawTxRef;

      // If no reference in URL/storage, search for user's most recent payment in Firestore
      if (!tx && currentUser?.id) {
        try {
          const paymentsQuery = query(
            collection(db, 'payments'),
            where('userId', '==', currentUser.id),
            limit(5)
          );
          const paymentDocs = await getDocs(paymentsQuery);
          if (!paymentDocs.empty) {
            const sorted = paymentDocs.docs
              .map(d => ({ id: d.id, ...d.data() } as any))
              .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

            const latest = sorted[0];
            if (latest && latest.txRef) {
              tx = latest.txRef;
              setActiveTxRef(latest.txRef);
            }
          }
        } catch (err) {
          console.error('Error finding recent payment:', err);
        }
      }

      if (tx) {
        verifyPayment(tx);
      } else {
        setError('No active payment transaction reference was found.');
        setIsVerifying(false);
      }
    };

    initVerification();
  }, [rawTxRef, statusParam, currentUser?.id, verifyPayment]);

  const downloadReceipt = () => {
    if (!bookingDetails) return;

    // Generate and download receipt
    const receiptData = {
      bookingId: bookingDetails.id,
      tourName: bookingDetails.tourName,
      amount: bookingDetails.totalPrice,
      participants: bookingDetails.participants,
      paymentReference: activeTxRef || bookingDetails.paymentReference || 'N/A',
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
              {activeTxRef && (
                <p className="text-sm text-gray-500 mb-4">
                  If you believe this is an error and money was deducted from your account,
                  please contact our support team with reference: <strong>{activeTxRef}</strong>
                </p>
              )}
              <Link
                to={getDashboardRoute}
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
            {activeTxRef && (
              <p className="text-sm text-gray-500 mt-2">
                Reference: {activeTxRef}
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
                    <p className="text-gray-900 font-mono text-sm">{activeTxRef || bookingDetails.paymentReference || 'N/A'}</p>
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
                Please check your dashboard or contact support with reference: {activeTxRef || 'N/A'}
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