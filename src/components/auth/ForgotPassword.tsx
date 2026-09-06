import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Info, RefreshCw, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';

interface ForgotPasswordForm {
  email: string;
}

export const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { sendPasswordResetEmail } = useAuth();
  const { t } = useLanguage();

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setErrorMessage(null);
    const email = data.email.trim();
    
    try {
      await sendPasswordResetEmail(email);
      setSubmittedEmail(email);
      toast.success('Password reset link sent to your email!');
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorText = 'Unable to send password reset email. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorText = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorText = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorText = 'Too many requests. Please wait a few minutes before trying again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorText = 'Network error. Please verify your internet connection.';
      }

      setErrorMessage(errorText);
      toast.error(errorText);
    } finally {
      setIsLoading(false);
    }
  };

  const getTranslation = (key: string): string => {
    const translation = t(key);
    return Array.isArray(translation) ? translation[0] : translation;
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header Icon */}
        <div className="text-center">
          <div className="mx-auto h-14 w-14 bg-orange-100/80 border border-orange-200/80 text-orange-600 rounded-2xl flex items-center justify-center shadow-xs mb-4">
            <KeyRound className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {submittedEmail ? 'Check Your Email' : getTranslation('auth.forgotPassword.title') || 'Reset Password'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {submittedEmail 
              ? 'Password reset instructions have been dispatched' 
              : getTranslation('auth.forgotPassword.subtitle') || "Enter your email and we'll send a recovery link"}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-10">
          {submittedEmail ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center"
            >
              <div className="mx-auto h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  We have sent a secure password recovery link to:
                </p>
                <p className="text-sm font-bold text-slate-900 bg-orange-50 py-2 px-4 rounded-xl border border-orange-200/80 inline-block">
                  {submittedEmail}
                </p>
              </div>

              {/* Spam / Junk Folder Notice Box */}
              <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-4 text-left flex items-start space-x-3">
                <Info className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div className="text-xs text-orange-900 space-y-1">
                  <p className="font-bold">Can't find the email?</p>
                  <p className="text-orange-800">
                    Please check your <strong>Spam</strong> or <strong>Junk</strong> folder. Automated recovery emails may occasionally be filtered there.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  to="/login"
                  className="w-full flex justify-center py-3.5 px-4 text-sm font-bold rounded-xl text-white bg-orange-500 hover:bg-orange-600 shadow-xs hover:shadow-md transition-all"
                >
                  Return to Sign In
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setSubmittedEmail(null);
                    setErrorMessage(null);
                  }}
                  className="w-full flex items-center justify-center py-2 px-4 text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  <span>Try another email address</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl p-4 bg-rose-50 border border-rose-200 flex items-start space-x-3"
                >
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-rose-800">{errorMessage}</p>
                </motion.div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {getTranslation('auth.email1') || 'Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    {...register('email', {
                      required: getTranslation('auth.validation.emailRequired') || 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: getTranslation('auth.validation.invalidEmail') || 'Invalid email format',
                      },
                    })}
                    type="email"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    placeholder={getTranslation('auth.emailPlaceholder') || 'you@example.com'}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">
                    {Array.isArray(errors.email.message) ? errors.email.message[0] : errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Sending link...</span>
                    </div>
                  ) : (
                    getTranslation('auth.forgotPassword.sendResetLink') || 'Send Reset Link'
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  <span>{getTranslation('auth.forgotPassword.backToLogin') || 'Back to Sign In'}</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;