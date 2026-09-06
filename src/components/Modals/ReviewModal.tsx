import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { addDoc, collection, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Booking, Review } from '../../types';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  review?: Review | null;
  mode: 'create' | 'edit';
  onReviewSubmitted?: () => void; 
}

interface ReviewForm {
  rating: number;
  comment: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ 
  isOpen, 
  onClose, 
  booking, 
  review, 
  mode, 
  onReviewSubmitted 
}) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState(review?.rating || 0);
  
  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<ReviewForm>({
    defaultValues: {
      rating: review?.rating || 0,
      comment: review?.comment || '',
    },
  });

  useEffect(() => {
    if (review) {
      setSelectedRating(review.rating);
      reset({ rating: review.rating, comment: review.comment });
    } else {
      setSelectedRating(0);
      reset({ rating: 0, comment: '' });
    }
  }, [review, reset]);

  const onSubmit = async (data: ReviewForm) => {
    if (!currentUser) {
      toast.error('Please log in to submit a review');
      return;
    }

    if (selectedRating === 0) {
      toast.error('Please select a star rating');
      return;
    }
    if (!booking) {
      toast.error("Booking not found!");
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = {
        bookingId: booking.id,
        tourId: booking.tourId,
        tourName: booking.tourName,
        touristId: currentUser.id,
        touristName: currentUser.name,
        agencyId: booking.agencyId,
        rating: selectedRating,
        comment: data.comment,
        verified: true,
        createdAt: Timestamp.now(),
      };

      if (mode === 'edit' && review) {
        await updateDoc(doc(db, 'reviews', review.id), {
          ...reviewData,
          updatedAt: Timestamp.now(),
        });
        toast.success('Review updated successfully!');
      } else {
        await addDoc(collection(db, 'reviews'), reviewData);
        toast.success('Review submitted successfully!');
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }
      }

      handleClose();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    setSelectedRating(rating);
    setValue('rating', rating);
  };

  const handleClose = () => {
    setSelectedRating(0);
    setIsSubmitting(false);
    reset({ rating: 0, comment: '' });
    onClose();
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-y-auto">
        <div 
          className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 transition-opacity bg-slate-950/60 backdrop-blur-xs z-[9998]"
            aria-hidden="true"
          />

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative inline-block w-full max-w-md p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl border border-slate-100 z-[10000]"
            onClick={handleModalContentClick}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {mode === 'edit' ? 'Edit Review' : 'Leave a Review'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{booking?.tourName}</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Rating
                </label>
                <div className="flex space-x-2 bg-slate-50 border border-slate-100 p-3 rounded-2xl justify-center">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleRatingClick(rating)}
                      className="focus:outline-none p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          rating <= selectedRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <input
                  {...register('rating', { required: 'Please select a rating' })}
                  type="hidden"
                  value={selectedRating}
                />
                {errors.rating && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.rating.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Your Review & Experience
                </label>
                <textarea
                  {...register('comment', {
                    required: 'Please write a review',
                    minLength: { value: 10, message: 'Review must be at least 10 characters long' }
                  })}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                  placeholder="Tell us about your experience..."
                />
                {errors.comment && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.comment.message}</p>
                )}
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : (mode === 'edit' ? 'Update Review' : 'Submit Review')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ReviewModal;