import React, { useState } from 'react';
import { X, Calendar, Users, CreditCard, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentModal } from '../Payment/PaymentModal';
import { Tour } from '../..//types'; // Import the Tour interface
import toast from 'react-hot-toast';

interface BookingModalProps {
 isOpen: boolean;
  onClose: () => void;
  tour: Tour; // Use the imported Tour interface
}

interface BookingForm {
  participants: number;
  tourDate: string;
  specialRequests: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, tour }) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<BookingForm>();

  const participants = watch('participants', 1);
  const totalPrice = participants * tour.price;

  const onSubmit = async (data: BookingForm) => {
    console.log("Tour object:", tour);
    if (!currentUser) {
      toast.error('Please log in to book a tour');
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingData = {
        tourId: tour.id,
        tourName: tour.title,
        touristId: currentUser.id,
        touristName: currentUser.name,
        touristEmail: currentUser.email,
        agencyId: tour.agencyId,
        agencyName: tour.agencyName,
        participants: parseInt(data.participants.toString()),
        totalPrice,
        tourDate: Timestamp.fromDate(new Date(data.tourDate)),
        specialRequests: data.specialRequests || '',
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      
      // Create booking object for payment
      const booking = {
        id: docRef.id,
        ...bookingData
      };

      setCreatedBooking(booking);
      setShowPaymentModal(true);
      
      toast.success('Booking created! Please complete payment.');
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    handleClose();
    toast.success('Booking confirmed! Check your email for details.');
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setCreatedBooking(null);
      setShowPaymentModal(false);
      onClose();
    }
  };

  // Prevent modal from closing when clicking inside the modal content
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      handleClose();
    }
  };

  // Prevent any unwanted form submissions
  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    }
    if (e.key === 'Escape' && !isSubmitting) {
      handleClose();
    }
  };

  // Prevent clicks from bubbling up
  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleInputFocus = (e: React.FocusEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div 
            className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
            onClick={handleBackdropClick}
          >
            {/* Background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 z-[9998]"
              aria-hidden="true"
            />

            {/* This element is to trick the browser into centering the modal contents. */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            {/* Modal panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg z-[10000]"
              onClick={handleModalContentClick}
              role="dialog"
              aria-modal="true"
              aria-labelledby="booking-modal-title"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 id="booking-modal-title" className="text-lg font-medium text-gray-900">Book Tour</h3>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
                  aria-label="Close modal"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Tour Information */}
              <div className="mb-6 relative z-[10001]">
                <h4 className="font-semibold text-gray-900 mb-2">{tour.title}</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 pointer-events-none" />
                    <span>{tour.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 pointer-events-none" />
                    <span>{tour.duration} days</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 pointer-events-none" />
                    <span>${tour.price} per person</span>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="relative z-[10001]">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" onKeyDown={handleFormKeyDown}>
                  <div className="relative z-[10002]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Participants
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-[10005]" />
                      <select
                        {...register('participants', {
                          required: 'Please select number of participants',
                          min: { value: 1, message: 'At least 1 participant required' },
                          max: { value: tour.maxParticipants, message: `Maximum ${tour.maxParticipants} participants allowed` }
                        })}
                        className="relative z-[10004] w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white appearance-none"
                        onClick={handleInputClick}
                        onFocus={handleInputFocus}
                      >
                        {Array.from({ length: tour.maxParticipants }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>{num} {num === 1 ? 'Person' : 'People'}</option>
                        ))}
                      </select>
                    </div>
                    {errors.participants && (
                      <p className="mt-1 text-sm text-red-600">{errors.participants.message}</p>
                    )}
                  </div>

                  <div className="relative z-[10002]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Tour Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-[10005]" />
                      <input
                        {...register('tourDate', {
                          required: 'Please select a tour date',
                          validate: (value) => {
                            const selectedDate = new Date(value);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return selectedDate >= today || 'Tour date must be in the future';
                          }
                        })}
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        className="relative z-[10004] w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                        onClick={handleInputClick}
                        onFocus={handleInputFocus}
                      />
                    </div>
                    {errors.tourDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.tourDate.message}</p>
                    )}
                  </div>

                  <div className="relative z-[10002]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      {...register('specialRequests')}
                      rows={3}
                      className="relative z-[10004] w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-vertical bg-white"
                      placeholder="Any dietary restrictions, accessibility needs, or special requests..."
                      onClick={handleInputClick}
                      onFocus={handleInputFocus}
                    />
                  </div>

                  {/* Price Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 relative z-[10002]">
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                      <span>Price per person:</span>
                      <span>${tour.price}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                      <span>Participants:</span>
                      <span>{participants}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between items-center font-semibold text-gray-900">
                        <span>Total:</span>
                        <span>${totalPrice}</span>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex space-x-3 pt-4 relative z-[10002]">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="relative z-[10003] flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="relative z-[10003] flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? 'Creating...' : 'Continue to Payment'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatePresence>

      {/* Payment Modal */}
      {showPaymentModal && createdBooking && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          booking={createdBooking}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};