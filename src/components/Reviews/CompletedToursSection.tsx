import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Calendar, 
  Users, 
  MessageSquare, 
  CheckCircle,
  Award
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { TourCompletionService } from '../../services/tourCompletionService';
import { ReviewModal } from '../Modals/ReviewModal';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface CompletedTour {
  id: string;
  tourId: string;
  tourName: string;
  agencyId: string;
  agencyName: string;
  tourDate: Date;
  completedAt: Date;
  participants: number;
  totalPrice: number;
  autoCompleted: boolean;
  hasReview?: boolean;
  userReview?: {
    id: string;
    rating: number;
    comment: string;
    createdAt: Date;
  };
}

export const CompletedToursSection: React.FC = () => {
  const { currentUser } = useAuth();
  const [completedTours, setCompletedTours] = useState<CompletedTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState<CompletedTour | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      fetchCompletedTours();
    }
  }, [currentUser?.id]);

  const fetchCompletedTours = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      
      // Get completed tours
      const tours = await TourCompletionService.getCompletedTours(currentUser.id);
      console.log('Fetched completed tours:', tours); // Debug log
      
      // Check review status for each tour
      const toursWithReviewStatus = await Promise.all(
        tours.map(async (tour: any) => {
          const hasReview = await TourCompletionService.hasUserReviewed(tour.id, currentUser.id);
          
          let userReview = null;
          if (hasReview) {
            // Fetch the actual review
            const reviewQuery = query(
              collection(db, 'reviews'),
              where('bookingId', '==', tour.id),
              where('touristId', '==', currentUser.id)
            );
            const reviewSnapshot = await getDocs(reviewQuery);
            if (!reviewSnapshot.empty) {
              const reviewDoc = reviewSnapshot.docs[0];
              const reviewData = reviewDoc.data();
              userReview = {
                id: reviewDoc.id,
                rating: reviewData.rating,
                comment: reviewData.comment,
                createdAt: reviewData.createdAt?.toDate()
              };
            }
          }

          // Create a proper CompletedTour object with all required properties
          // Use the actual structure from the service with fallbacks
          const completedTour: CompletedTour = {
            id: tour.id || '',
            tourId: tour.tourId || tour.id || '', // Use id as fallback for tourId
            tourName: tour.tourName || tour.tourTitle || 'Completed Tour',
            agencyId: tour.agencyId || currentUser.id, // Use current user as fallback
            agencyName: tour.agencyName || 'Tour Agency',
            tourDate: tour.tourDate?.toDate?.() || tour.bookingDate?.toDate?.() || new Date(),
            completedAt: tour.completedAt?.toDate?.() || new Date(),
            participants: tour.participants || 1,
            totalPrice: tour.totalPrice || tour.price || 0,
            autoCompleted: tour.autoCompleted || false,
            hasReview,
            userReview: userReview || undefined
          };

          return completedTour;
        })
      );

      setCompletedTours(toursWithReviewStatus);
    } catch (error) {
      console.error('Error fetching completed tours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveReview = (tour: CompletedTour) => {
    setSelectedTour(tour);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
    setSelectedTour(null);
    // Refresh the completed tours to show the new review
    fetchCompletedTours();
  };

  // Create a complete booking object for the ReviewModal
  const getBookingForReview = (tour: CompletedTour) => {
    return {
      // Core booking properties
      id: tour.id,
      tourId: tour.tourId,
      tourName: tour.tourName,
      agencyId: tour.agencyId,
      touristId: currentUser?.id || '',
      customerName: currentUser?.name || currentUser?.email || 'Customer',
      participants: tour.participants,
      totalPrice: tour.totalPrice,
      status: 'completed' as const,
      tourDate: tour.tourDate,
      bookingDate: tour.tourDate, // Using tourDate as bookingDate
      paymentStatus: 'paid' as const,
      
      // Required properties from Booking interface
      rating: 0,
      available: true,
      image: '',
      category: '',
      difficulty: '',
      maxParticipants: tour.participants,
      reviewsCount: 0,
      
      // Optional properties
      customerEmail: currentUser?.email,
      createdAt: tour.completedAt,
      assignedGuide: undefined,
      internalNotes: undefined,
      feedback: undefined,
      specialRequests: undefined
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <span className="ml-3 text-gray-600">Loading completed tours...</span>
      </div>
    );
  }

  if (completedTours.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Tours Yet</h3>
        <p className="text-gray-500">
          Tours you've completed will appear here, and you'll be able to leave reviews for them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Completed Tours</h2>
        <div className="text-sm text-gray-500">
          {completedTours.length} tour{completedTours.length !== 1 ? 's' : ''} completed
        </div>
      </div>

      <div className="grid gap-6">
        {completedTours.map((tour, index) => (
          <motion.div
            key={tour.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {tour.tourName}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Tour Date: {tour.tourDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{tour.participants} participant{tour.participants !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Completed {tour.completedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">${tour.totalPrice}</div>
                  <div className="text-sm text-gray-500">
                    {tour.autoCompleted ? 'Auto-completed' : 'Manually completed'}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                {tour.hasReview && tour.userReview ? (
                  // Show existing review
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Award className="h-5 w-5 text-amber-600" />
                        <span className="font-medium text-amber-800">Your Review</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= tour.userReview!.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          ({tour.userReview.rating}/5)
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 italic">"{tour.userReview.comment}"</p>
                    <div className="text-xs text-gray-500 mt-2">
                      Reviewed on {tour.userReview.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  // Show review button
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MessageSquare className="h-5 w-5" />
                      <span>Share your experience with other travelers</span>
                    </div>
                    <button
                      onClick={() => handleLeaveReview(tour)}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2"
                    >
                      <Star className="h-4 w-4" />
                      <span>Leave Review</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Review Modal */}
      {selectedTour && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedTour(null);
          } }
          booking={getBookingForReview(selectedTour)}
          onReviewSubmitted={handleReviewSubmitted} mode={'create'}        />
      )}
    </div>
  );
};