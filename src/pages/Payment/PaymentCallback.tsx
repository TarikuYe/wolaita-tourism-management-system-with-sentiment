// Create a new file PaymentCallback.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export const PaymentCallback = () => {
  const { tx_ref } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [error, setError] = useState('');

  // Get dashboard route based on user role
  const getDashboardRoute = () => {
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
  };

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!tx_ref) {
          throw new Error('No transaction reference provided');
        }

        // Check Firestore first
        const paymentRef = doc(db, 'payments', tx_ref);
        const paymentSnap = await getDoc(paymentRef);
        
        // Check if payment is already completed
        if (paymentSnap.exists()) {
          const paymentData = paymentSnap.data();
          if (paymentData.status === 'completed' || paymentData.status === 'paid') {
            // Still update booking status to 'paid' if not already set
            if (paymentData.bookingId) {
              const bookingRef = doc(db, 'bookings', paymentData.bookingId);
              const bookingSnap = await getDoc(bookingRef);
              if (bookingSnap.exists()) {
                const bookingData = bookingSnap.data();
                if (bookingData.paymentStatus !== 'paid') {
                  await updateDoc(bookingRef, {
                    paymentStatus: 'paid',
                    paymentMethod: 'chapa',
                    paymentReference: tx_ref,
                    paymentVerifiedAt: Timestamp.now(),
                    status: 'confirmed',
                    updatedAt: Timestamp.now()
                  });
                }
              }
            }
            setStatus('success');
            toast.success('Payment already verified!');
            return;
          }
        }

        // Verify with backend
        const response = await fetch(`/api/chapa/verify/${tx_ref}`);
        const data = await response.json();

        if (data.status === 'success' && data.data?.status === 'success') {
          // Update payment record
          await updateDoc(paymentRef, {
            status: 'completed',
            verifiedAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });

          // Update booking - ensure paymentStatus is set to 'paid'
          const bookingId = data.data?.meta?.booking_id || data.meta?.booking_id;
          let finalBookingId = bookingId;
          
          if (!finalBookingId) {
            // Try to find booking by payment record
            const paymentData = paymentSnap.data();
            finalBookingId = paymentData.bookingId;
          }
          
          if (finalBookingId) {
            console.log('Updating booking:', finalBookingId, 'with paymentStatus: paid');
            try {
              // First, get the current booking to verify it exists
              const bookingRef = doc(db, 'bookings', finalBookingId);
              const bookingSnap = await getDoc(bookingRef);
              
              if (bookingSnap.exists()) {
                const currentData = bookingSnap.data();
                console.log('Current booking data before update:', currentData);
                
                await updateDoc(bookingRef, {
                  paymentStatus: 'paid',
                  paymentMethod: 'chapa',
                  paymentReference: tx_ref,
                  paymentVerifiedAt: Timestamp.now(),
                  status: 'confirmed',
                  updatedAt: Timestamp.now()
                });
                
                // Verify the update
                const updatedSnap = await getDoc(bookingRef);
                if (updatedSnap.exists()) {
                  console.log('Updated booking data:', updatedSnap.data());
                }
              } else {
                console.error('Booking not found:', finalBookingId);
              }
            } catch (updateError: any) {
              console.error('Error updating booking:', updateError);
              throw updateError;
            }
          } else {
            console.warn('No booking ID found for payment verification');
          }

          setStatus('success');
          toast.success('Payment verified successfully!');
          
          // Auto-redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate(getDashboardRoute());
          }, 3000);
        } else {
          throw new Error(data.message || 'Payment verification failed');
        }
      } catch (err: any) {
        console.error('Verification error:', err);
        setStatus('failed');
        setError(err.message);
        toast.error(err.message || 'Payment verification failed');
      }
    };

    verifyPayment();
  }, [tx_ref, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {status === 'pending' && (
          <>
            <Loader className="h-12 w-12 text-amber-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">Your booking has been confirmed.</p>
            <button
              onClick={() => navigate(getDashboardRoute())}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Go to Dashboard
            </button>
          </>
        )}
        
        {status === 'failed' && (
          <>
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Payment Verification Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate(getDashboardRoute())}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50"
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};