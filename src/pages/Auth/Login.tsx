import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message');
  const { login, currentUser, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  // Redirect authenticated users immediately
  useEffect(() => {
    if (currentUser && !loading) {
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
    setErrorMessage(null);
    try {
      await login(data.email, data.password, 'public');
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMessage(error.message || 'Login failed. Please check your credentials.');
      setIsSubmitting(false);
    }
  };

  const showLoading = loading || (isSubmitting && !errorMessage) || !!currentUser;

  if (showLoading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium text-base">
            {isSubmitting ? t('auth.login.processing') : t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="mx-auto h-14 w-14 bg-orange-100/80 border border-orange-200/80 text-orange-600 rounded-2xl flex items-center justify-center shadow-xs mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('auth.login.title')}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {t('auth.login.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-10">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-2xl flex items-start space-x-3 border bg-rose-50 border-rose-200 text-rose-800 text-sm"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <div className="font-medium">
                {errorMessage}
              </div>
            </motion.div>
          )}

          {message && !errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-2xl flex items-start space-x-3 border text-sm ${
                message === 'verified'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-orange-50 border-orange-200 text-orange-800'
              }`}
            >
              <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                message === 'verified' ? 'text-emerald-600' : 'text-orange-600'
              }`} />
              <div>
                {message === 'verified' ? (
                  <p className="font-medium">Your email has been verified successfully! You may now sign in.</p>
                ) : message === 'registered' ? (
                  <div>
                    <p className="font-bold">Account created successfully!</p>
                    <p className="mt-1 text-xs text-orange-700">Please check your inbox (and Spam/Junk folder) to verify your email address.</p>
                  </div>
                ) : (
                  <p className="font-medium">{message}</p>
                )}
              </div>
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
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
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
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
                  className="block w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  placeholder="Enter your password"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
              >
                {isSubmitting ? t('common.loading') : t('auth.submit')}
              </button>
            </div>

            <div className="text-center space-y-2 pt-2 text-sm">
              <div>
                <Link
                  to={message ? `/register?message=${encodeURIComponent(message)}` : '/register'}
                  className="font-bold text-orange-600 hover:text-orange-700"
                >
                  {t('auth.switchToRegister')}
                </Link>
              </div>
              <div>
                <Link
                  to="/forgot-password"
                  className="font-medium text-slate-500 hover:text-slate-700 text-xs"
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

export default Login;