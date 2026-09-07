import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, Info, HelpCircle, CheckCircle2, X, Loader2 } from 'lucide-react';

export interface ConfirmModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  inputPlaceholder?: string;
  inputMatch?: string; // Optional: Require user to type exact string (e.g., "DELETE") to confirm
  requireInputText?: string; // Label for required input
  onConfirm: (inputValue?: string) => Promise<void> | void;
  onCancel?: () => void;
}

interface ConfirmModalProps extends ConfirmModalConfig {
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  type = 'danger',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  inputPlaceholder,
  inputMatch,
  requireInputText,
  onConfirm,
  onCancel,
  onClose
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setIsSubmitting(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isInputInvalid = inputMatch ? inputValue.trim() !== inputMatch : false;

  const handleConfirm = async () => {
    if (isInputInvalid) {
      setError(`Please type "${inputMatch}" to confirm.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm(inputValue);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    if (onCancel) onCancel();
    onClose();
  };

  // Type styling
  const getTypeTheme = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 text-red-600 border-red-200',
          icon: <Trash2 className="w-7 h-7" />,
          btnGradient: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/25',
          accentColor: 'text-red-600'
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-600 border-amber-200',
          icon: <AlertTriangle className="w-7 h-7" />,
          btnGradient: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25',
          accentColor: 'text-amber-600'
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-blue-100 text-blue-600 border-blue-200',
          icon: <Info className="w-7 h-7" />,
          btnGradient: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25',
          accentColor: 'text-blue-600'
        };
    }
  };

  const theme = getTypeTheme();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        >
          {/* Header & Close Button */}
          <div className="flex items-center justify-between p-5 pb-0">
            <div className={`p-3 rounded-2xl border ${theme.iconBg} flex items-center justify-center`}>
              {theme.icon}
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 pt-4">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {message}
            </p>

            {/* Optional Input Field */}
            {(inputPlaceholder || inputMatch || requireInputText) && (
              <div className="mt-5 space-y-2">
                {requireInputText && (
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {requireInputText}
                  </label>
                )}
                {inputMatch && (
                  <p className="text-xs text-slate-500">
                    Type <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{inputMatch}</span> to confirm.
                  </p>
                )}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                  placeholder={inputPlaceholder || (inputMatch ? `Type ${inputMatch}` : 'Enter details...')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:opacity-50"
                />
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || isInputInvalid}
              className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${theme.btnGradient} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{confirmText}</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
