import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Star, MapPin, Clock, CreditCard, Heart, Plus, Eye, AlertCircle, Edit, Trash2, CheckCircle, Clock as ClockIcon, AlertTriangle, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBookings, useReviews, useFavorites } from '../../hooks/useFirestore';
import { ReviewModal } from '../../components/Modals/ReviewModal';
import { motion } from 'framer-motion';
import { db } from '../../config/firebase';
import { doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Booking, Review } from '../../types';

// Add this new type for bookings with review status
type BookingWithReviewStatus = Booking & {
  review?: Review;
  reviewStatus: 'reviewed' | 'review_pending' | 'disputed';
};

type BookingFilter = 'all' | 'upcoming' | 'completed' | 'cancelled' | 'pending';

export const TouristDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const { 
    data: bookings, 
    loading: bookingsLoading, 
    error: bookingsError 
  } = useBookings(currentUser?.id || '', 'tourist');
  
  const { data: reviews, loading: reviewsLoading, error: reviewsError } = useReviews(currentUser?.id || '', 'tourist');
  const { data: favorites, loading: favoritesLoading } = useFavorites(currentUser?.id || '');

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [localBookings, setLocalBookings] = useState<Booking[]>([]);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('all');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  // Initialize local bookings state when data loads
  useEffect(() => {
    if (bookings && !bookingsLoading) {
      setLocalBookings(bookings);
    }
  }, [bookings, bookingsLoading]);

  // Set up real-time listeners for bookings
  useEffect(() => {
    if (!currentUser?.id || bookingsLoading) return;

    const unsubscribeCallbacks: (() => void)[] = [];

    localBookings.forEach((booking: Booking) => {
      const bookingRef = doc(db, 'bookings', booking.id);
      const unsubscribe = onSnapshot(bookingRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          
          // Properly handle Firestore timestamps
          const getFirestoreDate = (timestamp: any) => {
            if (!timestamp) return null;
            if (timestamp.toDate && typeof timestamp.toDate === 'function') {
              return timestamp.toDate();
            }
            if (timestamp instanceof Date) {
              return timestamp;
            }
            // If it's a string, try to parse it
            if (typeof timestamp === 'string') {
              return new Date(timestamp);
            }
            return null;
          };

          const updatedBooking: Booking = {
            id: doc.id,
            touristId: data.touristId,
            agencyId: data.agencyId,
            tourId: data.tourId,
            tourName: data.tourName,
            customerName: data.customerName || '',
            tourDate: getFirestoreDate(data.tourDate),
            bookingDate: getFirestoreDate(data.bookingDate) || getFirestoreDate(data.createdAt) || new Date(), // Fallback to createdAt or current date
            status: data.status || 'pending',
            paymentStatus: data.paymentStatus || 'pending',
            totalPrice: data.totalPrice || 0,
            participants: data.participants || 1,
            specialRequests: data.specialRequests,
            completedAt: getFirestoreDate(data.completedAt)
          };

          setLocalBookings(prevBookings => 
            prevBookings.map(b => 
              b.id === updatedBooking.id ? updatedBooking : b
            )
          );

          // Show notification if booking was marked as completed
          if (updatedBooking.status === 'completed' && booking.status !== 'completed') {
            toast.success(`Your ${updatedBooking.tourName} trip is marked as completed. Please share your review 🌟`);
          }

          // Show notification if payment was verified
          if (updatedBooking.paymentStatus === 'verified' && booking.paymentStatus === 'pending') {
            toast.success(`Payment verified for ${updatedBooking.tourName}`);
          }
        }
      });

      unsubscribeCallbacks.push(unsubscribe);
    });

    return () => {
      unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser?.id, localBookings, bookingsLoading]);

  // Filter bookings based on selected filter
  const filteredBookings = useMemo(() => {
    const now = new Date();
    switch (bookingFilter) {
      case 'upcoming':
        return localBookings.filter(booking => 
          booking.status === 'confirmed' && 
          booking.tourDate && 
          booking.tourDate > now
        );
      case 'completed':
        return localBookings.filter(booking => booking.status === 'completed');
      case 'cancelled':
        return localBookings.filter(booking => booking.status === 'cancelled');
      case 'pending':
        return localBookings.filter(booking => 
          booking.status === 'pending' || booking.paymentStatus === 'pending'
        );
      default:
        return localBookings;
    }
  }, [localBookings, bookingFilter]);

  // Get completed bookings with review status
  const completedBookings = useMemo(() => {
    return localBookings
      .filter(booking => booking.status === 'completed')
      .map(booking => {
        const review = reviews.find(r => r.bookingId === booking.id);
        return {
          ...booking,
          review,
          reviewStatus: review 
            ? 'reviewed' 
            : (booking.status === 'disputed' ? 'disputed' : 'review_pending')
        } as BookingWithReviewStatus;
      });
  }, [localBookings, reviews]);

  // Check if review is within 30 days of completion
  const canReviewBooking = (booking: Booking) => {
    if (!booking.completedAt) return false;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return booking.completedAt >= thirtyDaysAgo;
  };

  // Get completed bookings that need reviews
  const completedBookingsWithoutReviews = useMemo(() => {
    return localBookings.filter(booking => 
      booking.status === 'completed' && 
      !reviews.some(review => review.bookingId === booking.id) &&
      canReviewBooking(booking)
    );
  }, [localBookings, reviews]);

  // Stats with real favorites count
  const stats = [
    { 
      label: 'Total Bookings', 
      value: localBookings.length.toString(), 
      icon: Calendar,
      description: 'All time bookings'
    },
    { 
      label: 'Upcoming Tours', 
      value: localBookings.filter(b => b.status === 'confirmed' && b.tourDate && b.tourDate > new Date()).length.toString(), 
      icon: Clock,
      description: 'Confirmed upcoming tours'
    },
    { 
      label: 'Completed Tours', 
      value: completedBookings.length.toString(), 
      icon: MapPin,
      description: 'Successfully completed'
    },
    { 
      label: 'Favorites', 
      value: favorites.length.toString(), 
      icon: Heart,
      description: 'Saved tours & agencies'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': 
        return <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Paid</span>;
      case 'pending': 
        return <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Payment Pending</span>;
      case 'failed': 
        return <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Payment Failed</span>;
      case 'pending_verification':
        return <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending Verification</span>;
      default: 
        return <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const handleLeaveReview = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedReview(null);
    setModalMode('create');
    setShowReviewModal(true);
  };

  const handleEditReview = (booking: Booking, review: Review) => {
    setSelectedBooking(booking);
    setSelectedReview(review);
    setModalMode('edit');
    setShowReviewModal(true);
  };

  const handleDeleteReview = async (review: Review) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await deleteDoc(doc(db, 'reviews', review.id));
      toast.success('Review deleted successfully');
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const toggleBookingExpansion = (bookingId: string) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
  };

  // Format date safely
  const formatDate = (date: Date | null) => {
    if (!date) return 'Not available';
    try {
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (bookingsLoading || reviewsLoading || favoritesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('dashboard.welcome')}, {currentUser?.name}!
          </h1>
          <p className="text-gray-600 mt-2">{t('dashboard.tourist.title')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-lg shadow"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{t('dashboard.bookings')}</h3>
              <Link
                to="/tours"
                className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Book Tour</span>
              </Link>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {localBookings.length > 0 ? (
                  localBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{booking.tourName}</h4>
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                          {getPaymentStatusBadge(booking.paymentStatus)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(booking.tourDate)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CreditCard className="h-4 w-4" />
                          <span>${booking.totalPrice}</span>
                        </div>
                      </div>
                      {booking.status === 'completed' &&
                        !reviews.some(review => review.bookingId === booking.id) && (
                          <button
                            onClick={() => handleLeaveReview(booking)}
                            className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                          >
                            Leave Review
                          </button>
                        )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No bookings yet</p>
                    <Link
                      to="/tours"
                      className="inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Book Your First Tour</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Recent Reviews */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-lg shadow"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{t('dashboard.reviews')}</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.slice(0, 3).map((review: Review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{review.tourName}</h4>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{review.comment}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">{review.createdAt?.toLocaleDateString()}</p>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              const booking = localBookings.find(b => b.id === review.bookingId);
                              if (booking) handleEditReview(booking, review);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteReview(review)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No reviews yet</p>
                    <p className="text-sm text-gray-400 mt-2">Book a tour to leave your first review!</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Booking History Section */}
        {localBookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 bg-white rounded-lg shadow"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Booking History</h3>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select 
                  value={bookingFilter}
                  onChange={(e) => setBookingFilter(e.target.value as BookingFilter)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All Bookings</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{booking.tourName}</h4>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        {getPaymentStatusBadge(booking.paymentStatus)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(booking.tourDate)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CreditCard className="h-4 w-4" />
                        <span>${booking.totalPrice}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{booking.participants} {booking.participants === 1 ? 'person' : 'people'}</span>
                      </div>
                    </div>
                    
                    {/* Expandable details */}
                    <div className="mt-3">
                      <button
                        onClick={() => toggleBookingExpansion(booking.id)}
                        className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>{expandedBooking === booking.id ? 'Hide' : 'View'} Details</span>
                      </button>
                      
                      {expandedBooking === booking.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2"
                        >
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Booking Date:</span>
                              <p>{formatDate(booking.bookingDate)}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Tour Date:</span>
                              <p>{formatDate(booking.tourDate)}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Participants:</span>
                              <p>{booking.participants}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Total Price:</span>
                              <p>${booking.totalPrice}</p>
                            </div>
                            {booking.specialRequests && (
                              <div className="col-span-2">
                                <span className="font-medium text-gray-600">Special Requests:</span>
                                <p className="mt-1">{booking.specialRequests}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Review actions for completed bookings */}
                          {booking.status === 'completed' && (
                            <div className="pt-3 border-t border-gray-200">
                              {reviews.some(review => review.bookingId === booking.id) ? (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-green-600 font-medium">Review Submitted</span>
                                  <button
                                    onClick={() => {
                                      const review = reviews.find(r => r.bookingId === booking.id);
                                      if (review) handleEditReview(booking, review);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    Edit Review
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleLeaveReview(booking)}
                                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                  Leave Review
                                </button>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredBookings.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {bookingFilter === 'all' 
                      ? 'No bookings found' 
                      : `No ${bookingFilter} bookings`}
                  </p>
                  {bookingFilter !== 'all' && (
                    <button
                      onClick={() => setBookingFilter('all')}
                      className="mt-2 text-amber-600 hover:text-amber-700 text-sm font-medium"
                    >
                      View all bookings
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/tours"
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center"
            >
              Browse Tours
            </Link>
            <Link
              to="/festivals"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center"
            >
              View Festivals
            </Link>
            <Link
              to="/favorites"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center flex items-center justify-center space-x-2"
            >
              <Heart className="h-5 w-5" />
              <span>My Favorites</span>
            </Link>
            {completedBookingsWithoutReviews.length > 0 && (
              <button
                onClick={() => handleLeaveReview(completedBookingsWithoutReviews[0])}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Leave Review
              </button>
            )}
          </div>
        </motion.div>

        {/* Pending Reviews Alert */}
        {completedBookingsWithoutReviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4"
          >
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-400 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">
                  You have {completedBookingsWithoutReviews.length} completed tour{completedBookingsWithoutReviews.length > 1 ? 's' : ''} waiting for review
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  Help other travelers by sharing your experience!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Review Modal */}
      {(selectedBooking || selectedReview) && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedBooking(null);
            setSelectedReview(null);
          }}
          booking={selectedBooking}
          review={selectedReview}
          mode={modalMode}
        />
      )}
    </div>
  );
};