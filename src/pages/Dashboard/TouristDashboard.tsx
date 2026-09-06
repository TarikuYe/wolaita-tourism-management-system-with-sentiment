import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, Star, MapPin, Clock, CreditCard, Heart, Plus, Eye, AlertCircle, Edit, Trash2, CheckCircle, Clock as ClockIcon, AlertTriangle, Filter, XCircle, RefreshCw, FileText, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBookings, useReviews, useFavorites } from '../../hooks/useFirestore';
import { ReviewModal } from '../../components/Modals/ReviewModal';
import { TouristBookingDetailsModal } from '../../components/Modals/TouristBookingDetailsModal';
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
  
  // Booking Details Modal state and Upcoming Tours expand state
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  
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
            id: `refund-approved-${request.id}`,
            duration: 5000,
            icon: '✅'
          });
        } else if (request.status === 'processed') {
          toast.success(`Refund of $${request.amount} for "${request.tourName}" has been processed!`, {
            id: `refund-processed-${request.id}`,
            duration: 5000,
            icon: '💰'
          });
        } else if (request.status === 'rejected') {
          toast.error(`Your refund request for "${request.tourName}" was rejected. Reason: ${request.adminNotes || 'No reason provided'}`, {
            id: `refund-rejected-${request.id}`,
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
          toast.success(`Your ${booking.tourName} trip is marked as completed. Please share your review 🌟`, {
            id: `booking-completed-${booking.id}`
          });
        }

        // Show notification if payment was verified
        if (booking.paymentStatus === 'verified' && previousBooking.paymentStatus !== 'verified') {
          toast.success(`Payment verified for ${booking.tourName}`, {
            id: `booking-payment-verified-${booking.id}`
          });
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

  const handleViewBookingDetails = (booking: Booking) => {
    setSelectedBookingForDetails(booking);
    setShowDetailsModal(true);
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

    // Can request refund if payment is paid/verified and booking is not cancelled
    return (booking.paymentStatus === 'paid' || booking.paymentStatus === 'verified') &&
           booking.status !== 'cancelled';
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
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-3 shadow-xs">
            <span>🟠 Tourist Control Center</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            {t('dashboard.welcome')}, <span className="text-orange-500">{currentUser?.name}</span>!
          </h1>
          <p className="text-slate-600 text-sm md:text-base mt-2">{t('dashboard.tourist.title') || 'Manage your upcoming bookings, tour reviews, and travel wishlist.'}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 p-6 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-100/80 text-orange-600 flex items-center justify-center border border-orange-200/60 shrink-0">
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{stat.description}</p>
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
            className="mb-10 bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Upcoming Tours</h3>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-orange-50 border border-orange-200/80 text-orange-700 rounded-full">
                  {upcomingTours.length}
                </span>
              </div>
              {upcomingTours.length > 6 ? (
                <button
                  onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                  className="text-orange-600 hover:text-orange-700 text-xs font-bold uppercase tracking-wider flex items-center space-x-1"
                >
                  <span>{showAllUpcoming ? 'Show Less' : 'View All'}</span>
                  {showAllUpcoming ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              ) : null}
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(showAllUpcoming ? upcomingTours : upcomingTours.slice(0, 6)).map((booking) => {
                  const daysUntil = getDaysUntilTour(booking.tourDate);
                  return (
                    <div 
                      key={booking.id} 
                      className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-5 hover:bg-white hover:border-orange-200/80 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 mb-1 line-clamp-1">{booking.tourName}</h4>
                            <div className="space-y-1.5 text-xs text-slate-600">
                              <div className="flex items-center space-x-1.5">
                                <Calendar className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                <span className="font-medium">{formatDate(booking.tourDate)}</span>
                              </div>
                              {daysUntil !== null && daysUntil >= 0 && (
                                <div className="flex items-center space-x-1.5">
                                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span className={daysUntil <= 7 ? 'text-rose-600 font-bold' : 'text-slate-600 font-medium'}>
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
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            {getPaymentStatusBadge(booking.paymentStatus)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 mt-3">
                        <div className="flex items-center space-x-3 text-xs font-semibold text-slate-600">
                          <div className="flex items-center space-x-1">
                            <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                            <span>${booking.totalPrice}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span>{booking.participants}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewBookingDetails(booking)}
                            className="text-orange-600 hover:text-orange-700 text-xs font-bold flex items-center space-x-1"
                            title="View full booking details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {upcomingTours.length > 6 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-orange-200/80 shadow-xs"
                  >
                    <span>
                      {showAllUpcoming 
                        ? 'Show fewer upcoming tours' 
                        : `View ${upcomingTours.length - 6} more upcoming ${upcomingTours.length - 6 === 1 ? 'tour' : 'tours'}`}
                    </span>
                    {showAllUpcoming ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 mb-10">
          {/* Recent Bookings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{t('dashboard.bookings')}</h3>
              <Link
                to="/tours"
                className="text-orange-600 hover:text-orange-700 text-xs font-bold uppercase tracking-wider flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Book Tour</span>
              </Link>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {localBookings.length > 0 ? (
                  localBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{booking.tourName}</h4>
                        <div className="flex items-center space-x-1">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                          {getPaymentStatusBadge(booking.paymentStatus)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-xs font-medium text-slate-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5 text-orange-500" />
                          <span>{formatDate(booking.tourDate)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                          <span>${booking.totalPrice}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 pt-2 border-t border-slate-200/60">
                        {booking.status === 'completed' &&
                          !reviews.some(review => review.bookingId === booking.id) && (
                            <button
                              onClick={() => handleLeaveReview(booking)}
                              className="text-orange-600 hover:text-orange-700 text-xs font-bold"
                            >
                              Leave Review
                            </button>
                          )}
                        {canCancelBooking(booking) && (
                          <button
                            onClick={() => handleCancelBooking(booking)}
                            className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center space-x-1"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                        {booking.status === 'cancelled' && booking.paymentStatus === 'refunded' && (
                          <span className="text-xs text-emerald-600 font-bold">
                            Refunded
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm mb-4">No bookings yet</p>
                    <Link
                      to="/tours"
                      className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs hover:shadow-md"
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
            className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">{t('dashboard.reviews')}</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.slice(0, 3).map((review: Review) => (
                    <div key={review.id} className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{review.tourName}</h4>
                        <div className="flex items-center space-x-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 text-xs mb-3 line-clamp-2">{review.comment}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <p className="text-xs text-slate-400 font-medium">{review.createdAt?.toLocaleDateString()}</p>
                        <div className="flex space-x-3">
                          <button 
                            onClick={() => {
                              const booking = localBookings.find(b => b.id === review.bookingId);
                              if (booking) handleEditReview(booking, review);
                            }}
                            className="text-orange-600 hover:text-orange-700 text-xs font-bold"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteReview(review)}
                            className="text-rose-600 hover:text-rose-700 text-xs font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-medium">No reviews yet</p>
                    <p className="text-xs text-slate-400 mt-1">Book and complete a tour to leave your first review!</p>
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
            className="mb-10 bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Booking History</h3>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select 
                  value={bookingFilter}
                  onChange={(e) => setBookingFilter(e.target.value as BookingFilter)}
                  className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
                  <div key={booking.id} className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-5 hover:bg-white hover:border-orange-200/80 hover:shadow-xs transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 text-sm">{booking.tourName}</h4>
                      <div className="flex items-center space-x-1">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        {getPaymentStatusBadge(booking.paymentStatus)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-xs font-medium text-slate-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3.5 w-3.5 text-orange-500" />
                        <span>{formatDate(booking.tourDate)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                        <span>${booking.totalPrice}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{booking.participants} {booking.participants === 1 ? 'person' : 'people'}</span>
                      </div>
                    </div>
                    
                    {/* Expandable details and Modal Trigger */}
                    <div className="mt-3 flex items-center space-x-4 pt-3 border-t border-slate-200/60">
                      <button
                        onClick={() => handleViewBookingDetails(booking)}
                        className="text-orange-600 hover:text-orange-700 text-xs font-bold flex items-center space-x-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={() => toggleBookingExpansion(booking.id)}
                        className="text-slate-500 hover:text-slate-700 text-xs font-bold flex items-center space-x-1"
                      >
                        {expandedBooking === booking.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        <span>{expandedBooking === booking.id ? 'Collapse' : 'Quick View'}</span>
                      </button>
                    </div>
                      
                      {expandedBooking === booking.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-4 bg-white rounded-xl border border-slate-200/80 space-y-3"
                        >
                          <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                            <div>
                              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block mb-0.5">Booking Date:</span>
                              <p className="text-slate-800">{formatDate(booking.bookingDate)}</p>
                            </div>
                            <div>
                              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block mb-0.5">Tour Date:</span>
                              <p className="text-slate-800">{formatDate(booking.tourDate)}</p>
                            </div>
                            <div>
                              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block mb-0.5">Participants:</span>
                              <p className="text-slate-800">{booking.participants}</p>
                            </div>
                            <div>
                              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block mb-0.5">Total Price:</span>
                              <p className="text-slate-800">${booking.totalPrice}</p>
                            </div>
                            {booking.specialRequests && (
                              <div className="col-span-2">
                                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block mb-0.5">Special Requests:</span>
                                <p className="text-slate-800 mt-0.5">{booking.specialRequests}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Refund status for cancelled bookings */}
                          {booking.status === 'cancelled' && (
                            <div className="pt-3 border-t border-slate-100">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-700">Refund Status:</span>
                                  <span className={`font-bold ${
                                    booking.paymentStatus === 'refunded' 
                                      ? 'text-emerald-600' 
                                      : booking.paymentStatus === 'paid' || booking.paymentStatus === 'verified'
                                      ? 'text-orange-600'
                                      : 'text-slate-600'
                                  }`}>
                                    {booking.paymentStatus === 'refunded' 
                                      ? 'Refunded' 
                                      : booking.paymentStatus === 'paid' || booking.paymentStatus === 'verified'
                                      ? 'Refund Processing'
                                      : 'No Refund Required'}
                                  </span>
                                </div>
                                {booking.paymentStatus === 'refunded' && (
                                  <p className="text-xs text-slate-500">
                                    Refund of ${booking.totalPrice} has been processed
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Cancel button for eligible bookings */}
                          {canCancelBooking(booking) && (
                            <div className="pt-3 border-t border-slate-100">
                              <button
                                onClick={() => handleCancelBooking(booking)}
                                className="w-full bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
                              >
                                <XCircle className="h-4 w-4" />
                                <span>Cancel Booking</span>
                              </button>
                            </div>
                          )}

                          {/* Refund Request Section */}
                          <div className="pt-3 border-t border-slate-100">
                            {(() => {
                              const refundRequest = getRefundRequestForBooking(booking.id);
                              
                              if (refundRequest) {
                                return (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-700">Refund Request:</span>
                                      {getRefundStatusBadge(refundRequest)}
                                    </div>
                                    {refundRequest.reason && (
                                      <div className="bg-slate-50 p-2.5 rounded-xl text-xs">
                                        <p className="text-slate-600"><strong>Your Reason:</strong> {refundRequest.reason}</p>
                                      </div>
                                    )}
                                    {(refundRequest.adminNotes || refundRequest.status === 'processed' || refundRequest.status === 'approved' || refundRequest.status === 'rejected') && (
                                      <div className={`p-3 rounded-xl text-xs ${
                                        refundRequest.status === 'rejected' 
                                          ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                          : refundRequest.status === 'processed'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : refundRequest.status === 'approved'
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                                      }`}>
                                        <p className="font-bold mb-1">Admin Response:</p>
                                        {refundRequest.adminNotes ? (
                                          <p className="italic">&ldquo;{refundRequest.adminNotes}&rdquo;</p>
                                        ) : (
                                          <p className="italic text-slate-600">
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
                                  </div>
                                );
                              } else if (canRequestRefund(booking)) {
                                return (
                                  <button
                                    onClick={() => {
                                      setSelectedBookingForRefund(booking);
                                      setShowRefundModal(true);
                                    }}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                    <span>Request Refund</span>
                                  </button>
                                );
                              } else if (booking.paymentStatus === 'refunded') {
                                return (
                                  <div className="flex items-center justify-center space-x-2 text-xs font-bold text-emerald-600">
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
                            <div className="pt-3 border-t border-slate-100">
                              {reviews.some(review => review.bookingId === booking.id) ? (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-emerald-600">Review Submitted</span>
                                  <button
                                    onClick={() => {
                                      const review = reviews.find(r => r.bookingId === booking.id);
                                      if (review) handleEditReview(booking, review);
                                    }}
                                    className="text-orange-600 hover:text-orange-700 text-xs font-bold"
                                  >
                                    Edit Review
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleLeaveReview(booking)}
                                  className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                                >
                                  Leave Review
                                </button>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                  </div>
                ))}
              </div>
              
              {filteredBookings.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-medium">
                    {bookingFilter === 'all' 
                      ? 'No bookings found' 
                      : `No ${bookingFilter} bookings`}
                  </p>
                  {bookingFilter !== 'all' && (
                    <button
                      onClick={() => setBookingFilter('all')}
                      className="mt-2 text-orange-600 hover:text-orange-700 text-xs font-bold uppercase tracking-wider"
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
          className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/tours"
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs hover:shadow-md text-center"
            >
              Browse Tours
            </Link>
            <Link
              to="/festivals"
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs hover:shadow-md text-center"
            >
              View Festivals
            </Link>
            <Link
              to="/favorites"
              className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all text-center flex items-center justify-center space-x-2"
            >
              <Heart className="h-4 w-4 fill-orange-600 text-orange-600" />
              <span>My Favorites</span>
            </Link>
            {completedBookingsWithoutReviews.length > 0 && (
              <button
                onClick={() => handleLeaveReview(completedBookingsWithoutReviews[0])}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs"
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
            className="mt-6 bg-orange-50 border border-orange-200/80 rounded-2xl p-5"
          >
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-orange-600 mr-3 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-orange-900">
                  You have {completedBookingsWithoutReviews.length} completed tour{completedBookingsWithoutReviews.length > 1 ? 's' : ''} waiting for review
                </h4>
                <p className="text-xs text-orange-800 mt-1">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Request Refund</h3>
                {selectedBookingForRefund.status !== 'cancelled' && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    Note: Your booking will be cancelled once the refund is approved
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedBookingForRefund(null);
                  setRefundReason('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
                disabled={isSubmittingRefund}
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-xs">
              <p className="text-slate-700">
                <strong className="text-slate-900">Tour:</strong> {selectedBookingForRefund.tourName}
              </p>
              <p className="text-slate-700">
                <strong className="text-slate-900">Amount:</strong> ${selectedBookingForRefund.totalPrice}
              </p>
              <p className="text-slate-700">
                <strong className="text-slate-900">Booking Date:</strong> {formatDate(selectedBookingForRefund.bookingDate)}
              </p>
              {selectedBookingForRefund.status !== 'cancelled' && selectedBookingForRefund.tourDate && (
                <p className="text-slate-700">
                  <strong className="text-slate-900">Tour Date:</strong> {formatDate(selectedBookingForRefund.tourDate)}
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Reason for Refund Request <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="Please provide a detailed reason for your refund request..."
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
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                disabled={isSubmittingRefund}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRefund}
                disabled={isSubmittingRefund || !refundReason.trim()}
                className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
      {/* Tourist Booking Details Modal */}
      {selectedBookingForDetails && (
        <TouristBookingDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBookingForDetails(null);
          }}
          booking={selectedBookingForDetails}
          refundRequest={getRefundRequestForBooking(selectedBookingForDetails.id)}
          onCancelBooking={handleCancelBooking}
          onRequestRefund={(booking) => {
            setSelectedBookingForRefund(booking);
            setShowRefundModal(true);
          }}
          onLeaveReview={handleLeaveReview}
          canCancel={canCancelBooking(selectedBookingForDetails)}
          canRefund={canRequestRefund(selectedBookingForDetails)}
          canReview={selectedBookingForDetails.status === 'completed' && canReviewBooking(selectedBookingForDetails)}
          isReviewed={reviews.some(r => r.bookingId === selectedBookingForDetails?.id)}
        />
      )}
    </div>
  );
};