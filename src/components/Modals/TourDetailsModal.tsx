import React from 'react';
import { X, MapPin, Clock, Users, DollarSign, Star, Calendar, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: any;
}

export const TourDetailsModal: React.FC<TourDetailsModalProps> = ({ isOpen, onClose, tour }) => {
  if (!tour) return null;

  // Prevent modal from closing when clicking inside the modal content
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-y-auto" onKeyDown={handleKeyDown}>
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
            className="relative inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg z-[10000]"
            onClick={handleModalContentClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-details-modal-title"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 id="tour-details-modal-title" className="text-xl font-medium text-gray-900">Tour Details</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="relative z-[10001]">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Tour Image */}
                <div className="relative z-[10002]">
                  <div
                    className="h-64 bg-cover bg-center rounded-lg"
                    style={{ 
                      backgroundImage: `url(${tour.image || 'https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'})` 
                    }}
                  />
                  
                  {/* Tour Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-gray-600 mb-1">
                        <DollarSign className="h-4 w-4 pointer-events-none" />
                        <span className="text-sm">Price</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">${tour.price}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-gray-600 mb-1">
                        <Clock className="h-4 w-4 pointer-events-none" />
                        <span className="text-sm">Duration</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{tour.duration} days</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-gray-600 mb-1">
                        <Users className="h-4 w-4 pointer-events-none" />
                        <span className="text-sm">Max Participants</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{tour.maxParticipants}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-gray-600 mb-1">
                        <Star className="h-4 w-4 pointer-events-none" />
                        <span className="text-sm">Rating</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{tour.rating || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Tour Information */}
                <div className="space-y-6 relative z-[10002]">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{tour.title}</h4>
                    {tour.titleAm && (
                      <p className="text-gray-600 mb-4">{tour.titleAm}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-gray-600">
                      <MapPin className="h-5 w-5 text-amber-600 pointer-events-none" />
                      <span>{tour.location}</span>
                      {tour.locationAm && <span className="text-sm">({tour.locationAm})</span>}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Tag className="h-5 w-5 text-amber-600 pointer-events-none" />
                      <span className="capitalize">{tour.category}</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {tour.difficulty}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Calendar className="h-5 w-5 text-amber-600 pointer-events-none" />
                      <span>Created: {tour.createdAt?.toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Description</h5>
                    <p className="text-gray-600 text-sm leading-relaxed">{tour.description}</p>
                    {tour.descriptionAm && (
                      <div className="mt-3">
                        <h6 className="font-medium text-gray-700 mb-1">Description (Amharic)</h6>
                        <p className="text-gray-600 text-sm leading-relaxed">{tour.descriptionAm}</p>
                      </div>
                    )}
                  </div>

                  {(tour.highlights && tour.highlights.length > 0) && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Highlights</h5>
                      <ul className="space-y-1">
                        {tour.highlights.map((highlight: string, index: number) => (
                          <li key={index} className="text-gray-600 text-sm flex items-start space-x-2">
                            <span className="text-amber-600 mt-1">•</span>
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {tour.highlightsAm && tour.highlightsAm.length > 0 && (
                        <div className="mt-3">
                          <h6 className="font-medium text-gray-700 mb-1">Highlights (Amharic)</h6>
                          <ul className="space-y-1">
                            {tour.highlightsAm.map((highlight: string, index: number) => (
                              <li key={index} className="text-gray-600 text-sm flex items-start space-x-2">
                                <span className="text-amber-600 mt-1">•</span>
                                <span>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h5 className="font-medium text-amber-800 mb-2">Tour Status</h5>
                    <div className="space-y-1 text-sm">
                      <p className="text-amber-700">
                        <span className="font-medium">Availability:</span> {tour.available ? 'Available' : 'Not Available'}
                      </p>
                      <p className="text-amber-700">
                        <span className="font-medium">Reviews:</span> {tour.reviewsCount || 0} reviews
                      </p>
                      <p className="text-amber-700">
                        <span className="font-medium">Last Updated:</span> {tour.updatedAt?.toLocaleDateString() || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-6 border-t mt-6 relative z-[10002]">
                <button
                  type="button"
                  onClick={onClose}
                  className="relative z-[10003] px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};