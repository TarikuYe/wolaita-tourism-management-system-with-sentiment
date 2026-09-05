import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Info, RefreshCw } from 'lucide-react';
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
      
      // Handle specific Firebase error codes
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

  // Helper function to ensure string output from translations
  const getTranslation = (key: string): string => {
    const translation = t(key);
    return Array.isArray(translation) ? translation[0] : translation;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-6"
      >
        {/* Header Icon */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shadow-sm">
            <Mail className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            {submittedEmail ? 'Check Your Email' : getTranslation('auth.forgotPassword.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {submittedEmail 
              ? 'Password reset instructions have been dispatched' 
              : getTranslation('auth.forgotPassword.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {submittedEmail ? (
            /* Success confirmation screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center"
            >
              <div className="mx-auto h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  We have sent a secure password recovery link to:
                </p>
                <p className="text-base font-semibold text-gray-900 bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-200/60 inline-block">
                  {submittedEmail}
                </p>
              </div>

              {/* Spam / Junk Folder Notice Box */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 text-left flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 space-y-1">
                  <p className="font-semibold text-blue-900">Can't find the email?</p>
                  <p>
                    Please check your <strong>Spam</strong> or <strong>Junk</strong> folder. Automated system emails may occasionally be filtered there by your email provider.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  to="/login"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-colors"
                >
                  Return to Sign In
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setSubmittedEmail(null);
                    setErrorMessage(null);
                  }}
                  className="w-full flex items-center justify-center py-2 px-4 text-xs font-medium text-gray-600 hover:text-amber-600 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Try another email address
                </button>
              </div>
            </motion.div>
          ) : (
            /* Reset Form */
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg p-4 bg-red-50 border border-red-200 flex items-start space-x-3"
                >
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                </motion.div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {getTranslation('auth.email1') || 'Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder={getTranslation('auth.emailPlaceholder') || 'you@example.com'}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {Array.isArray(errors.email.message) ? errors.email.message[0] : errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                >
                  {isLoading ? getTranslation('common.loading2') || 'Sending...' : getTranslation('auth.forgotPassword.sendResetLink') || 'Send Reset Link'}
                </button>
              </div>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  {getTranslation('auth.forgotPassword.backToLogin') || 'Back to Sign In'}
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};