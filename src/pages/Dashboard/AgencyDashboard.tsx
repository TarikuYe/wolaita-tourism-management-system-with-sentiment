import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import {
  Package, Users, DollarSign, Star, Plus, 
  Eye, Edit, Trash2, Calendar, TrendingUp, AlertTriangle,
  CheckCircle, MessageSquare, ThumbsUp, MoreVertical, Info, Search,
  Clock, Home, BookOpen, BarChart3, LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { DashboardLayout } from '../../components/Layout/DashboardLayout';
import { useBookings, useTours, useReviews, markBookingAsCompleted } from '../../hooks/useFirestore';
import { TourModal } from '../../components/Modals/TourModal';
import { AnalyticsDashboard } from '../../components/Analytics/AnalyticsDashboard';
import { deleteDoc, doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { BookingDetailsModal } from '../../components/Modals/BookingDetailsModal';
import { UpdateBookingModal } from '../../components/Modals/UpdateBookingModal';
import { ConfirmModal, ConfirmModalConfig } from '../../components/Modals/ConfirmModal';
import { Booking } from '../../types/booking';
import { Tour } from '../../types/index';
import { AgencySentimentAnalytics } from '../../components/Analytics/AgencySentimentAnalytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Review interface
interface Review {
  id?: string;
  bookingId: string;
  touristId: string;
  agencyId: string;
  tourId: string;
  rating: number;
  comment?: string;
  touristName?: string;
  createdAt?: any;
  sentimentLabel?: string;
  sentimentAnalysis?: {
    sentiment?: string;
  };
}

export const AgencyDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [showTourModal, setShowTourModal] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [showUpdateBookingModal, setShowUpdateBookingModal] = useState(false);
  const [selectedBookingForUpdate, setSelectedBookingForUpdate] = useState<Booking | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [tourModalMode, setTourModalMode] = useState<'create' | 'edit'>('create');
  const [localBookings, setLocalBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [confirmModalConfig, setConfirmModalConfig] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Data hooks
  const { data: tours, loading: toursLoading, error: toursError } = useTours(currentUser?.id);
  const { data: bookings, loading: bookingsLoading } = useBookings(currentUser?.id || '', 'agency');
  const { data: reviews, loading: reviewsLoading } = useReviews(currentUser?.id || '', 'agency');

  // Filter bookings based on search and status
  const filteredBookings = useMemo(() => {
    return localBookings
      .filter(booking => 
        (filterStatus === 'all' || booking.status === filterStatus) &&
        (booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         booking.tourName?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => (b.tourDate?.getTime() || 0) - (a.tourDate?.getTime() || 0));
  }, [localBookings, searchTerm, filterStatus]);

  // Initialize local bookings
  useEffect(() => {
    if (bookings && !bookingsLoading) {
      setLocalBookings(bookings);
    }
  }, [bookings, bookingsLoading]);

  // Real-time updates for all bookings with improved error handling
  useEffect(() => {
    if (!currentUser?.id) return;

    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('agencyId', '==', currentUser.id));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedBookings: Booking[] = [];
      snapshot.forEach((doc) => {
        try {
          const data = doc.data();
          const booking: Booking = {
            id: doc.id,
            touristId: data.touristId || '',
            agencyId: data.agencyId || '',
            tourId: data.tourId || '',
            tourName: data.tourName || 'Unknown Tour',
            customerName: data.customerName || 'Unknown Customer',
            tourDate: data.tourDate?.toDate?.() || null,
            bookingDate: data.bookingDate?.toDate?.() || new Date(),
            status: data.status || 'pending',
            paymentStatus: data.paymentStatus || 'pending',
            totalPrice: data.totalPrice || 0,
            participants: data.participants || 1,
            specialRequests: data.specialRequests || '',
            createdAt: data.createdAt?.toDate?.() || new Date(),
            // Default values for Tour interface compatibility
            price: 0,
            rating: 0,
            available: false,
            image: '',
            category: '',
            difficulty: '',
            maxParticipants: 0,
            reviewsCount: 0
          };
          updatedBookings.push(booking);
        } catch (error) {
          console.error('Error processing booking document:', error);
        }
      });
      setLocalBookings(updatedBookings);
    }, (error) => {
      console.error('Error in bookings listener:', error);
      toast.error('Failed to load bookings data');
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  // Calculate stats with improved formatting
  const stats = useMemo(() => [
    { 
      label: 'Active Tours', 
      value: tours.filter(t => t.available !== false).length.toString(), 
      icon: Package, 
      color: 'bg-blue-500' 
    },
    { 
      label: 'Total Bookings', 
      value: localBookings.length.toString(), 
      icon: Users, 
      color: 'bg-green-500' 
    },
    { 
      label: 'Total Revenue', 
      value: `$${localBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: DollarSign, 
      color: 'bg-amber-500' 
    },
    { 
      label: 'Average Rating', 
      value: reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) 
        : '0.0', 
      icon: Star, 
      color: 'bg-purple-500' 
    },
    { 
      label: 'Customer Sentiment', 
      value: reviews.length > 0 
        ? `${Math.round((reviews.filter(r => 
            r.sentimentLabel === 'positive' || r.sentimentAnalysis?.sentiment === 'positive'
          ).length / reviews.length) * 100)}%` 
        : 'N/A', 
      icon: MessageSquare, 
      color: 'bg-indigo-500' 
    }
  ], [tours, localBookings, reviews]);

  // Get completed tours with their reviews and ratings
  const completedToursWithReviews = useMemo(() => {
    // Get all completed bookings
    const completedBookings = localBookings.filter(booking => booking.status === 'completed');
    
    // Group by tour and aggregate reviews
    const tourMap = new Map();
    
    completedBookings.forEach(booking => {
      if (!tourMap.has(booking.tourId)) {
        tourMap.set(booking.tourId, {
          tourId: booking.tourId,
          tourName: booking.tourName,
          bookings: [],
          reviews: [],
          averageRating: 0
        });
      }
      
      const tourData = tourMap.get(booking.tourId);
      tourData.bookings.push(booking);
      
      // Find review for this booking
      const review = reviews.find(r => r.bookingId === booking.id);
      if (review) {
        tourData.reviews.push(review);
      }
    });
    
    // Calculate average ratings
    for (const [tourId, tourData] of tourMap) {
      if (tourData.reviews.length > 0) {
        const totalRating = tourData.reviews.reduce((sum: any, review: { rating: any; }) => sum + review.rating, 0);
        tourData.averageRating = totalRating / tourData.reviews.length;
      }
    }
    
    return Array.from(tourMap.values());
  }, [localBookings, reviews]);

  // Calculate analytics data with proper error handling
  const analyticsData = useMemo(() => {
    try {
      const ongoingBookingsCount = localBookings.filter(b => 
        b.status !== 'completed' && b.status !== 'cancelled'
      ).length;
      
      const completedBookingsCount = localBookings.filter(b => 
        b.status === 'completed'
      ).length;

      // Fixed current month revenue calculation - using bookingDate (when booking was made)
      const currentMonthRevenue = localBookings
        .filter(b => {
          try {
            // Use bookingDate if available, otherwise fall back to tourDate
            const dateToCheck = b.bookingDate || b.tourDate;
            if (!dateToCheck) return false;
            
            const bookingDate = dateToCheck instanceof Date 
              ? dateToCheck 
              : new Date(dateToCheck);
            const now = new Date();
            
            return b.status === 'completed' && 
              bookingDate.getMonth() === now.getMonth() &&
              bookingDate.getFullYear() === now.getFullYear();
          } catch (error) {
            console.warn('Error processing booking date:', error);
            return false;
          }
        })
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      // Fixed destination popularity with null checks
      const destinationCounts: Record<string, number> = {};
      localBookings.forEach(b => {
        try {
          const tour = tours.find(t => t.id === b.tourId);
          if (tour?.destination) {
            destinationCounts[tour.destination] = (destinationCounts[tour.destination] || 0) + 1;
          }
        } catch (error) {
          console.warn('Error processing tour destination:', error);
        }
      });

      // Convert to the format expected by AnalyticsDashboard - [string, number][]
      const sortedDestinations = Object.entries(destinationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Fixed monthly bookings with proper date handling
      const monthlyBookings: Record<string, number> = {};
      localBookings.forEach(b => {
        try {
          if (b.tourDate) {
            const monthYear = `${b.tourDate.getFullYear()}-${String(b.tourDate.getMonth() + 1).padStart(2, '0')}`;
            monthlyBookings[monthYear] = (monthlyBookings[monthYear] || 0) + 1;
          }
        } catch (error) {
          console.warn('Error processing monthly booking:', error);
        }
      });

      // Create complete monthly data for the last 12 months
      const monthlyBookingData = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyBookingData.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          bookings: monthlyBookings[monthYear] || 0
        });
      }

      // Fixed average rating calculation
      const validReviews = reviews.filter(r => r.rating && r.rating > 0);
      const averageRating = validReviews.length > 0 
        ? parseFloat((validReviews.reduce((sum, r) => sum + r.rating, 0) / validReviews.length).toFixed(1))
        : 0;

      return {
        totalBookings: localBookings.length,
        ongoingBookingsCount,
        completedBookingsCount,
        currentMonthRevenue,
        topDestinations: sortedDestinations, // This is now [string, number][] format
        monthlyBookings: monthlyBookingData,
        averageRating,
        totalRevenue: localBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
        cancelledBookingsCount: localBookings.filter(b => b.status === 'cancelled').length
      };
    } catch (error) {
      console.error('Error calculating analytics data:', error);
      // Return safe default values
      return {
        totalBookings: 0,
        ongoingBookingsCount: 0,
        completedBookingsCount: 0,
        currentMonthRevenue: 0,
        topDestinations: [],
        monthlyBookings: [],
        averageRating: 0,
        totalRevenue: 0,
        cancelledBookingsCount: 0
      };
    }
  }, [localBookings, tours, reviews]);

  // Fixed chart data with proper data mapping
  const chartData = useMemo(() => {
    const monthlyData = Array(12).fill(0);
    
    localBookings.forEach(booking => {
      try {
        if (booking.bookingDate) {
          const month = booking.bookingDate.getMonth();
          monthlyData[month] = (monthlyData[month] || 0) + 1;
        }
      } catch (error) {
        console.warn('Error processing booking for chart:', error);
      }
    });

    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        label: 'Bookings',
        data: monthlyData,
        backgroundColor: '#fbbf24',
        borderColor: '#f59e0b',
        borderWidth: 2,
        borderRadius: 4,
      }],
    };
  }, [localBookings]);

  // Fixed pie chart data with error handling
  const pieData = useMemo(() => {
    const tourBookings: Record<string, number> = {};
    
    tours.forEach(tour => {
      tourBookings[tour.id] = localBookings.filter(b => b.tourId === tour.id).length;
    });

    // Get top 5 tours by bookings
    const topTours = Object.entries(tourBookings)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      labels: topTours.map(([tourId]) => {
        const tour = tours.find(t => t.id === tourId);
        return tour?.title || 'Unknown Tour';
      }),
      datasets: [{
        data: topTours.map(([, count]) => count),
        backgroundColor: ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'],
        borderColor: ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'],
        borderWidth: 2,
      }],
    };
  }, [tours, localBookings]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200/80';
      default: return 'bg-slate-50 text-slate-700 border-slate-200/80';
    }
  };

  const handleCreateTour = () => {
    setSelectedTour(null);
    setTourModalMode('create');
    setShowTourModal(true);
  };

  const handleEditTour = (tour: Tour) => {
    setSelectedTour(tour);
    setTourModalMode('edit');
    setShowTourModal(true);
  };

  const handleUpdateBooking = (booking: Booking) => {
    setSelectedBookingForUpdate(booking);
    setShowUpdateBookingModal(true);
  };

  const handleViewBookingDetails = (booking: Booking) => {
    setSelectedBookingForDetails(booking);
    setShowBookingDetailsModal(true);
  };

  const handleDeleteTour = (tourId: string, tourTitle: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Tour Package',
      message: `Are you sure you want to delete "${tourTitle}"? This will permanently remove the tour listing from the system.`,
      type: 'danger',
      confirmText: 'Delete Tour',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'tours', tourId));
          toast.success('Tour deleted successfully', { id: `delete-tour-${tourId}` });
        } catch (error) {
          console.error('Error deleting tour:', error);
          toast.error('Failed to delete tour', { id: `delete-tour-err-${tourId}` });
        }
      }
    });
  };

  const handleToggleAvailability = async (tour: Tour) => {
    try {
      await updateDoc(doc(db, 'tours', tour.id), {
        available: !tour.available
      });
      toast.success(`Tour ${tour.available ? 'disabled' : 'enabled'} successfully`, { id: `toggle-tour-${tour.id}` });
    } catch (error) {
      console.error('Error updating tour availability:', error);
      toast.error('Failed to update tour availability', { id: `toggle-tour-err-${tour.id}` });
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: "confirmed" | "pending" | "completed" | "cancelled") => {
    try {
      // Update local state immediately for better UX
      setLocalBookings(prev => prev.map(booking => 
        booking.id === id ? { ...booking, status } : booking
      ));
      
      // Then update Firestore
      await updateDoc(doc(db, 'bookings', id), { status });
      toast.success('Booking status updated', { id: `update-status-${id}` });
    } catch (err) {
      // Revert local state if there's an error
      setLocalBookings(prev => prev.map(booking => 
        booking.id === id ? { ...booking, status: booking.status } : booking
      ));
      toast.error('Failed to update status', { id: `update-status-err-${id}` });
    }
  };

  const handleCompleteBooking = async (id: string) => {
    try {
      // Update local state immediately
      setLocalBookings(prev => prev.map(booking => 
        booking.id === id ? { ...booking, status: 'completed' } : booking
      ));
      
      // Then update Firestore - markBookingAsCompleted handles toast notification cleanly
      await markBookingAsCompleted(id);
    } catch (err) {
      // Revert local state if there's an error
      setLocalBookings(prev => prev.map(booking => 
        booking.id === id ? { ...booking, status: 'confirmed' } : booking
      ));
    }
  };

  const handleDeleteBooking = (id: string) => {
    if (!id) {
      toast.error('Invalid booking ID', { id: 'invalid-booking-id' });
      return;
    }

    const bookingToDelete = localBookings.find(b => b.id === id);
    const tourName = bookingToDelete?.tourName || 'this tour';
    const customerName = bookingToDelete?.customerName ? ` (${bookingToDelete.customerName})` : '';

    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Booking',
      message: `Are you sure you want to delete booking for ${tourName}${customerName}? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Booking',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'bookings', id));
          setLocalBookings(prev => prev.filter(booking => booking.id !== id));
          toast.success('Booking deleted successfully', { id: `delete-booking-${id}` });
        } catch (err: any) {
          console.error('Error deleting booking:', err);
          if (err.code === 'permission-denied') {
            toast.error('You do not have permission to delete this booking', { id: `delete-perm-err-${id}` });
          } else {
            toast.error('Failed to delete booking. Please try again.', { id: `delete-err-${id}` });
          }
        }
      }
    });
  };

  // Actions Menu Component for Bookings - Fixed with React Portal & Fixed Positioning
  const ActionsMenu: React.FC<{ booking: Booking }> = ({ booking }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; right: number; showAbove: boolean } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const showAbove = spaceBelow < 220 && rect.top > 220;

        setCoords({
          top: showAbove ? rect.top - 4 : rect.bottom + 4,
          right: window.innerWidth - rect.right,
          showAbove,
        });
      }
    };

    const handleMenuToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isOpen) {
        updatePosition();
      }
      setIsOpen((prev) => !prev);
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          buttonRef.current && !buttonRef.current.contains(target) &&
          menuRef.current && !menuRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };

      const handleScrollOrResize = () => {
        if (isOpen) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }, [isOpen]);

    const handleAction = (action: () => void) => {
      action();
      setIsOpen(false);
    };

    return (
      <div className="relative inline-block actions-menu">
        <button
          ref={buttonRef}
          onClick={handleMenuToggle}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          title="Actions"
        >
          <MoreVertical size={18} />
        </button>

        {isOpen && coords && createPortal(
          <AnimatePresence>
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: coords.showAbove ? 10 : -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: coords.showAbove ? 10 : -10 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: coords.showAbove ? undefined : `${coords.top}px`,
                bottom: coords.showAbove ? `${window.innerHeight - coords.top}px` : undefined,
                right: `${coords.right}px`,
                zIndex: 99999,
              }}
              className="w-48 bg-white rounded-md shadow-2xl border border-gray-200 py-1 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {booking.status === 'pending' && (
                <button
                  onClick={() => handleAction(() => handleUpdateBookingStatus(booking.id, 'confirmed'))}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 flex items-center transition-colors"
                >
                  <CheckCircle size={16} className="mr-2 text-green-600" /> Confirm
                </button>
              )}
              {booking.status === 'confirmed' && (
                <button
                  onClick={() => handleAction(() => handleCompleteBooking(booking.id))}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 flex items-center transition-colors"
                >
                  <CheckCircle size={16} className="mr-2 text-blue-600" /> Mark as Completed
                </button>
              )}
              <button
                onClick={() => handleAction(() => handleViewBookingDetails(booking))}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 flex items-center transition-colors"
              >
                <Eye size={16} className="mr-2 text-amber-600" /> View Details
              </button>
              <button
                onClick={() => handleAction(() => handleUpdateBooking(booking))}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 flex items-center transition-colors"
              >
                <Edit size={16} className="mr-2 text-indigo-600" /> Update Booking
              </button>
              <button
                onClick={() => {
                  handleAction(() => handleDeleteBooking(booking.id));
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
              >
                <Trash2 size={16} className="mr-2" /> Delete Booking
              </button>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      </div>
    );
  };

  // Validate user permissions
  if (currentUser?.role !== 'agency') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only tour agencies can access this dashboard.</p>
        </div>
      </div>
    );
  }

  if (toursLoading || bookingsLoading || reviewsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (toursError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{toursError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Menu items for sidebar
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, onClick: () => setActiveTab('overview'), active: activeTab === 'overview' },
    { id: 'tours', label: 'Manage Tours', icon: Package, onClick: () => setActiveTab('tours'), active: activeTab === 'tours' },
    { id: 'bookings', label: 'Bookings', icon: BookOpen, onClick: () => setActiveTab('bookings'), active: activeTab === 'bookings' },
    { id: 'completed', label: 'Completed Tours', icon: CheckCircle, onClick: () => setActiveTab('completed'), active: activeTab === 'completed' },
    { id: 'sentiment', label: 'Customer Sentiment', icon: MessageSquare, onClick: () => setActiveTab('sentiment'), active: activeTab === 'sentiment' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, onClick: () => setActiveTab('analytics'), active: activeTab === 'analytics' }
  ];

  return (
    <DashboardLayout
      menuItems={menuItems}
      title="Agency Dashboard"
      userRole="agency"
    >
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('dashboard.welcome')}, {currentUser?.name}!
                </h1>
                <p className="text-gray-600 mt-2">
                  {t('dashboard.agency.title')}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-xs hover:shadow-md border border-slate-100 p-6 transition-all"
                  >
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 p-3.5 rounded-2xl ${stat.color} shadow-xs`}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-2xl font-extrabold text-slate-900 mt-1">{stat.value}</p>
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
                  className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Recent Bookings</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {localBookings.length > 0 ? (
                        localBookings.slice(0, 3).map((booking) => (
                          <div key={booking.id} className="border border-slate-200/70 rounded-2xl p-4 bg-slate-50/40 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-extrabold text-slate-900 text-sm">{booking.customerName || 'Customer'}</h4>
                              <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full border ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-slate-600 mb-2">{booking.tourName}</p>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>
                                {booking.tourDate
                                  ? booking.tourDate.toLocaleDateString()
                                  : 'TBD'}
                              </span>
                              <span className="font-bold text-slate-900">${booking.totalPrice}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500 font-medium text-sm">No bookings yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Quick Actions & Charts */}
                <div className="space-y-8">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6"
                  >
                    <h3 className="text-base font-extrabold text-slate-900 mb-4 tracking-tight">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={handleCreateTour}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 hover:shadow-lg flex items-center justify-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add New Tour</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('bookings')}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 hover:shadow-lg flex items-center justify-center space-x-2"
                      >
                        <Calendar className="h-4 w-4" />
                        <span>View Bookings</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('completed')}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 hover:shadow-lg flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>View Completed Tours</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('analytics')}
                        className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white px-4 py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-500/20 hover:shadow-lg flex items-center justify-center space-x-2"
                      >
                        <TrendingUp className="h-4 w-4" />
                        <span>View Analytics</span>
                      </button>
                    </div>
                  </motion.div>

                  {/* Mini Chart */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6"
                  >
                    <h3 className="text-base font-extrabold text-slate-900 mb-4 tracking-tight">Monthly Bookings</h3>
                    <div className="h-64">
                      <Bar data={chartData} options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          }
                        }
                      }} />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tours' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Manage Tours</h3>
                  <p className="text-xs text-slate-500 font-medium">Create, modify, and track your active tour packages</p>
                </div>
                <button
                  onClick={handleCreateTour}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 hover:shadow-lg transition-all flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Tour</span>
                </button>
              </div>
              <div className="p-6">
                {tours.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tours.map((tour) => (
                      <div key={tour.id} className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all bg-white flex flex-col">
                        <div
                          className="h-40 bg-cover bg-center relative"
                          style={{ backgroundImage: `url(${tour.images?.[0] || tour.image || 'https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'})` }}
                        >
                          <div className="absolute top-3 right-3">
                            <span className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-xs backdrop-blur-xs border ${
                              tour.available ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-rose-500/90 text-white border-rose-400'
                            }`}>
                              {tour.available ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-base mb-2 line-clamp-1">{tour.title}</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <div><span className="text-slate-400 font-bold uppercase text-[10px]">Price:</span> <span className="font-bold text-slate-900">${tour.price}</span></div>
                              <div><span className="text-slate-400 font-bold uppercase text-[10px]">Rating:</span> <span className="font-bold text-slate-900">{tour.rating || 'N/A'}</span></div>
                              <div><span className="text-slate-400 font-bold uppercase text-[10px]">Duration:</span> <span className="font-bold text-slate-900">{tour.duration}d</span></div>
                              <div><span className="text-slate-400 font-bold uppercase text-[10px]">Max:</span> <span className="font-bold text-slate-900">{tour.maxParticipants}</span></div>
                            </div>
                          </div>
                          <div className="flex space-x-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => handleEditTour(tour)}
                              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleToggleAvailability(tour)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                tour.available
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200/80'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200/80'
                              }`}
                            >
                              {tour.available ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleDeleteTour(tour.id, tour.title)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/70 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-extrabold text-slate-900 mb-1">No tours yet</h3>
                    <p className="text-slate-500 text-xs mb-6">Create your first tour to start accepting bookings</p>
                    <button
                      onClick={handleCreateTour}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 hover:shadow-lg transition-all flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Your First Tour</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'bookings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manage Bookings</h1>
                  <p className="text-xs text-slate-500 font-medium">Review customer reservations and process requests</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search bookings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all shadow-xs"
                    />
                  </div>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="py-2.5 px-4 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all shadow-xs cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="bg-white shadow-xs rounded-2xl overflow-hidden border border-slate-200/80">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/80 border-b border-slate-200/80">
                      <tr>
                        <th className="p-4 text-left text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Tour</th>
                        <th className="p-4 text-left text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Customer</th>
                        <th className="p-4 text-left text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="p-4 text-left text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Participants</th>
                        <th className="p-4 text-left text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="p-4 text-right text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="p-4 text-right text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      <AnimatePresence>
                        {filteredBookings.length > 0 ? (
                          filteredBookings.map((booking) => (
                            <motion.tr
                              key={booking.id}
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="hover:bg-slate-50/60 transition-colors"
                            >
                              <td className="p-4 whitespace-nowrap text-xs font-bold text-slate-900">
                                {booking.tourName}
                              </td>
                              <td className="p-4 whitespace-nowrap text-xs font-medium text-slate-600">
                                {booking.customerName || 'Customer'}
                              </td>
                              <td className="p-4 whitespace-nowrap text-xs font-medium text-slate-500">
                                {booking.tourDate ? booking.tourDate.toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="p-4 whitespace-nowrap text-xs font-bold text-slate-800">
                                {booking.participants}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full border ${getStatusColor(booking.status)}`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap text-xs font-extrabold text-slate-900 text-right">
                                ${booking.totalPrice}
                              </td>
                              <td className="p-4 whitespace-nowrap text-right relative">
                                <ActionsMenu booking={booking} />
                              </td>
                            </motion.tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-12">
                              <Info size={32} className="mx-auto text-slate-300" />
                              <p className="mt-3 text-slate-700 font-extrabold text-sm">No bookings found.</p>
                              <p className="text-xs text-slate-500 font-medium">Try adjusting your search or status filters.</p>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'completed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-lg shadow"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Completed Tours with Reviews</h3>
              </div>
              <div className="p-6">
                {completedToursWithReviews.length > 0 ? (
                  <div className="space-y-6">
                    {completedToursWithReviews.map((tour) => (
                      <div key={tour.tourId} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-xl font-medium text-gray-900">{tour.tourName}</h4>
                          <div className="flex items-center">
                            <Star className="h-5 w-5 text-yellow-400" />
                            <span className="ml-1 text-gray-700">{tour.averageRating.toFixed(1)}</span>
                            <span className="mx-2 text-gray-400">•</span>
                            <span className="text-gray-500">{tour.reviews.length} reviews</span>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-medium text-gray-900 mb-3">Recent Reviews</h5>
                            <div className="space-y-4">
                              {tour.reviews.slice(0, 3).map((review: Review, index: number) => {
                                // Safe date handling
                                let reviewDate;
                                try {
                                  // Check if it's a Firestore Timestamp
                                  if (review.createdAt && typeof review.createdAt.toDate === 'function') {
                                    reviewDate = review.createdAt.toDate();
                                  } 
                                  // Check if it's already a Date object
                                  else if (review.createdAt instanceof Date) {
                                    reviewDate = review.createdAt;
                                  }
                                  // Check if it's a string that can be converted to Date
                                  else if (typeof review.createdAt === 'string') {
                                    reviewDate = new Date(review.createdAt);
                                  }
                                  // Check if it's a number (timestamp)
                                  else if (typeof review.createdAt === 'number') {
                                    reviewDate = new Date(review.createdAt);
                                  }
                                } catch (error) {
                                  console.error('Error parsing review date:', error);
                                  reviewDate = null;
                                }

                                return (
                                  <div key={index} className="border-l-4 border-amber-500 pl-4 py-2">
                                    <div className="flex items-center mb-1">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                        />
                                      ))}
                                    </div>
                                    <p className="text-gray-700 text-sm">{review.comment || 'No comment provided'}</p>
                                    <p className="text-gray-500 text-xs mt-1">
                                      By {review.touristName || 'Anonymous'} •{' '}
                                      {reviewDate ? reviewDate.toLocaleDateString() : 'Date unavailable'}
                                    </p>
                                  </div>
                                );
                              })}
                              {tour.reviews.length === 0 && (
                                <p className="text-gray-500 text-sm">No reviews yet for this tour.</p>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-gray-900 mb-3">Booking Statistics</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Bookings:</span>
                                <span className="font-medium">{tour.bookings.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Revenue:</span>
                                <span className="font-medium">
                                  ${tour.bookings.reduce((sum: any, b: { totalPrice: any; }) => sum + (b.totalPrice || 0), 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Average Rating:</span>
                                <span className="font-medium">{tour.averageRating.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No completed tours yet</h3>
                    <p className="text-gray-500">Completed tours with reviews will appear here</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'sentiment' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <AgencySentimentAnalytics 
                reviews={reviews}
                tours={tours}
              />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <AnalyticsDashboard
                totalBookings={analyticsData.totalBookings}
                bookings={localBookings}
                tours={tours}
                reviews={reviews}
                currentMonthRevenue={analyticsData.currentMonthRevenue}
                topDestinations={analyticsData.topDestinations} // This is now [string, number][] format
                monthlyBookings={analyticsData.monthlyBookings}
                averageRating={analyticsData.averageRating}
                ongoingBookingsCount={analyticsData.ongoingBookingsCount}
                completedBookingsCount={analyticsData.completedBookingsCount}
              />
            </motion.div>
          )}
        </AnimatePresence>

      {/* Modals */}
      <TourModal
        isOpen={showTourModal}
        onClose={() => {
          setShowTourModal(false);
          setSelectedTour(null);
        }}
        tour={selectedTour}
        mode={tourModalMode}
      />

      <BookingDetailsModal
        isOpen={showBookingDetailsModal}
        onClose={() => {
          setShowBookingDetailsModal(false);
          setSelectedBookingForDetails(null);
        }}
        booking={selectedBookingForDetails}
      />

      <UpdateBookingModal
        isOpen={showUpdateBookingModal}
        onClose={() => {
          setShowUpdateBookingModal(false);
          setSelectedBookingForUpdate(null);
        }}
        booking={selectedBookingForUpdate}
      />

      <ConfirmModal
        {...confirmModalConfig}
        onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
      </div>
    </DashboardLayout>
  );
};