import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export const PaymentCallback: React.FC = () => {
  const { tx_ref } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [error, setError] = useState('');

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

  const verifiedTxRef = React.useRef<string | null>(null);

  useEffect(() => {
    // If in popup window, communicate with opener
    if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage({ type: 'PAYMENT_SUCCESS', txRef: tx_ref, status: 'success' }, window.location.origin);
        window.opener.location.href = `${window.location.origin}/payment/success?tx_ref=${encodeURIComponent(tx_ref || '')}&status=success`;
        window.opener.focus();
      } catch (e) {
        console.warn('Failed to communicate with opener in callback:', e);
      }
      setTimeout(() => {
        try { window.close(); } catch (e) {}
      }, 800);
    }
  }, [tx_ref]);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!tx_ref) return;
      if (verifiedTxRef.current === tx_ref) return;
      verifiedTxRef.current = tx_ref;

      try {
        const paymentRef = doc(db, 'payments', tx_ref);
        const paymentSnap = await getDoc(paymentRef);
        
        if (paymentSnap.exists()) {
          const paymentData = paymentSnap.data();
          if (paymentData.status === 'completed' || paymentData.status === 'paid') {
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
            toast.success('Payment already verified!', { id: `payment-callback-${tx_ref}` });
            navigate(`/payment/success?tx_ref=${tx_ref}&status=success`);
            return;
          }
        }

        const response = await fetch(`/api/chapa/verify/${tx_ref}`);
        const data = await response.json();

        if (data.status === 'success' && data.data?.status === 'success') {
          await updateDoc(paymentRef, {
            status: 'completed',
            verifiedAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });

          const bookingId = data.data?.meta?.booking_id || data.meta?.booking_id;
          let finalBookingId = bookingId;
          
          if (!finalBookingId && paymentSnap.exists()) {
            const paymentData = paymentSnap.data();
            finalBookingId = paymentData?.bookingId;
          }
          
          if (finalBookingId) {
            const bookingRef = doc(db, 'bookings', finalBookingId);
            const bookingSnap = await getDoc(bookingRef);
            
            if (bookingSnap.exists()) {
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

          setStatus('success');
          toast.success('Payment verified successfully!', { id: `payment-callback-${tx_ref}` });
          navigate(`/payment/success?tx_ref=${tx_ref}&status=success`);
        } else {
          throw new Error(data.message || 'Payment verification failed');
        }
      } catch (err: any) {
        console.error('Verification error:', err);
        setStatus('failed');
        setError(err.message);
        toast.error(err.message || 'Payment verification failed', { id: `payment-callback-error-${tx_ref}` });
      }
    };

    verifyPayment();
  }, [tx_ref, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] p-4">
      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-xs max-w-md w-full text-center space-y-6">
        {status === 'pending' && (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Verifying Payment</h2>
            <p className="text-slate-600 text-sm">Please wait while we confirm your payment transaction with Chapa...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payment Successful!</h2>
            <p className="text-slate-600 text-sm">Your booking has been confirmed.</p>
            <button
              onClick={() => navigate(getDashboardRoute())}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-xs text-sm"
            >
              Go to Dashboard
            </button>
          </div>
        )}
        
        {status === 'failed' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="h-9 w-9" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payment Verification Failed</h2>
            <p className="text-slate-600 text-sm">{error}</p>
            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate(getDashboardRoute())}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-xs text-sm"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;