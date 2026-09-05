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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full space-y-6"
      >
        {/* Brand Icon */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl flex items-center justify-center shadow-md relative">
            <Mail className="h-10 w-10 text-amber-600" />
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white shadow">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight">
            Verify Your Email
          </h1>
          <p className="mt-2 text-sm text-gray-600 max-w-sm mx-auto">
            You're almost there! We've sent a verification link to activate your tourist account.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
          {/* Email Address Display */}
          <div className="text-center space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Verification sent to
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-amber-50 rounded-xl border border-amber-200/70 text-gray-900 font-semibold text-sm">
              <Mail className="h-4 w-4 text-amber-600 mr-2 flex-shrink-0" />
              <span className="truncate">{email || 'your registered email'}</span>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200/70 text-left">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Next Steps:</p>
            <div className="space-y-2.5 text-xs text-gray-600">
              <div className="flex items-start space-x-2.5">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">1</span>
                <p>Open your email inbox and look for the message from <strong>Wolaita Tours</strong>.</p>
              </div>
              <div className="flex items-start space-x-2.5">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">2</span>
                <p>Click the <strong>activation link</strong> inside to verify your address.</p>
              </div>
              <div className="flex items-start space-x-2.5">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">3</span>
                <p>Return here and <strong>Sign In</strong> to start exploring tours!</p>
              </div>
            </div>
          </div>

          {/* Spam / Junk Folder Alert Box */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 text-left flex items-start space-x-3 shadow-xs">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold text-amber-950">Can't find the email in your inbox?</p>
              <p className="text-amber-800 leading-relaxed">
                Please check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder. Automated activation emails can sometimes be misrouted by email providers.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Link
              to="/login"
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-amber-600 hover:bg-amber-700 shadow-md transition-all duration-200 group"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isResending ? 'animate-spin' : ''}`} />
                {isResending ? 'Sending...' : 'Resend verification email'}
              </button>

              <Link
                to="/register"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back to Register
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
