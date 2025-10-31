// Create a new file PaymentCallback.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export const PaymentCallback = () => {
  const { tx_ref } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!tx_ref) {
          throw new Error('No transaction reference provided');
        }

        // Check Firestore first
        const paymentRef = doc(db, 'payments', tx_ref);
        const paymentSnap = await getDoc(paymentRef);
        
        if (paymentSnap.exists() && paymentSnap.data().status === 'paid') {
          setStatus('success');
          toast.success('Payment already verified!');
          return;
        }

        // Verify with backend
        const response = await fetch(`/api/chapa/verify/${tx_ref}`);
        const data = await response.json();

        if (data.status === 'success' && data.data?.status === 'success') {
          // Update payment record
          await updateDoc(paymentRef, {
            status: 'paid',
            verifiedAt: new Date(),
            updatedAt: new Date()
          });

          // Update booking
          const bookingId = data.meta?.booking_id;
          if (bookingId) {
            await updateDoc(doc(db, 'bookings', bookingId), {
              paymentStatus: 'paid',
              paymentMethod: 'chapa',
              paymentReference: tx_ref,
              paymentVerifiedAt: new Date(),
              status: 'confirmed',
              updatedAt: new Date()
            });
          }

          setStatus('success');
          toast.success('Payment verified successfully!');
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
  }, [tx_ref]);

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
              onClick={() => navigate('/bookings')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium"
            >
              View Bookings
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
                onClick={() => navigate('/')}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Return Home
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