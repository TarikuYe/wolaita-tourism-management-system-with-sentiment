import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';

interface ForgotPasswordForm {
  email: string;
}

export const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { sendPasswordResetEmail } = useAuth();
  const { t } = useLanguage();

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      await sendPasswordResetEmail(data.email);
      const successMessage = t('auth.forgotPassword.success');
      setMessage({
        type: 'success',
        text: Array.isArray(successMessage) ? successMessage[0] : successMessage
      });
      toast.success(Array.isArray(successMessage) ? successMessage[0] : successMessage);
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = t('auth.forgotPassword.error');
      
      // Handle specific Firebase error codes
      if (error.code === 'auth/user-not-found') {
        errorMessage = t('auth.forgotPassword.userNotFound');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('auth.forgotPassword.invalidEmail');
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = t('auth.forgotPassword.tooManyRequests');
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = t('auth.forgotPassword.networkError');
      }

      const finalErrorMessage = Array.isArray(errorMessage) ? errorMessage[0] : errorMessage;
      
      setMessage({
        type: 'error',
        text: finalErrorMessage
      });
      toast.error(finalErrorMessage);
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <div className="mx-auto h-12 w-12 bg-amber-600 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {getTranslation('auth.forgotPassword.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getTranslation('auth.forgotPassword.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Message Alert */}
            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-md p-4 ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    {message.type === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      message.type === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {message.text}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {getTranslation('auth.email1')}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: getTranslation('auth.validation.emailRequired'),
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: getTranslation('auth.validation.invalidEmail'),
                    },
                  })}
                  type="email"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                  placeholder={getTranslation('auth.emailPlaceholder')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {Array.isArray(errors.email.message) ? errors.email.message[0] : errors.email.message}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? getTranslation('common.loading2') : getTranslation('auth.forgotPassword.sendResetLink')}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center font-medium text-amber-600 hover:text-amber-500 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {getTranslation('auth.forgotPassword.backToLogin')}
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};