import React, { useState } from 'react';
import { X, Calendar, Users, CreditCard, MapPin, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentModal } from '../Payment/PaymentModal';
import { Tour } from '../../types';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
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
  const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm<BookingForm>({
    defaultValues: {
      participants: 1,
      tourDate: '',
      specialRequests: ''
    }
  });

  const participantsVal = watch('participants', 1);
  const participants = Number(participantsVal) > 0 ? Number(participantsVal) : 1;
  const totalPrice = participants * tour.price;
  const todayStr = new Date().toISOString().split('T')[0];

  const onSubmit = async (data: BookingForm) => {
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
        agencyName: tour.agencyName || 'Wolaita Tourism Agency',
        participants: parseInt(data.participants.toString(), 10),
        totalPrice,
        tourDate: Timestamp.fromDate(new Date(data.tourDate)),
        specialRequests: data.specialRequests || '',
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);

      const booking = {
        id: docRef.id,
        ...bookingData
      };

      setCreatedBooking(booking);
      setShowPaymentModal(true);
      toast.success('Tour booking initiated! Please proceed with payment.');
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    handleClose();
    toast.success('Booking confirmed! Check your dashboard for details.');
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setCreatedBooking(null);
      setShowPaymentModal(false);
      onClose();
    }
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      handleClose();
    }
  };

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

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[99990] overflow-y-auto">
          <div
            className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
            onClick={handleBackdropClick}
          >
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 transition-opacity bg-slate-950/60 backdrop-blur-xs z-[99991]"
              aria-hidden="true"
            />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            {/* Modal Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative inline-block w-full max-w-lg p-6 sm:p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl border border-slate-100 z-[99995]"
              onClick={handleModalContentClick}
              role="dialog"
              aria-modal="true"
              aria-labelledby="booking-modal-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 id="booking-modal-title" className="text-xl font-extrabold text-slate-900 tracking-tight">
                      Book Tour Experience
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Reserve your spot with Wolaita Tours</p>
                  </div>
                </div>
                {!isSubmitting && (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Tour Overview Banner */}
              <div className="bg-orange-50/60 border border-orange-200/70 rounded-2xl p-4 mb-6 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600 bg-orange-100/80 px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Selected Experience
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-base leading-snug">{tour.title}</h4>
                  </div>
                  <span className="text-lg font-extrabold text-orange-600 shrink-0">
                    ${tour.price} <span className="text-xs font-medium text-slate-500">/ person</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-1 border-t border-orange-200/50">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                    <span className="font-medium text-slate-700">{tour.location}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                    <span className="font-medium text-slate-700">{tour.duration} {tour.duration === 1 ? 'day' : 'days'}</span>
                  </div>
                  {tour.agencyName && (
                    <div className="flex items-center space-x-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium text-slate-700">{tour.agencyName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" onKeyDown={handleFormKeyDown}>
                {/* Number of Participants */}
                <div>
                  <label htmlFor="booking-participants" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Number of Participants
                  </label>
                  <div className="relative flex items-center">
                    <Users className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                    <input
                      id="booking-participants"
                      type="number"
                      min="1"
                      placeholder="1"
                      {...register('participants', {
                        required: 'Please enter number of participants',
                        min: { value: 1, message: 'At least 1 participant required' },
                        valueAsNumber: true
                      })}
                      className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="absolute right-2 flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          const currentVal = Number(watch('participants')) || 1;
                          if (currentVal > 1) {
                            setValue('participants', currentVal - 1, { shouldValidate: true });
                          }
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-sm transition-colors cursor-pointer"
                        title="Decrease participants"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const currentVal = Number(watch('participants')) || 1;
                          setValue('participants', currentVal + 1, { shouldValidate: true });
                        }}
                        className="w-7 h-7 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold flex items-center justify-center text-sm transition-colors cursor-pointer"
                        title="Increase participants"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {errors.participants && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{errors.participants.message}</p>
                  )}
                </div>

                {/* Preferred Tour Date */}
                <div>
                  <label htmlFor="booking-tour-date" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Preferred Tour Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                    <input
                      id="booking-tour-date"
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
                      min={todayStr}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                    />
                  </div>
                  {errors.tourDate && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{errors.tourDate.message}</p>
                  )}
                </div>

                {/* Special Requests */}
                <div>
                  <label htmlFor="booking-special-requests" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Special Requests <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="booking-special-requests"
                      {...register('specialRequests')}
                      rows={2}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none placeholder:text-slate-400"
                      placeholder="Dietary requirements, accessibility assistance, pickup preferences..."
                    />
                  </div>
                </div>

                {/* Price Calculation Summary */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Price per person:</span>
                    <span className="font-bold text-slate-800">${tour.price}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Participants:</span>
                    <span className="font-bold text-slate-800">{participants}</span>
                  </div>
                  <div className="border-t border-slate-200/80 pt-2 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Total Amount:</span>
                    <span className="text-lg font-extrabold text-orange-600">${totalPrice}</span>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center space-x-2 py-3.5 px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{isSubmitting ? 'Creating Booking...' : 'Continue to Payment'}</span>
                    {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                  </button>
                </div>
              </form>
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

export default BookingModal;