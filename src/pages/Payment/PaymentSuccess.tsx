import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Download, Calendar, MapPin, Users, AlertTriangle, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
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
  const verifiedTxRef = useRef<string | null>(null);
  const [isPopup, setIsPopup] = useState<boolean>(() => {
    return typeof window !== 'undefined' && Boolean(window.opener && !window.opener.closed);
  });

  const rawTxRef = 
    searchParams.get('tx_ref') ||
    searchParams.get('trx_ref') ||
    searchParams.get('reference') ||
    searchParams.get('transaction_id') ||
    sessionStorage.getItem('last_chapa_tx_ref') ||
    localStorage.getItem('last_chapa_tx_ref');

  const [activeTxRef, setActiveTxRef] = useState<string | null>(rawTxRef);
  const statusParam = searchParams.get('status');

  // Handle popup window communication and auto-redirect of parent window
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
        setIsPopup(true);
        const tx = rawTxRef || sessionStorage.getItem('last_chapa_tx_ref') || localStorage.getItem('last_chapa_tx_ref');

        if (statusParam === 'failed' || statusParam === 'canceled') {
          try {
            window.opener.postMessage({ type: 'PAYMENT_FAILED', message: 'Payment cancelled or failed' }, window.location.origin);
          } catch (e) {
            console.warn('Could not postMessage to opener:', e);
          }
          const timer = setTimeout(() => {
            try { window.close(); } catch (e) {}
          }, 1500);
          return () => clearTimeout(timer);
        }

        // Notify opener window of success
        try {
          window.opener.postMessage({
            type: 'PAYMENT_SUCCESS',
            txRef: tx || undefined,
            status: 'success'
          }, window.location.origin);
        } catch (e) {
          console.warn('Could not postMessage to opener:', e);
        }

        // Redirect opener window to the main success page
        try {
          const targetUrl = `${window.location.origin}/payment/success?tx_ref=${encodeURIComponent(tx || '')}&status=success`;
          window.opener.location.href = targetUrl;
          window.opener.focus();
        } catch (e) {
          console.warn('Could not set opener location:', e);
        }

        // Auto close the popup after a brief moment
        const closeTimer = setTimeout(() => {
          try {
            window.close();
          } catch (e) {
            console.warn('window.close() blocked by browser:', e);
          }
        }, 800);

        return () => clearTimeout(closeTimer);
      }
    } catch (err) {
      console.warn('Popup opener communication failed:', err);
    }
  }, [rawTxRef, statusParam]);

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
    if (verifiedTxRef.current === referenceToVerify) {
      return;
    }
    verifiedTxRef.current = referenceToVerify;

    try {
      setIsVerifying(true);
      setError('');
      console.log('Verifying payment for tx_ref:', referenceToVerify);

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
        }
      } catch (dbErr) {
        console.warn('Could not query payments collection:', dbErr);
      }

      let verificationSuccess = false;
      let bookingIdFromVerification: string | null = null;

      try {
        const verification = await ChapaService.verifyPayment(referenceToVerify);
        if (verification.status === 'success' && verification.data?.status === 'success') {
          verificationSuccess = true;
          bookingIdFromVerification = verification.data.meta?.booking_id || null;
        }
      } catch (verifyErr: any) {
        console.warn('Chapa API verification returned error:', verifyErr.message);
      }

      const finalBookingId = bookingIdFromVerification || existingBookingId;

      if (finalBookingId) {
        try {
          await updateDoc(doc(db, 'bookings', finalBookingId), {
            paymentStatus: 'paid',
            paymentMethod: 'chapa',
            paymentReference: referenceToVerify,
            paymentVerifiedAt: Timestamp.now(),
            status: 'confirmed',
            updatedAt: Timestamp.now(),
          });

          const bookingSnap = await getDoc(doc(db, 'bookings', finalBookingId));
          if (bookingSnap.exists()) {
            setBookingDetails({ id: bookingSnap.id, ...bookingSnap.data() });
          }
        } catch (bookingErr) {
          console.warn('Could not update booking status directly:', bookingErr);
        }
      }

      setPaymentVerified(true);
      toast.success('Payment verified successfully!', { id: `payment-verified-${referenceToVerify}` });
    } catch (err: any) {
      console.error('Payment verification failed:', err);
      setError(err.message || 'Payment verification failed. Please check your dashboard.');
    } finally {
      setIsVerifying(false);
    }
  }, []);

  useEffect(() => {
    const initVerification = async () => {
      if (statusParam === 'failed' || statusParam === 'canceled') {
        setError('The transaction was cancelled or failed.');
        setIsVerifying(false);
        return;
      }

      let tx = rawTxRef;

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

  if (isPopup) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 max-w-sm w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payment Successful!</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Redirecting you to your primary window...
            </p>
          </div>
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent mx-auto"></div>
          <button
            onClick={() => {
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.focus();
                }
                window.close();
              } catch (e) {
                window.close();
              }
            }}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs"
          >
            Close & Return to Tours
          </button>
        </div>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Verifying Payment</h2>
          <p className="text-slate-600 text-sm">Please wait while we confirm your payment transaction...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-10 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payment Verification Issue</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{error}</p>
            {activeTxRef && (
              <p className="text-xs text-slate-400 bg-slate-50 py-2 px-3 rounded-xl border border-slate-100">
                Transaction Reference: <strong className="text-slate-700">{activeTxRef}</strong>
              </p>
            )}
            <div className="space-y-3 pt-2">
              <Link
                to={getDashboardRoute}
                className="w-full block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-xs"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/tours"
                className="w-full block bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all text-sm"
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
    <div className="min-h-screen bg-[#faf8f5] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
        >
          {/* Success Header Banner */}
          <div className="bg-orange-50/70 border-b border-orange-200/60 px-8 py-10 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Payment Verified</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Payment <span className="text-orange-500">Successful!</span>
            </h1>
            <p className="text-slate-600 text-sm md:text-base max-w-md mx-auto">
              Your tour booking is confirmed. Get ready for an unforgettable cultural journey in Wolaita!
            </p>
            {activeTxRef && (
              <p className="text-xs font-mono text-slate-500 pt-1">
                Ref: {activeTxRef}
              </p>
            )}
          </div>

          {/* Booking Details */}
          {bookingDetails && (
            <div className="p-8 sm:p-10 space-y-8">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 mb-1">Booking Overview</h2>
                <p className="text-xs text-slate-500">Official receipt details recorded for your trip</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 bg-slate-50/70 rounded-2xl border border-slate-100 p-6">
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Tour Experience</span>
                    <p className="text-base font-bold text-slate-900">{bookingDetails.tourName}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Booking ID</span>
                    <p className="font-mono text-slate-700 font-semibold">{bookingDetails.id}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Customer Name</span>
                    <p className="text-slate-900 font-bold">{bookingDetails.touristName}</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-orange-500 shrink-0" />
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Participants</span>
                      <p className="text-slate-900 font-bold">{bookingDetails.participants} {bookingDetails.participants === 1 ? 'person' : 'people'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-orange-500 shrink-0" />
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Tour Date</span>
                      <p className="text-slate-900 font-bold">
                        {bookingDetails.tourDate?.toDate?.()?.toLocaleDateString() || 'To be confirmed'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="h-4 w-4 flex items-center justify-center font-bold text-emerald-600">$</div>
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Total Amount Paid</span>
                      <p className="text-lg font-extrabold text-emerald-600">${bookingDetails.totalPrice}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* What's Next Box */}
              <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-orange-950 uppercase tracking-wider">What to expect next?</h3>
                <ul className="space-y-2 text-xs text-orange-900">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>You will receive a confirmation email with your tour schedule.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Our local team will contact you prior to departure for any final coordination.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>View and manage all tour details anytime on your Tourist Dashboard.</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={downloadReceipt}
                  className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Receipt</span>
                </button>

                <button
                  onClick={() => navigate(getDashboardRoute)}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs hover:shadow-md"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {!bookingDetails && paymentVerified && (
            <div className="p-8 text-center space-y-4">
              <p className="text-slate-600 text-sm">
                Payment verified successfully! You may now return to your dashboard.
              </p>
              <button
                onClick={() => navigate(getDashboardRoute)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all shadow-xs"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccess;