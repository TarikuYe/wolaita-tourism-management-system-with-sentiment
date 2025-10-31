import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Users, DollarSign, Image, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { addDoc, collection, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface TourModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour?: any; // For editing existing tours
  mode: 'create' | 'edit';
}

interface TourForm {
  title: string;
  titleAm: string;
  description: string;
  descriptionAm: string;
  price: number;
  duration: number;
  maxParticipants: number;
  location: string;
  locationAm: string;
  category: string;
  difficulty: string;
  image: string;
  highlights: string;
  highlightsAm: string;
}

export const TourModal: React.FC<TourModalProps> = ({ isOpen, onClose, tour, mode }) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get default values based on mode and tour data
  const getDefaultValues = () => {
    if (mode === 'edit' && tour) {
      return {
        title: tour.title || '',
        titleAm: tour.titleAm || '',
        description: tour.description || '',
        descriptionAm: tour.descriptionAm || '',
        price: tour.price || 0,
        duration: tour.duration || 1,
        maxParticipants: tour.maxParticipants || 10,
        location: tour.location || '',
        locationAm: tour.locationAm || '',
        category: tour.category || 'cultural',
        difficulty: tour.difficulty || 'Easy',
        image: tour.image || '',
        highlights: Array.isArray(tour.highlights) ? tour.highlights.join('\n') : tour.highlights || '',
        highlightsAm: Array.isArray(tour.highlightsAm) ? tour.highlightsAm.join('\n') : tour.highlightsAm || '',
      };
    }
    return {
      title: '',
      titleAm: '',
      description: '',
      descriptionAm: '',
      price: 0,
      duration: 1,
      maxParticipants: 10,
      location: '',
      locationAm: '',
      category: 'cultural',
      difficulty: 'Easy',
      image: '',
      highlights: '',
      highlightsAm: '',
    };
  };

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TourForm>({
    defaultValues: getDefaultValues()
  });

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      const defaultValues = getDefaultValues();
      reset(defaultValues);
    }
  }, [isOpen, mode, tour, reset]);

  const categories = [
    { value: 'cultural', label: 'Cultural' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'religious', label: 'Religious' },
    { value: 'nature', label: 'Nature' },
    { value: 'historical', label: 'Historical' },
  ];

  const difficulties = [
    { value: 'Easy', label: 'Easy' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Hard', label: 'Hard' },
  ];

  const onSubmit = async (data: TourForm) => {
    if (!currentUser || currentUser.role !== 'agency') {
      toast.error('Only agencies can create tours');
      return;
    }

    setIsSubmitting(true);
    try {
      const tourData = {
        title: data.title.trim(),
        titleAm: data.titleAm.trim(),
        description: data.description.trim(),
        descriptionAm: data.descriptionAm.trim(),
        price: Number(data.price),
        duration: Number(data.duration),
        maxParticipants: Number(data.maxParticipants),
        location: data.location.trim(),
        locationAm: data.locationAm.trim(),
        category: data.category,
        difficulty: data.difficulty,
        image: data.image.trim() || 'https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
        highlights: data.highlights.split('\n').filter(h => h.trim()).map(h => h.trim()),
        highlightsAm: data.highlightsAm.split('\n').filter(h => h.trim()).map(h => h.trim()),
        agencyId: currentUser.id,
        agencyName: currentUser.name,
        available: true,
        rating: 0,
        reviewsCount: 0,
        updatedAt: Timestamp.now(),
      };

      if (mode === 'create') {
        await addDoc(collection(db, 'tours'), {
          ...tourData,
          createdAt: Timestamp.now(),
        });
        toast.success('Tour created successfully!');
      } else {
        await updateDoc(doc(db, 'tours', tour.id), tourData);
        toast.success('Tour updated successfully!');
      }

      // Close modal and reset form
      handleClose();
    } catch (error) {
      console.error('Tour operation error:', error);
      toast.error(`Failed to ${mode} tour. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form to default values
    reset(getDefaultValues());
    setIsSubmitting(false);
    onClose();
  };

  // Prevent modal from closing when clicking inside the modal content
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the backdrop
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Prevent any unwanted form submissions or navigation
  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    // Allow normal form navigation and input
    if (e.key === 'Enter') {
      // Only prevent default if it's not in a textarea
      const target = e.target as HTMLElement;
      if (target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    }
    // Allow Escape to close modal
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  // Prevent any clicks from bubbling up that might cause navigation
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
        {/* Backdrop with proper pointer events */}
        <div 
          className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
          onClick={handleBackdropClick}
        >
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-[9998]"
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
            className="relative inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg z-[10000]"
            onClick={handleModalContentClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 id="modal-title" className="text-xl font-medium text-gray-900">
                {mode === 'create' ? 'Create New Tour' : 'Edit Tour'}
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

            {/* Modal Content */}
            <div className="relative z-[10001]">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" onKeyDown={handleFormKeyDown}>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4 relative z-[10002]">
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h4>
                    
                    <div className="relative z-[10003]">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tour Title (English) *
                      </label>
                      <input
                        {...register('title', {
                          required: 'Tour title is required',
                          minLength: { value: 5, message: 'Title must be at least 5 characters' },
                          maxLength: { value: 100, message: 'Title must be less than 100 characters' }
                        })}
                        type="text"
                        className="relative z-[10004] w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                        placeholder="Enter tour title in English"
                        autoComplete="off"
                        onClick={handleInputClick}
                        onFocus={handleInputFocus}
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                      )}
                    </div>

                    <div className="relative z-[10003]">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tour Title (Amharic)
                      </label>
                      <input
                        {...register('titleAm')}
                        type="text"
                        className="relative z-[10004] w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                        placeholder="Enter tour title in Amharic"
                        autoComplete="off"
                        onClick={handleInputClick}
                        onFocus={handleInputFocus}
                      />
                    </div>

                    <div className="relative z-[10003]">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (English) *
                      </label>
                      <textarea
                        {...register('description', {
                          required: 'Description is required',
                          minLength: { value: 50, message: 'Description must be at least 50 characters' },
                          maxLength: { value: 1000, message: 'Description must be less than 1000 characters' }
                        })}
                        rows={4}
                        className="relative z-[10004] w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-vertical bg-white"
                        placeholder="Describe your tour in detail..."
                        onClick={handleInputClick}
                        onFocus={handleInputFocus}
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                      )}
                    </div>

                    <div className="relative z-[10003]">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Amharic)
                      </label>
                      <textarea
                        {...register('descriptionAm')}
                        rows={4}
                        className="relative z-[10004] w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-vertical bg-white"
                        placeholder="Describe your tour in Amharic..."
                        onClick={handleInputClick}
                        onFocus={handleInputFocus}
                      />
                    </div>
                  </div>

                  {/* Tour Details */}
                  <div className="space-y-4 relative z-[10002]">
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Tour Details</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative z-[10003]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price (USD) *
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-[10005]" />
                          <input
                            {...register('price', {
                              required: 'Price is required',
                              min: { value: 1, message: 'Price must be at least $1' },
                              max: { value: 10000, message: 'Price must be less than $10,000' }
                            })}
                            type="number"
                            min="1"
                            step="0.01"
                            className="relative z-[10004] w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                            placeholder="0.00"
                            autoComplete="off"
                            onClick={handleInputClick}
                            onFocus={handleInputFocus}
                          />
                        </div>
                        {errors.price && (
                          <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                        )}
                      </div>

                      <div className="relative z-[10003]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration (Days) *
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-[10005]" />
                          <input
                            {...register('duration', {
                              required: 'Duration is required',
                              min: { value: 1, message: 'Duration must be at least 1 day' },
                              max: { value: 30, message: 'Duration must be less than 30 days' }
                            })}
                            type="number"
                            min="1"
                            max="30"
                            className="relative z-[10004] w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                            placeholder="1"
                            autoComplete="off"
                            onClick={handleInputClick}
                            onFocus={handleInputFocus}
                          />
                        </div>
                        {errors.duration && (
                          <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="relative z-[10003]">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Participants *
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-[10005]" />
                        <input
                          {...register('maxParticipants', {
                            required: 'Max participants is required',
                            min: { value: 1, message: 'Must allow at least 1 participant' },
                            max: { value: 50, message: 'Maximum 50 participants allowed' }
                          })}
                          type="number"
                          min="1"
                          max="50"
                          className="relative z-[10004] w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                          placeholder="10"
                          autoComplete="off"
                          onClick={handleInputClick}
                          onFocus={handleInputFocus}
                        />
                      </div>
                      {errors.maxParticipants && (
                        <p className="mt-1 text-sm text-red-600">{errors.maxParticipants.message}</p>
                      )}
                    </div>

                    <div className="relative z-[10003]">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location (English) *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-[10005]" />
                        <input
                          {...register('location', {
                            required: 'Location is required',
                            minLength: { value: 3, message: 'Location must be at least 3 characters' }
                          })}
                          type="text"
                          className="relative z-[10004] w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                          placeholder="Tour location"
                          autoComplete="off"
                          onClick={handleInputClick}
                          onFocus={handleInputFocus}
                        />
                      </div>
                      {errors.location && (
                        <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                      )}
                    </div>

                    <div className="relative z-[10003]">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location (Amharic)
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-[10005]" />
                        <input
                          {...register('locationAm')}
                          type="text"
                          className="relative z-[10004] w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                          placeholder="Tour location in Amharic"
                          autoComplete="off"
                          onClick={handleInputClick}
                          onFocus={handleInputFocus}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative z-[10003]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <div className="relative">
                          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-[10005]" />
                          <select
                            {...register('category', { required: 'Category is required' })}
                            className="relative z-[10004] w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white appearance-none"
                            onClick={handleInputClick}
                            onFocus={handleInputFocus}
                          >
                            <option value="">Select category</option>
                            {categories.map(cat => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </select>
                        </div>
                        {errors.category && (
                          <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                        )}
                      </div>

                      <div className="relative z-[10003]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Difficulty *
                        </label>
                        <select
                          {...register('difficulty', { required: 'Difficulty is required' })}
                          className="relative z-[10004] w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white appearance-none"
                          onClick={handleInputClick}
                          onFocus={handleInputFocus}
                        >
                          <option value="">Select difficulty</option>
                          {difficulties.map(diff => (
                            <option key={diff.value} value={diff.value}>{diff.label}</option>
                          ))}
                        </select>
                        {errors.difficulty && (
                          <p className="mt-1 text-sm text-red-600">{errors.difficulty.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="relative z-[10003]">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image URL
                      </label>
                      <div className="relative">
                        <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-[10005]" />
                        <input
                          {...register('image')}
                          type="url"
                          className="relative z-[10004] w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                          placeholder="https://example.com/image.jpg"
                          autoComplete="off"
                          onClick={handleInputClick}
                          onFocus={handleInputFocus}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Leave empty to use default image
                      </p>
                    </div>
                  </div>
                </div>

                {/* Highlights */}
                <div className="space-y-4 relative z-[10002]">
                  <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Tour Highlights</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative z-[10003]">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Highlights (English)
                      </label>
                      <textarea
                        {...register('highlights')}
                        rows={4}
                        className="relative z-[10004] w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-vertical bg-white"
                        placeholder="Enter each highlight on a new line..."
                        onClick={handleInputClick}
                        onFocus={handleInputFocus}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter each highlight on a separate line
                      </p>
                    </div>

                    <div className="relative z-[10003]">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Highlights (Amharic)
                      </label>
                      <textarea
                        {...register('highlightsAm')}
                        rows={4}
                        className="relative z-[10004] w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-vertical bg-white"
                        placeholder="Enter each highlight on a new line in Amharic..."
                        onClick={handleInputClick}
                        onFocus={handleInputFocus}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter each highlight on a separate line
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t relative z-[10002]">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="relative z-[10003] px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative z-[10003] px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{mode === 'create' ? 'Creating...' : 'Updating...'}</span>
                      </>
                    ) : (
                      <span>{mode === 'create' ? 'Create Tour' : 'Update Tour'}</span>
                    )}
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