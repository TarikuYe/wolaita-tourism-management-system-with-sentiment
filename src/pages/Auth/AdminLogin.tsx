import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowLeft, 
  Cpu, 
  KeyRound, 
  CheckCircle2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { db, auth } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { toast } from 'react-hot-toast';

interface AdminLoginForm {
  email: string;
  password: string;
}

export const AdminLogin: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { login, currentUser, loading } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<AdminLoginForm>();

  // If already logged in as admin, redirect to admin dashboard
  useEffect(() => {
    if (currentUser && !loading) {
      if (currentUser.role === 'admin') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [currentUser, loading, navigate]);

  const onSubmit = async (data: AdminLoginForm) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      // 1. Perform admin portal authentication
      await login(data.email, data.password, 'admin');

      toast.success('Admin authentication verified. Access granted.', {
        icon: '🔐',
        duration: 3000
      });
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Admin Login error:', error);
      let errorMsg = error.message || 'Authentication failed. Please verify your credentials.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMsg = 'Invalid administrative credentials provided.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = 'Security Lockout: Too many failed login attempts. Please wait before retrying.';
      }
      setAuthError(errorMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 text-slate-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-amber-500 selection:text-black">
      {/* Background Decorative Tech Grid & Glowing Orbs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Security Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 shadow-inner text-xs font-mono text-slate-300 backdrop-blur-md"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-emerald-400 font-semibold tracking-wider uppercase">Restricted Gateway</span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-400">SSL 256-bit Encrypted</span>
      </motion.div>

      {/* Main Login Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="max-w-md w-full bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl p-8 sm:p-10 backdrop-blur-xl relative z-10"
      >
        {/* Header Icon & Title */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center mb-4">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Admin Console
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Wolaita Tourism Administration Portal
          </p>
        </div>

        {/* Security Warning Notice */}
        <div className="mt-6 p-3 rounded-lg bg-amber-950/30 border border-amber-900/40 flex items-start space-x-2.5 text-xs text-amber-200/90">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p>
            Authorized administrative staff only. All sign-in attempts and session activities are monitored and logged.
          </p>
        </div>

        {/* Error Alert */}
        {authError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-3 rounded-lg bg-red-950/40 border border-red-800/60 flex items-start space-x-2.5 text-xs text-red-200"
          >
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{authError}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Email / Account
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="h-4 w-4" />
              </div>
              <input
                {...register('email', {
                  required: 'Administrative email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Please enter a valid email address',
                  },
                })}
                type="email"
                disabled={isSubmitting}
                className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-700/70 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors disabled:opacity-50 font-sans"
                placeholder="admin@wolaitatours.com"
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Admin Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-4 w-4" />
              </div>
              <input
                {...register('password', {
                  required: 'Master password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                type={showPassword ? 'text' : 'password'}
                disabled={isSubmitting}
                className="block w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/70 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors disabled:opacity-50 font-sans"
                placeholder="••••••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Authenticating Console...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
                <span>Sign In to Admin Portal</span>
              </>
            )}
          </button>
        </form>

        {/* Footer / Back link */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-amber-400 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Site</span>
          </Link>
          <span className="font-mono text-[11px] text-slate-500">Console v2.4</span>
        </div>
      </motion.div>

      {/* Trust & Compliance Badge */}
      <div className="mt-8 text-center text-xs text-slate-500 flex items-center space-x-4">
        <span className="flex items-center space-x-1">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span>Core System Active</span>
        </span>
        <span>•</span>
        <span className="flex items-center space-x-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>End-to-End Encrypted</span>
        </span>
      </div>
    </div>
  );
};
