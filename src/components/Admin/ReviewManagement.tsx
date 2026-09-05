import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Star, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle,
  Filter,
  Search,
  Eye,
  MessageSquare,
  X
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc,
  Timestamp,
  where
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  bookingId: string;
  tourId: string;
  tourName: string;
  touristId: string;
  touristName: string;
  agencyId: string;
  agencyName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  verified: boolean;
  isRemoved: boolean;
  removedBy?: string;
  removedAt?: Date;
  removalReason?: string;
}

export const ReviewManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'removed'>('all');
  const [filterRating, setFilterRating] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showRemovalModal, setShowRemovalModal] = useState(false);
  const [removalReason, setRemovalReason] = useState('');

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;

    const reviewsQuery = query(
      collection(db, 'reviews'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          bookingId: data.bookingId,
          tourId: data.tourId,
          tourName: data.tourName,
          touristId: data.touristId,
          touristName: data.touristName,
          agencyId: data.agencyId,
          agencyName: data.agencyName || 'Unknown Agency',
          rating: data.rating,
          comment: data.comment,
          createdAt: data.createdAt?.toDate() || new Date(),
          verified: data.verified || false,
          isRemoved: data.isRemoved || false,
          removedBy: data.removedBy,
          removedAt: data.removedAt?.toDate(),
          removalReason: data.removalReason
        } as Review;
      });

      setReviews(reviewsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const filteredReviews = reviews.filter(review => {
    // Status filter
    if (filterStatus === 'active' && review.isRemoved) return false;
    if (filterStatus === 'removed' && !review.isRemoved) return false;

    // Rating filter
    if (filterRating !== 'all' && review.rating !== parseInt(filterRating)) return false;

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        review.tourName.toLowerCase().includes(searchLower) ||
        review.touristName.toLowerCase().includes(searchLower) ||
        review.comment.toLowerCase().includes(searchLower) ||
        review.agencyName.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const handleRemoveReview = (review: Review) => {
    setSelectedReview(review);
    setShowRemovalModal(true);
  };

  const confirmRemoveReview = async () => {
    if (!selectedReview || !currentUser) return;

    try {
      const reviewRef = doc(db, 'reviews', selectedReview.id);
      await updateDoc(reviewRef, {
        isRemoved: true,
        removedBy: currentUser.id,
        removedAt: Timestamp.now(),
        removalReason: removalReason.trim() || 'No reason provided',
        updatedAt: Timestamp.now()
      });

      toast.success('Review removed successfully');
      setShowRemovalModal(false);
      setSelectedReview(null);
      setRemovalReason('');
    } catch (error) {
      console.error('Error removing review:', error);
      toast.error('Failed to remove review');
    }
  };

  const handleRestoreReview = async (reviewId: string) => {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, {
        isRemoved: false,
        restoredBy: currentUser?.id,
        restoredAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      toast.success('Review restored successfully');
    } catch (error) {
      console.error('Error restoring review:', error);
      toast.error('Failed to restore review');
    }
  };

  const getStatusBadge = (review: Review) => {
    if (review.isRemoved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Removed
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </span>
    );
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">Only administrators can access review management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Review Management</h2>
          <p className="text-gray-600">Monitor and moderate user reviews across all tours</p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredReviews.length} of {reviews.length} reviews
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Reviews</option>
              <option value="active">Active Reviews</option>
              <option value="removed">Removed Reviews</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterStatus('all');
                setFilterRating('all');
                setSearchQuery('');
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          <span className="ml-3 text-gray-600">Loading reviews...</span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Found</h3>
          <p className="text-gray-500">
            {searchQuery || filterStatus !== 'all' || filterRating !== 'all'
              ? 'Try adjusting your filters to see more reviews.'
              : 'Reviews will appear here once tourists start leaving feedback.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={`bg-white rounded-lg shadow border p-6 ${
                review.isRemoved ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {review.tourName}
                    </h3>
                    {getStatusBadge(review)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>Tourist: {review.touristName}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Reviewed: {review.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Agency: {review.agencyName}</span>
                      </div>
                      <div>{getRatingStars(review.rating)}</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Review Comment:</h4>
                    <p className="text-gray-700 italic">"{review.comment}"</p>
                  </div>

                  {review.isRemoved && (
                    <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2 text-red-800 mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Review Removed</span>
                      </div>
                      <p className="text-sm text-red-700">
                        Reason: {review.removalReason}
                      </p>
                      {review.removedAt && (
                        <p className="text-xs text-red-600 mt-1">
                          Removed on {review.removedAt.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  {!review.isRemoved ? (
                    <button
                      onClick={() => handleRemoveReview(review)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Remove</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestoreReview(review.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Restore</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Removal Confirmation Modal */}
      <AnimatePresence>
        {showRemovalModal && selectedReview && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                onClick={() => setShowRemovalModal(false)}
              />

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Remove Review</h3>
                  <button
                    onClick={() => setShowRemovalModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    You are about to remove this review from <strong>{selectedReview.tourName}</strong> 
                    by <strong>{selectedReview.touristName}</strong>.
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      {getRatingStars(selectedReview.rating)}
                    </div>
                    <p className="text-sm text-gray-700 italic">"{selectedReview.comment}"</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for removal (required)
                    </label>
                    <textarea
                      value={removalReason}
                      onChange={(e) => setRemovalReason(e.target.value)}
                      placeholder="Please provide a reason for removing this review..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowRemovalModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRemoveReview}
                    disabled={!removalReason.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove Review
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};