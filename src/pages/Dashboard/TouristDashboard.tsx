import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, Star, MapPin, Clock, CreditCard, Heart, Plus, Eye, AlertCircle, Edit, Trash2, CheckCircle, Clock as ClockIcon, AlertTriangle, Filter, XCircle, RefreshCw, FileText, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBookings, useReviews, useFavorites } from '../../hooks/useFirestore';
import { ReviewModal } from '../../components/Modals/ReviewModal';
import { motion } from 'framer-motion';
import { db } from '../../config/firebase';
import { doc, deleteDoc, updateDoc, Timestamp, query, collection, where, getDocs, addDoc, serverTimestamp, getDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Booking, Review, RefundRequest } from '../../types';

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
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('all');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedBookingForRefund, setSelectedBookingForRefund] = useState<Booking | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  
  // Use ref to track previous booking states for notifications
  const previousBookingsRef = useRef<Map<string, Booking>>(new Map());
  const previousRefundStatusesRef = useRef<Map<string, string>>(new Map());

  // Process bookings data and handle date conversions
  const localBookings = useMemo(() => {
    if (!bookings || bookingsLoading) return [];
    
    return bookings.map((booking: any) => {
      // Helper function to handle Firestore timestamps
      const getFirestoreDate = (timestamp: any) => {
        if (!timestamp) return null;
        if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }
        if (timestamp instanceof Date) {
          return timestamp;
        }
        if (typeof timestamp === 'string') {
          return new Date(timestamp);
        }
        return null;
      };

      return {
        ...booking,
        tourDate: getFirestoreDate(booking.tourDate),
        bookingDate: getFirestoreDate(booking.bookingDate) || getFirestoreDate(booking.createdAt) || new Date(),
        completedAt: getFirestoreDate(booking.completedAt)
      } as Booking;
    });
  }, [bookings, bookingsLoading]);

  // Real-time listener for refund requests
  useEffect(() => {
    if (!currentUser?.id) return;

    // Try with orderBy first, fallback to without if index doesn't exist
    let refundRequestsQuery;
    try {
      refundRequestsQuery = query(
        collection(db, 'refundRequests'),
        where('touristId', '==', currentUser.id),
        orderBy('createdAt', 'desc')
      );
    } catch (error) {
      // If orderBy fails (no index), use query without orderBy
      console.warn('OrderBy not available, using query without sorting:', error);
      refundRequestsQuery = query(
        collection(db, 'refundRequests'),
        where('touristId', '==', currentUser.id)
      );
    }

    const unsubscribe = onSnapshot(
      refundRequestsQuery,
      (snapshot) => {
        const requests = snapshot.docs.map(doc => {
          const data = doc.data();
          const refundRequest: RefundRequest = {
            id: doc.id,
            bookingId: data.bookingId || '',
            touristId: data.touristId || '',
            touristName: data.touristName || '',
            touristEmail: data.touristEmail || '',
            tourId: data.tourId || '',
            tourName: data.tourName || '',
            agencyId: data.agencyId || '',
            agencyName: data.agencyName || '',
            amount: data.amount || 0,
            reason: data.reason || '',
            status: data.status || 'pending',
            paymentStatus: data.paymentStatus || 'paid',
            paymentId: data.paymentId,
            txRef: data.txRef,
            adminNotes: data.adminNotes || '',
            systemNotes: data.systemNotes,
            processedBy: data.processedBy,
            processedAt: data.processedAt?.toDate() || undefined,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };
          return refundRequest;
        });
        
        // Sort manually if orderBy wasn't used
        requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        console.log('Refund requests loaded:', requests.length, requests);
        setRefundRequests(requests);
      },
      (error) => {
        console.error('Error listening to refund requests:', error);
        toast.error('Failed to load refund requests. Please refresh the page.');
      }
    );

    return () => unsubscribe();
  }, [currentUser?.id]);

  // Show notifications when refund request status changes
  useEffect(() => {
    if (!refundRequests.length) return;

    refundRequests.forEach((request) => {
      const previousStatus = previousRefundStatusesRef.current.get(request.id);
      
      // Only show notification if status changed
      if (previousStatus && previousStatus !== request.status) {
        if (request.status === 'approved') {
          toast.success(`Your refund request for "${request.tourName}" has been approved!`, {
            duration: 5000,
            icon: '✅'
          });
        } else if (request.status === 'processed') {
          toast.success(`Refund of $${request.amount} for "${request.tourName}" has been processed!`, {
            duration: 5000,
            icon: '💰'
          });
        } else if (request.status === 'rejected') {
          toast.error(`Your refund request for "${request.tourName}" was rejected. Reason: ${request.adminNotes || 'No reason provided'}`, {
            duration: 6000,
            icon: '❌'
          });
        }
      }
      
      previousRefundStatusesRef.current.set(request.id, request.status);
    });
  }, [refundRequests]);

  // Show notifications when booking status changes (only once per change)
  useEffect(() => {
    if (!localBookings.length || bookingsLoading) return;

    const currentBookingsMap = new Map(localBookings.map(b => [b.id, b]));
    const previousBookingsMap = previousBookingsRef.current;

    // Check for status changes and show notifications
    localBookings.forEach((booking) => {
      const previousBooking = previousBookingsMap.get(booking.id);
      
      if (previousBooking) {
        // Show notification if booking was marked as completed
        if (booking.status === 'completed' && previousBooking.status !== 'completed') {
          toast.success(`Your ${booking.tourName} trip is marked as completed. Please share your review 🌟`);
        }

        // Show notification if payment was verified
        if (booking.paymentStatus === 'verified' && previousBooking.paymentStatus !== 'verified') {
          toast.success(`Payment verified for ${booking.tourName}`);
        }
      }
    });

    // Update the ref with current bookings
    previousBookingsRef.current = currentBookingsMap;
  }, [localBookings, bookingsLoading]);

  // Get upcoming tours (bookings with future dates)
  const upcomingTours = useMemo(() => {
    const now = new Date();
    return localBookings
      .filter(booking => 
        booking.tourDate && 
        booking.tourDate > now &&
        booking.status !== 'cancelled'
      )
      .sort((a, b) => {
        // Sort by tour date (earliest first)
        const dateA = a.tourDate?.getTime() || 0;
        const dateB = b.tourDate?.getTime() || 0;
        return dateA - dateB;
      });
  }, [localBookings]);

  // Calculate days until tour
  const getDaysUntilTour = (tourDate: Date | null): number | null => {
    if (!tourDate) return null;
    const now = new Date();
    const diffTime = tourDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter bookings based on selected filter
  const filteredBookings = useMemo(() => {
    const now = new Date();
    switch (bookingFilter) {
      case 'upcoming':
        return localBookings.filter(booking => 
          booking.tourDate && 
          booking.tourDate > now &&
          booking.status !== 'cancelled'
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
      value: localBookings
        .filter(b => b.tourDate && b.tourDate > new Date() && b.status !== 'cancelled')
        .length
        .toString(), 
      icon: Clock,
      description: 'Tours scheduled in the future'
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

  // Check if booking can be cancelled
  const canCancelBooking = (booking: Booking) => {
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return false;
    }
    if (booking.tourDate && booking.tourDate < new Date()) {
      return false;
    }
    return true;
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': 
      case 'paid':
        return <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Paid</span>;
      case 'refunded':
        return <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Refunded</span>;
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

  // Cancel booking - show refund request form if payment was made
  const handleCancelBooking = async (booking: Booking) => {
    // Check if booking can be cancelled
    if (booking.status === 'completed') {
      toast.error('Cannot cancel a completed booking');
      return;
    }

    if (booking.status === 'cancelled') {
      toast.error('This booking is already cancelled');
      return;
    }

    // Check if tour date has passed
    if (booking.tourDate && booking.tourDate < new Date()) {
      toast.error('Cannot cancel a booking for a tour that has already started');
      return;
    }

    // Check if there's already a refund request for this booking
    const existingRefundRequest = getRefundRequestForBooking(booking.id);
    if (existingRefundRequest) {
      toast.error('A refund request already exists for this booking. Please wait for admin approval.');
      return;
    }

    // If payment was made, show refund request form
    if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'verified') {
      // Set booking for refund request and show modal
      setSelectedBookingForRefund(booking);
      setShowRefundModal(true);
      // Note: Booking will be cancelled automatically when admin approves the refund
      return;
    }

    // If no payment, just cancel directly
    const confirmMessage = `Are you sure you want to cancel "${booking.tourName}"?\n\n` +
      `Total Amount: $${booking.totalPrice}\n` +
      `\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    try {
      // Update booking status to cancelled (no payment, so no refund needed)
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
        cancelledBy: currentUser?.id,
        updatedAt: Timestamp.now()
      });

      toast.success('Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking. Please try again or contact support.');
    }
  };

  // Process refund for cancelled booking
  const processRefund = async (booking: Booking) => {
    try {
      // Find payment record - check for completed or paid status
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('bookingId', '==', booking.id)
      );
      const paymentDocs = await getDocs(paymentsQuery);
      
      // Filter for completed or paid payments
      const validPayments = paymentDocs.docs.filter(doc => {
        const data = doc.data();
        return data.status === 'completed' || data.status === 'paid';
      });

      if (validPayments.length > 0) {
        const paymentDoc = validPayments[0];
        const paymentData = paymentDoc.data();

        // Update payment status to refunded
        await updateDoc(paymentDoc.ref, {
          status: 'refunded',
          refundedAt: Timestamp.now(),
          refundAmount: booking.totalPrice,
          refundReason: 'Booking cancelled by customer',
          updatedAt: Timestamp.now()
        });

        // Update booking payment status
        await updateDoc(doc(db, 'bookings', booking.id), {
          paymentStatus: 'refunded',
          refundAmount: booking.totalPrice,
          refundProcessedAt: Timestamp.now()
        });

        // If payment was made through Chapa, initiate refund through backend
        if (paymentData.method === 'chapa' && paymentData.txRef) {
          try {
            const response = await fetch('/api/chapa/refund', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                txRef: paymentData.txRef,
                amount: booking.totalPrice,
                reason: 'Booking cancelled by customer',
                bookingId: booking.id
              })
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Refund request failed');
            }

            const refundData = await response.json();
            console.log('Refund processed:', refundData);
            
            // Update payment with refund reference
            await updateDoc(paymentDoc.ref, {
              refundReference: refundData.refundRef || refundData.txRef,
              refundStatus: refundData.status || 'processing'
            });
          } catch (refundError: any) {
            console.error('Chapa refund error:', refundError);
            // Still mark as refunded in our system, but note it needs manual processing
            await updateDoc(paymentDoc.ref, {
              refundStatus: 'pending_manual',
              refundNote: 'Automatic refund failed. Manual processing required.'
            });
            toast.error('Booking cancelled. Refund is being processed manually. You will receive a confirmation email.', {
              duration: 5000,
              icon: '⚠️'
            });
            return;
          }
        }

        toast.success(`Booking cancelled successfully. Refund of $${booking.totalPrice} is being processed.`);
      } else {
        // No payment record found, just cancel the booking
        await updateDoc(doc(db, 'bookings', booking.id), {
          paymentStatus: 'refunded'
        });
        toast.success('Booking cancelled successfully');
      }
    } catch (error: any) {
      console.error('Refund processing error:', error);
      toast.error('Booking cancelled but refund processing failed. Please contact support.');
    }
  };

  const toggleBookingExpansion = (bookingId: string) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
  };

  // Get refund request for a booking
  const getRefundRequestForBooking = (bookingId: string): RefundRequest | undefined => {
    const request = refundRequests.find(req => req.bookingId === bookingId);
    if (request) {
      console.log('Found refund request for booking', bookingId, ':', request);
    }
    return request;
  };

  // Check if booking can request refund
  const canRequestRefund = (booking: Booking) => {
    // Check if there's already ANY refund request (regardless of status)
    const existingRequest = getRefundRequestForBooking(booking.id);
    if (existingRequest) {
      return false; // Already has a refund request - show status instead
    }

    // Can request refund if payment is paid/verified and booking is not cancelled or already refunded
    return (booking.paymentStatus === 'paid' || booking.paymentStatus === 'verified') &&
           booking.status !== 'cancelled' &&
           booking.paymentStatus !== 'refunded';
  };

  // Get refund status badge
  const getRefundStatusBadge = (request: RefundRequest) => {
    switch (request.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Refund Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Refund Approved
          </span>
        );
      case 'processed':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Refund Processed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Refund Rejected
          </span>
        );
      default:
        return null;
    }
  };

  // Handle refund request
  const handleRequestRefund = async () => {
    if (!selectedBookingForRefund || !refundReason.trim()) {
      toast.error('Please provide a reason for the refund request');
      return;
    }

    setIsSubmittingRefund(true);

    try {
      // Check if refund request already exists - check for pending or approved status
      const existingRefundQuery = query(
        collection(db, 'refundRequests'),
        where('bookingId', '==', selectedBookingForRefund.id)
      );
      const existingRefunds = await getDocs(existingRefundQuery);

      // Filter in memory to check for pending or approved status
      const activeRefunds = existingRefunds.docs.filter(doc => {
        const data = doc.data();
        return data.status === 'pending' || data.status === 'approved';
      });

      if (activeRefunds.length > 0) {
        toast.error('A refund request for this booking already exists');
        setIsSubmittingRefund(false);
        return;
      }

      // Get payment info
      let paymentData: any = null;
      try {
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('bookingId', '==', selectedBookingForRefund.id)
        );
        const paymentDocs = await getDocs(paymentsQuery);
        if (!paymentDocs.empty) {
          paymentData = paymentDocs.docs[0].data();
          paymentData.id = paymentDocs.docs[0].id;
        }
      } catch (paymentError) {
        console.warn('Could not fetch payment info:', paymentError);
        // Continue without payment info
      }

      // Validate required fields
      if (!currentUser?.id || !currentUser?.name || !currentUser?.email) {
        toast.error('User information is missing. Please try logging out and back in.');
        setIsSubmittingRefund(false);
        return;
      }

      // Create refund request
      const refundRequestData = {
        bookingId: selectedBookingForRefund.id,
        touristId: currentUser.id,
        touristName: currentUser.name,
        touristEmail: currentUser.email,
        tourId: selectedBookingForRefund.tourId,
        tourName: selectedBookingForRefund.tourName || 'Unknown Tour',
        agencyId: selectedBookingForRefund.agencyId || '',
        agencyName: selectedBookingForRefund.agencyName || 'Unknown Agency',
        amount: selectedBookingForRefund.totalPrice || 0,
        reason: refundReason.trim(),
        status: 'pending',
        paymentStatus: selectedBookingForRefund.paymentStatus || 'paid',
        paymentId: paymentData?.id || null,
        txRef: paymentData?.txRef || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const refundRequestRef = await addDoc(collection(db, 'refundRequests'), refundRequestData);
      console.log('Refund request created with ID:', refundRequestRef.id);

      // Create notification for admin
      try {
        await addDoc(collection(db, 'notifications'), {
          type: 'booking',
          title: 'New Refund Request',
          message: `${currentUser.name} requested a refund of $${selectedBookingForRefund.totalPrice} for "${selectedBookingForRefund.tourName}"`,
          read: false,
          createdAt: serverTimestamp(),
          priority: 'high',
          actionUrl: '/dashboard?tab=refunds'
        });
      } catch (notifError) {
        console.warn('Could not create notification:', notifError);
        // Continue even if notification fails
      }

      toast.success('Refund request submitted successfully! Admin will review your request. The booking will be cancelled once approved.');
      setShowRefundModal(false);
      setSelectedBookingForRefund(null);
      setRefundReason('');
    } catch (error: any) {
      console.error('Error requesting refund:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to submit refund request. Please try again.';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your account permissions.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmittingRefund(false);
    }
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

        {/* Upcoming Tours Section - Full Width */}
        {upcomingTours.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 bg-white rounded-lg shadow"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-medium text-gray-900">Upcoming Tours</h3>
                <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                  {upcomingTours.length}
                </span>
              </div>
              <button
                onClick={() => setBookingFilter('upcoming')}
                className="text-amber-600 hover:text-amber-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingTours.slice(0, 6).map((booking) => {
                  const daysUntil = getDaysUntilTour(booking.tourDate);
                  return (
                    <div 
                      key={booking.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{booking.tourName}</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(booking.tourDate)}</span>
                            </div>
                            {daysUntil !== null && daysUntil >= 0 && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span className={daysUntil <= 7 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                  {daysUntil === 0 
                                    ? 'Today!' 
                                    : daysUntil === 1 
                                    ? 'Tomorrow' 
                                    : `${daysUntil} days left`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1 ml-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                          {getPaymentStatusBadge(booking.paymentStatus)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-3 text-sm">
                          <div className="flex items-center space-x-1 text-gray-600">
                            <CreditCard className="h-4 w-4" />
                            <span>${booking.totalPrice}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>{booking.participants}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleBookingExpansion(booking.id)}
                            className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {upcomingTours.length > 6 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setBookingFilter('upcoming')}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                  >
                    View {upcomingTours.length - 6} more upcoming {upcomingTours.length - 6 === 1 ? 'tour' : 'tours'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

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
                      <div className="flex items-center space-x-3 mt-2">
                        {booking.status === 'completed' &&
                          !reviews.some(review => review.bookingId === booking.id) && (
                            <button
                              onClick={() => handleLeaveReview(booking)}
                              className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                            >
                              Leave Review
                            </button>
                          )}
                        {canCancelBooking(booking) && (
                          <button
                            onClick={() => handleCancelBooking(booking)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Cancel</span>
                          </button>
                        )}
                        {booking.status === 'cancelled' && booking.paymentStatus === 'refunded' && (
                          <span className="text-sm text-green-600 font-medium">
                            Refunded
                          </span>
                        )}
                      </div>
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
                          
                          {/* Refund status for cancelled bookings */}
                          {booking.status === 'cancelled' && (
                            <div className="pt-3 border-t border-gray-200">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700">Refund Status:</span>
                                  <span className={`text-sm font-medium ${
                                    booking.paymentStatus === 'refunded' 
                                      ? 'text-green-600' 
                                      : booking.paymentStatus === 'paid' || booking.paymentStatus === 'verified'
                                      ? 'text-amber-600'
                                      : 'text-gray-600'
                                  }`}>
                                    {booking.paymentStatus === 'refunded' 
                                      ? 'Refunded' 
                                      : booking.paymentStatus === 'paid' || booking.paymentStatus === 'verified'
                                      ? 'Refund Processing'
                                      : 'No Refund Required'}
                                  </span>
                                </div>
                                {booking.paymentStatus === 'refunded' && (
                                  <p className="text-xs text-gray-500">
                                    Refund of ${booking.totalPrice} has been processed
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Cancel button for eligible bookings */}
                          {canCancelBooking(booking) && (
                            <div className="pt-3 border-t border-gray-200">
                              <button
                                onClick={() => handleCancelBooking(booking)}
                                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                              >
                                <XCircle className="h-4 w-4" />
                                <span>Cancel Booking</span>
                              </button>
                            </div>
                          )}

                          {/* Refund Request Section */}
                          <div className="pt-3 border-t border-gray-200">
                            {(() => {
                              const refundRequest = getRefundRequestForBooking(booking.id);
                              
                              // ALWAYS show refund request status if it exists (regardless of status)
                              if (refundRequest) {
                                // Show refund request status
                                return (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-gray-700">Refund Request:</span>
                                      {getRefundStatusBadge(refundRequest)}
                                    </div>
                                    {refundRequest.reason && (
                                      <div className="bg-gray-50 p-2 rounded text-xs">
                                        <p className="text-gray-600"><strong>Your Reason:</strong> {refundRequest.reason}</p>
                                      </div>
                                    )}
                                    {(refundRequest.adminNotes || refundRequest.status === 'processed' || refundRequest.status === 'approved' || refundRequest.status === 'rejected') && (
                                      <div className={`p-3 rounded text-xs ${
                                        refundRequest.status === 'rejected' 
                                          ? 'bg-red-50 text-red-700 border border-red-200' 
                                          : refundRequest.status === 'processed'
                                          ? 'bg-green-50 text-green-700 border border-green-200'
                                          : refundRequest.status === 'approved'
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                      }`}>
                                        <p className="font-semibold mb-1">Admin Response:</p>
                                        {refundRequest.adminNotes ? (
                                          <p className="italic">"{refundRequest.adminNotes}"</p>
                                        ) : (
                                          <p className="italic text-gray-600">
                                            {refundRequest.status === 'processed' 
                                              ? 'Refund has been successfully processed.'
                                              : refundRequest.status === 'approved'
                                              ? 'Your refund request has been approved and is being processed.'
                                              : refundRequest.status === 'rejected'
                                              ? 'Your refund request has been rejected. Please contact support for more details.'
                                              : 'Response pending...'}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    {refundRequest.status === 'processed' && refundRequest.processedAt && (
                                      <p className="text-xs text-gray-500">
                                        Processed on: {refundRequest.processedAt.toLocaleDateString()}
                                      </p>
                                    )}
                                    {refundRequest.status === 'pending' && (
                                      <p className="text-xs text-gray-500 italic">
                                        Your request is being reviewed by admin...
                                      </p>
                                    )}
                                  </div>
                                );
                              } else if (canRequestRefund(booking)) {
                                // Show request refund button
                                return (
                                  <button
                                    onClick={() => {
                                      setSelectedBookingForRefund(booking);
                                      setShowRefundModal(true);
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                    <span>Request Refund</span>
                                  </button>
                                );
                              } else if (booking.paymentStatus === 'refunded') {
                                // Show already refunded status
                                return (
                                  <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Refunded</span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
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

      {/* Refund Request Modal */}
      {showRefundModal && selectedBookingForRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Request Refund</h3>
                {selectedBookingForRefund.status !== 'cancelled' && (
                  <p className="text-xs text-amber-600 mt-1">
                    Note: Your booking will be cancelled once the refund is approved by admin
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedBookingForRefund(null);
                  setRefundReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={isSubmittingRefund}
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4 space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Tour:</strong> {selectedBookingForRefund.tourName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Amount:</strong> ${selectedBookingForRefund.totalPrice}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Booking Date:</strong> {formatDate(selectedBookingForRefund.bookingDate)}
              </p>
              {selectedBookingForRefund.status !== 'cancelled' && selectedBookingForRefund.tourDate && (
                <p className="text-sm text-gray-600">
                  <strong>Tour Date:</strong> {formatDate(selectedBookingForRefund.tourDate)}
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Refund Request <span className="text-red-500">*</span>
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please provide a detailed reason for your refund request (e.g., change of plans, emergency, dissatisfaction with service)..."
                disabled={isSubmittingRefund}
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedBookingForRefund(null);
                  setRefundReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmittingRefund}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRefund}
                disabled={isSubmittingRefund || !refundReason.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmittingRefund ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};