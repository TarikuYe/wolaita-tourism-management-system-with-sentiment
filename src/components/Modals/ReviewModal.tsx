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
      toast.error('Please select a rating');
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
        // No sentiment data - will be added later by admin/agency
      };

      console.log('Review Data being saved:', reviewData);

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
    } catch (error) {
      console.error('Review submission error:', error);
      toast.error(`Failed to ${mode === 'edit' ? 'update' : 'submit'} review. Please try again.`);
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

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    }
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleInputFocus = (e: React.FocusEvent) => {
    e.stopPropagation();
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
            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 z-[9998]"
            aria-hidden="true"
          />

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg z-[10000]"
            onClick={handleModalContentClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id="review-modal-title" className="text-lg font-medium text-gray-900">
                {mode === 'edit' ? 'Edit Review' : 'Leave a Review'}
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6 relative z-[10001]">
              <h4 className="font-semibold text-gray-900 mb-2">{booking?.tourName}</h4>
              <p className="text-sm text-gray-600">
                Share your experience to help other travelers
              </p>
            </div>

            <div className="relative z-[10001]">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" onKeyDown={handleFormKeyDown}>
                <div className="relative z-[10002]">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Rating
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleRatingClick(rating)}
                        className="relative z-[10004] focus:outline-none p-1 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            rating <= selectedRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 hover:text-yellow-300'
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
                    <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
                  )}
                </div>

                <div className="relative z-[10002]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review
                  </label>
                  <textarea
                    {...register('comment', {
                      required: 'Please write a review',
                      minLength: { value: 10, message: 'Review must be at least 10 characters long' }
                    })}
                    rows={4}
                    className="relative z-[10004] w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-vertical bg-white"
                    placeholder="Tell us about your experience..."
                    onClick={handleInputClick}
                    onFocus={handleInputFocus}
                  />
                  {errors.comment && (
                    <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4 relative z-[10002]">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="relative z-[10003] flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative z-[10003] flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Submitting...' : (mode === 'edit' ? 'Update Review' : 'Submit Review')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};