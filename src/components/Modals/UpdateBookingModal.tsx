import React, { useEffect, useState } from 'react';
import {
  useForm,
  Controller,
  UseFormReset,
  UseFormSetValue
} from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, UserCheck, FileText, CheckCircle2 } from 'lucide-react';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fetchGuides } from '../../hooks/useFirestore';
import { updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';

interface UpdateBookingFormData {
  status: 'pending' | 'confirmed' | 'cancelled';
  assignedGuide: string;
  tourDate: Date | null;
  internalNotes: string;
}

interface UpdateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export const UpdateBookingModal: React.FC<UpdateBookingModalProps> = ({ isOpen, onClose, booking }) => {
  const { handleSubmit, control, reset, setValue, formState: { isSubmitting } } = useForm<UpdateBookingFormData>();

  const [guides, setGuides] = useState<{ id: string; name: string; }[]>([]);
  const [guidesLoading, setGuidesLoading] = useState(true);

  useEffect(() => {
    if (isOpen && booking) {
      setValue('status', booking.status || 'pending');
      setValue('assignedGuide', booking.assignedGuide || '');
      setValue('tourDate', (booking.tourDate && typeof booking.tourDate.toDate === 'function') ? booking.tourDate.toDate() : null);
      setValue('internalNotes', booking.internalNotes || '');
    } else {
      reset();
    }

    if (isOpen) {
      setGuidesLoading(true);
      fetchGuides()
        .then(fetchedGuides => {
          setGuides(fetchedGuides);
          setGuidesLoading(false);
        })
        .catch(() => setGuidesLoading(false));
    }
  }, [
    isOpen,
    booking,
    reset as UseFormReset<UpdateBookingFormData>,
    setValue as UseFormSetValue<UpdateBookingFormData>
  ]);

  const onSubmit = async (data: UpdateBookingFormData) => {
    if (!booking) return;

    const dataToUpdate = {
      ...data,
      tourDate: data.tourDate ? Timestamp.fromDate(data.tourDate) : null,
      updatedAt: Timestamp.now()
    };

    try {
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, dataToUpdate);
      toast.success('Booking updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
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
            className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-100"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Update Booking</h3>
                  <p className="text-xs text-slate-500 font-medium">Modify status & assignment</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Booking Status
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      id="status"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  )}
                />
              </div>

              {/* Assigned Guide */}
              <div>
                <label htmlFor="assignedGuide" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Assigned Guide
                </label>
                <Controller
                  name="assignedGuide"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      value={field.value || ''}
                      id="assignedGuide"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                      disabled={guidesLoading}
                    >
                      <option value="">Select a guide</option>
                      {guidesLoading && <option value="">Loading guides...</option>}
                      {!guidesLoading && guides.length === 0 && <option value="">No guides available</option>}
                      {!guidesLoading && guides.map(guide => (
                        <option key={guide.id} value={guide.id}>{guide.name}</option>
                      ))}
                    </select>
                  )}
                />
              </div>

              {/* Tour Date */}
              <div>
                <label htmlFor="tourDate" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tour Date
                </label>
                <Controller
                  name="tourDate"
                  control={control}
                  rules={{
                    required: 'Tour date is required',
                    validate: (value) => {
                      if (value && new Date(value).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) {
                        return 'Tour date cannot be in the past';
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date: Date | null) => field.onChange(date)}
                      onBlur={field.onBlur}
                      dateFormat="yyyy/MM/dd"
                      isClearable
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                      minDate={new Date()}
                      placeholderText="Select tour date"
                    />
                  )}
                />

                {control.getFieldState('tourDate').error && (
                  <p className="text-rose-600 text-xs mt-1 font-medium">
                    {control.getFieldState('tourDate').error?.message}
                  </p>
                )}
              </div>

              {/* Internal Notes */}
              <div>
                <label htmlFor="internalNotes" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Internal Notes
                </label>
                <Controller
                  name="internalNotes"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      id="internalNotes"
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none placeholder:text-slate-400"
                      placeholder="Add any internal coordinator notes here..."
                    />
                  )}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs uppercase tracking-wider font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs uppercase tracking-wider font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};