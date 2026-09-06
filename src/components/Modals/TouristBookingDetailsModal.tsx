import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  CreditCard, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Printer, 
  Copy, 
  Check, 
  Building2, 
  FileText, 
  Star,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking, RefundRequest } from '../../types';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface TouristBookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  refundRequest?: RefundRequest;
  onCancelBooking?: (booking: Booking) => void;
  onRequestRefund?: (booking: Booking) => void;
  onLeaveReview?: (booking: Booking) => void;
  canCancel?: boolean;
  canRefund?: boolean;
  canReview?: boolean;
  isReviewed?: boolean;
}

export const TouristBookingDetailsModal: React.FC<TouristBookingDetailsModalProps> = ({
  isOpen,
  onClose,
  booking,
  refundRequest,
  onCancelBooking,
  onRequestRefund,
  onLeaveReview,
  canCancel = false,
  canRefund = false,
  isReviewed = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !booking) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast.success('Booking reference copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (date: Date | any) => {
    if (!date) return 'Not specified';
    try {
      if (date?.toDate && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      if (date instanceof Date) {
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      if (typeof date === 'string') {
        return new Date(date).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      return 'Not specified';
    } catch {
      return 'Not specified';
    }
  };

  const getDaysUntilTour = (tourDate: Date | null) => {
    if (!tourDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(tourDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntil = getDaysUntilTour(booking.tourDate);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Pending
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'verified':
      case 'paid':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CreditCard className="w-3.5 h-3.5 mr-1" />
            Paid
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refunded
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Payment Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            Payment Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 print:shadow-none print:border-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors print:hidden"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2 text-orange-100 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Booking Confirmation</span>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-white mb-2">
              {booking.tourName}
            </h2>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {getStatusBadge(booking.status)}
              {getPaymentStatusBadge(booking.paymentStatus)}
              {daysUntil !== null && daysUntil >= 0 && booking.status !== 'cancelled' && booking.status !== 'completed' && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  daysUntil <= 3 ? 'bg-rose-500 text-white animate-pulse' : daysUntil <= 7 ? 'bg-amber-500 text-white' : 'bg-white/20 text-white'
                }`}>
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days left`}
                </span>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[calc(85vh-160px)] overflow-y-auto">
            {/* Booking Reference Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Booking Reference</span>
                <span className="text-sm font-mono font-bold text-slate-800">{booking.id}</span>
              </div>
              <button
                onClick={() => handleCopyId(booking.id)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-xs print:hidden"
                title="Copy reference code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Grid Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tour Date */}
              <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100/60">
                <div className="flex items-center space-x-2 text-orange-800 mb-1">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">Tour Date</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {formatDate(booking.tourDate)}
                </p>
                {daysUntil !== null && daysUntil >= 0 && (
                  <p className="text-xs text-orange-700 font-medium mt-0.5">
                    {daysUntil === 0 ? 'Tour happens today!' : daysUntil === 1 ? 'Tour scheduled for tomorrow' : `${daysUntil} days until departure`}
                  </p>
                )}
              </div>

              {/* Booking Date */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center space-x-2 text-slate-600 mb-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Booked On</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {formatDate(booking.bookingDate)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Initial registration timestamp
                </p>
              </div>

              {/* Participants */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center space-x-2 text-slate-600 mb-1">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Participants</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {booking.participants} {booking.participants === 1 ? 'Guest' : 'Guests'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Standard group reservation
                </p>
              </div>

              {/* Total Price */}
              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/60">
                <div className="flex items-center space-x-2 text-emerald-800 mb-1">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Total Amount</span>
                </div>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  ${booking.totalPrice}
                </p>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">
                  Payment Status: {booking.paymentStatus || 'Pending'}
                </p>
              </div>
            </div>

            {/* Agency info if available */}
            {booking.agencyName && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-orange-100/80 rounded-xl text-orange-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Tour Operator / Agency</span>
                    <p className="text-sm font-bold text-slate-900">{booking.agencyName}</p>
                  </div>
                </div>
                {booking.tourId && (
                  <Link
                    to={`/tours`}
                    className="inline-flex items-center space-x-1 text-xs text-orange-600 hover:text-orange-700 font-bold print:hidden"
                  >
                    <span>View Tours</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )}

            {/* Special Requests */}
            {booking.specialRequests && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center space-x-2 text-slate-700 mb-1">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Special Requests / Notes</span>
                </div>
                <p className="text-xs text-slate-700 mt-1 italic whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-100">
                  &ldquo;{booking.specialRequests}&rdquo;
                </p>
              </div>
            )}

            {/* Refund Details Section if exists */}
            {refundRequest && (
              <div className="bg-orange-50/70 rounded-2xl p-4 border border-orange-200/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold text-orange-950 uppercase tracking-wider">Refund Request Status</span>
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                    refundRequest.status === 'approved' || refundRequest.status === 'processed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : refundRequest.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {refundRequest.status.toUpperCase()}
                  </span>
                </div>
                
                {refundRequest.reason && (
                  <div className="text-xs text-slate-700 mt-2 bg-white/80 p-2.5 rounded-xl border border-orange-100">
                    <p className="font-bold text-slate-900 mb-0.5">Your Reason:</p>
                    <p className="italic text-slate-700">{refundRequest.reason}</p>
                  </div>
                )}

                {refundRequest.adminNotes && (
                  <div className="text-xs text-slate-700 mt-2 bg-white/80 p-2.5 rounded-xl border border-orange-100">
                    <p className="font-bold text-slate-900 mb-0.5">Admin Response:</p>
                    <p className="italic text-slate-800">{refundRequest.adminNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Leave Review Action */}
              {booking.status === 'completed' && onLeaveReview && (
                <button
                  onClick={() => {
                    onClose();
                    onLeaveReview(booking);
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>{isReviewed ? 'Edit Review' : 'Leave Review'}</span>
                </button>
              )}

              {/* Request Refund Action */}
              {canRefund && onRequestRefund && !refundRequest && (
                <button
                  onClick={() => {
                    onClose();
                    onRequestRefund(booking);
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Request Refund</span>
                </button>
              )}

              {/* Cancel Booking Action */}
              {canCancel && onCancelBooking && (
                <button
                  onClick={() => {
                    onClose();
                    onCancelBooking(booking);
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Booking</span>
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TouristBookingDetailsModal;
