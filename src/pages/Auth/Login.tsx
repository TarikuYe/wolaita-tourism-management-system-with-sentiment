import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';

interface LoginForm {
  email: string;
  password: string;
}

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message');
  const { login, currentUser, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  // Redirect authenticated users immediately
  useEffect(() => {
    if (currentUser && !loading) {
      // Align with the role based redirects used in AppContent
      const destination =
        currentUser.role === 'admin'
          ? '/dashboard'
          : currentUser.role === 'agency'
          ? '/agency'
          : currentUser.role === 'cashier'
          ? '/cashier'
          : '/';
      
      navigate(destination, { replace: true });
    }
  }, [currentUser, loading, navigate]);

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      // Don't reset isSubmitting here - let the redirect happen
    } catch (error) {
      console.error('Login error:', error);
      setIsSubmitting(false);
    }
  };

  // Show loading screen if:
  // 1. AuthContext is still loading (checking initial auth state)
  // 2. User is submitting login form
  // 3. We have a currentUser (success) while redirect effect runs
  const showLoading = loading || isSubmitting || !!currentUser;

  if (showLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            {isSubmitting ? t('auth.login.processing') : t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

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
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.login.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.login.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-xl flex items-start space-x-3 border ${
                message === 'verified'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                message === 'verified' ? 'text-green-600' : 'text-amber-600'
              }`} />
              <div className="text-sm">
                {message === 'verified' ? (
                  <p className="font-medium">Your email has been verified successfully! You may now sign in.</p>
                ) : message === 'registered' ? (
                  <div>
                    <p className="font-semibold">Account created successfully!</p>
                    <p className="mt-1 text-xs text-amber-700">Please check your inbox (and Spam/Junk folder) to verify your email address.</p>
                  </div>
                ) : (
                  <p className="font-medium">{message}</p>
                )}
              </div>
            </motion.div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('auth.email')}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Enter your password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t('common.loading') : t('auth.submit')}
              </button>
            </div>

            <div className="text-center space-y-2">
  <Link
    to={message ? `/register?message=${encodeURIComponent(message)}` : '/register'}
    className="font-medium text-amber-600 hover:text-amber-500"
  >
    {t('auth.switchToRegister')}
  </Link>
  <div>
    <Link
      to="/forgot-password"
      className="font-medium text-amber-600 hover:text-amber-500 text-sm"
    >
      {t('auth.forgotPassword.link')}
    </Link>
  </div>
</div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};