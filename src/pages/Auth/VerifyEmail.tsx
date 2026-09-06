import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlEmail = searchParams.get('email');
  const storedEmail = typeof window !== 'undefined' 
    ? (sessionStorage.getItem('pending_verification_email') || localStorage.getItem('pending_verification_email'))
    : null;
  const email = (urlEmail || storedEmail || '').trim();
  const { firebaseUser } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    if (!firebaseUser && !email) {
      toast.error('Please log in or register again to resend verification.');
      return;
    }
    setIsResending(true);
    try {
      if (firebaseUser) {
        const { sendEmailVerification } = await import('firebase/auth');
        await sendEmailVerification(firebaseUser, {
          url: `${window.location.origin}/login?message=verified`,
          handleCodeInApp: false,
        });
        setResendSuccess(true);
        toast.success('Verification email resent successfully!');
      } else {
        toast.success('If the account exists, a new verification email will be dispatched.');
      }
    } catch (err: any) {
      console.error('Resend verification error:', err);
      toast.error(err.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full space-y-8"
      >
        {/* Brand Icon */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-orange-100/80 border border-orange-200/80 text-orange-600 rounded-3xl flex items-center justify-center shadow-xs mb-4 relative">
            <Mail className="h-8 w-8" />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-white shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Verify Your Email
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
            You're almost ready! We've sent a verification link to activate your tourist account.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-10 space-y-6">
          {/* Email Address Display */}
          <div className="text-center space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Verification sent to
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-orange-50 rounded-xl border border-orange-200/80 text-slate-900 font-bold text-sm">
              <Mail className="h-4 w-4 text-orange-600 mr-2 shrink-0" />
              <span className="truncate">{email || 'your registered email'}</span>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3 bg-slate-50 rounded-2xl p-5 border border-slate-200/70 text-left">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Next Steps:</p>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start space-x-2.5">
                <span className="shrink-0 h-5 w-5 rounded-full bg-orange-100 text-orange-800 font-bold text-xs flex items-center justify-center">1</span>
                <p>Open your email inbox and look for the email from <strong>Wolaita Tours</strong>.</p>
              </div>
              <div className="flex items-start space-x-2.5">
                <span className="shrink-0 h-5 w-5 rounded-full bg-orange-100 text-orange-800 font-bold text-xs flex items-center justify-center">2</span>
                <p>Click the <strong>activation link</strong> inside to verify your address.</p>
              </div>
              <div className="flex items-start space-x-2.5">
                <span className="shrink-0 h-5 w-5 rounded-full bg-orange-100 text-orange-800 font-bold text-xs flex items-center justify-center">3</span>
                <p>Return here and <strong>Sign In</strong> to start exploring tours!</p>
              </div>
            </div>
          </div>

          {/* Spam / Junk Folder Alert Box */}
          <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 text-left flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="text-xs text-orange-950 space-y-1">
              <p className="font-bold">Can't find the email in your inbox?</p>
              <p className="text-orange-900 leading-relaxed">
                Please check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder. Automated activation emails can sometimes be misrouted.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-2">
            <Link
              to="/login"
              className="w-full flex items-center justify-center py-3.5 px-6 rounded-xl text-white bg-orange-500 hover:bg-orange-600 font-bold text-sm shadow-xs hover:shadow-md transition-all group"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="inline-flex items-center text-orange-600 hover:text-orange-700 font-bold transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>{isResending ? 'Sending...' : 'Resend verification email'}</span>
              </button>

              <Link
                to="/register"
                className="inline-flex items-center text-slate-500 hover:text-slate-700 font-bold transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                <span>Back to Register</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
