import React, { useEffect, useState } from 'react';
import {
  useForm,
  Controller,
  UseFormReset,
  UseFormSetValue
} from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

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
      console.log('UpdateBookingModal: Initializing form with booking:', booking);
      setValue('status', booking.status || 'pending');
      setValue('assignedGuide', booking.assignedGuide || '');
      // Convert Firebase Timestamp to Date object for react-datepicker
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
    console.log("onSubmit function called.");
    if (!booking) {
      console.log("Booking object is missing. Aborting save.");
      return;
    }

    console.log("Booking ID:", booking.id);
    console.log("Data being sent to Firebase:", data);
    
    const dataToUpdate = {
      ...data,
      tourDate: data.tourDate ? Timestamp.fromDate(data.tourDate) : null,
    };

    try {
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, dataToUpdate);
      console.log("updateDoc successful.");
      toast.success('Booking updated successfully');
      onClose(); // Close modal only after successful update
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  // Handle form submission with proper error handling
  const handleFormSubmit = async (data: UpdateBookingFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Update Booking</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Booking Status
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      id="status"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
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
                <label htmlFor="assignedGuide" className="block text-sm font-medium text-gray-700">
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
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
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
                <label htmlFor="tourDate" className="block text-sm font-medium text-gray-700">
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
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                      minDate={new Date()}
                      placeholderText="Select tour date"
                    />
                  )}
                />

                {control.getFieldState('tourDate').error && (
                  <p className="text-red-500 text-sm mt-1">
                    {control.getFieldState('tourDate').error?.message}
                  </p>
                )}
              </div>

              {/* Internal Notes */}
              <div>
                <label htmlFor="internalNotes" className="block text-sm font-medium text-gray-700">
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
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                      placeholder="Add any internal notes here..."
                    />
                  )}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};