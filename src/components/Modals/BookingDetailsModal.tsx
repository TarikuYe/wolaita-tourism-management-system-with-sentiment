import React from 'react';
import { X, Printer, Mail, Calendar, Users, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking } from '../../types/booking';

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ isOpen, onClose, booking }) => {
  if (!booking) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
      case 'pending_verification':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99990] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={handleBackdropClick}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-100 p-6 sm:p-8"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Booking Details</h3>
                  <p className="text-xs text-slate-500 font-medium">Record overview</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase tracking-wider font-bold">Booking ID</span>
                  <span className="font-mono font-bold text-slate-800">{booking.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase tracking-wider font-bold">Tour Title</span>
                  <span className="font-bold text-slate-900">{booking.tourName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase tracking-wider font-bold">Tourist</span>
                  <span className="font-bold text-slate-800">{booking.customerName || 'N/A'}</span>
                </div>
                {booking.customerEmail && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase tracking-wider font-bold">Email</span>
                    <span className="text-slate-700">{booking.customerEmail}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                  <span className="text-slate-400 uppercase tracking-wider font-bold block">Participants</span>
                  <p className="text-base font-extrabold text-slate-900">{booking.participants} Person(s)</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                  <span className="text-slate-400 uppercase tracking-wider font-bold block">Tour Date</span>
                  <p className="text-sm font-bold text-slate-900">
                    {booking.tourDate ? new Date(booking.tourDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1.5">
                  <span className="text-slate-400 uppercase tracking-wider font-bold block">Booking Status</span>
                  <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider ${getStatusBadge(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1.5">
                  <span className="text-slate-400 uppercase tracking-wider font-bold block">Payment Status</span>
                  <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider ${getPaymentBadge(booking.paymentStatus)}`}>
                    {booking.paymentStatus}
                  </span>
                </div>
              </div>

              {booking.specialRequests && (
                <div className="bg-orange-50/60 border border-orange-200/70 rounded-2xl p-4 space-y-1">
                  <span className="text-xs font-bold text-orange-950 uppercase tracking-wider block">Special Requests</span>
                  <p className="text-slate-700 leading-relaxed">{booking.specialRequests}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3 mt-6">
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs uppercase tracking-wider"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all text-xs uppercase tracking-wider shadow-xs"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

