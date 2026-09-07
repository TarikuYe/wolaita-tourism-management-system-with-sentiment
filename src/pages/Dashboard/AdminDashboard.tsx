import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Building, Package, TrendingUp, AlertTriangle, CheckCircle, XCircle, 
  MessageSquare, BarChart3, CreditCard, Settings, Shield, FileText, Bell,
  Star, Edit, Delete, User, Check, Mail, Plus, Eye, EyeOff, Trash2,
  LayoutDashboard, RefreshCw, ArrowUpRight, ArrowDownRight, ShieldCheck, Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../components/Layout/DashboardLayout';

import { 
  collection, onSnapshot, query, orderBy, doc, setDoc, updateDoc, where, getDoc,
  limit, getDocs, deleteDoc, serverTimestamp, addDoc
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';

import AdminDashboardAnalytics from '../../components/Analytics/AdminDashboardAnalytics';
import { ReviewManagement } from '../../components/Admin/ReviewManagement';
import { SentimentAnalytics } from '../../components/Analytics/SentimentAnalytics';
import { RefundManagement } from '../../components/Admin/RefundManagement';
import toast from 'react-hot-toast';
import { ConfirmModal, ConfirmModalConfig } from '../../components/Modals/ConfirmModal';

interface Review {
  id: string;
  touristName: string;
  touristId: string;
  tourName: string;
  tourId: string;
  rating: number;
  comment: string;
  createdAt: any;
  createdAtMs?: number;
  verified: boolean;
  agencyId: string;
  bookingId: string;
  agencyName?: string;
}

interface Notification {
  id: string;
  type: 'access' | 'security' | 'system' | 'user' | 'booking' | 'review';
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  createdAtMs?: number;
  userId?: string;
  userEmail?: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
  adminName?: string;
  adminEmail?: string;
}

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '12m' | 'all'>('30d');
  const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const [users, setUsers] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  const [resetUserEmail, setResetUserEmail] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [changePasswordUser, setChangePasswordUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserType, setNewUserType] = useState<'cashier' | 'agency' | ''>('');
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: 'TempPassword123!',
    phone: '',
    companyName: '',
    address: '',
    description: ''
  });
  const [userModalStep, setUserModalStep] = useState(1);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [payments, setPayments] = useState<any[]>([]);
  const [userFilter, setUserFilter] = useState({ role: '', status: '' });
  const [tourFilter, setTourFilter] = useState({ status: '' });
  const [bookingFilter, setBookingFilter] = useState({ status: '' });
  const [systemSettings, setSystemSettings] = useState({
    paymentGateway: 'stripe',
    currency: 'ETB',
    notificationLevel: 'high'
  });

  const notificationRef = useRef<HTMLDivElement>(null);
  const adminAccessLogged = useRef(false);

  // Notification functions
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(n => 
          updateDoc(doc(db, 'notifications', n.id), { read: true })
        )
      );
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const logAdminAccess = async () => {
    try {
      if (!currentUser) return;
      await addDoc(collection(db, 'notifications'), {
        type: 'access',
        title: 'Admin Access Granted',
        message: `Admin ${currentUser.name || currentUser.email} accessed dashboard`,
        read: false,
        createdAt: serverTimestamp(),
        userId: currentUser.id,
        userEmail: currentUser.email,
        priority: 'low',
        adminName: currentUser.name,
        adminEmail: currentUser.email
      });
    } catch (error) {
      console.error('Error logging admin access:', error);
    }
  };

  const createSystemNotification = async (
    type: Notification['type'],
    title: string,
    message: string,
    priority: Notification['priority'] = 'medium',
    userId?: string,
    userEmail?: string
  ) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        type,
        title,
        message,
        read: false,
        createdAt: serverTimestamp(),
        priority,
        userId,
        userEmail,
        adminName: currentUser?.name,
        adminEmail: currentUser?.email
      });
    } catch (error) {
      console.error('Error creating system notification:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Time range calculation & cutoffs
  const getCutoffMs = (range: '7d' | '30d' | '12m' | 'all') => {
    const now = Date.now();
    let days = 30;
    if (range === '7d') days = 7;
    if (range === '30d') days = 30;
    if (range === '12m') days = 365;
    if (range === 'all') days = 3650;
    
    const currentCutoff = now - (days * 24 * 60 * 60 * 1000);
    const prevCutoff = currentCutoff - (days * 24 * 60 * 60 * 1000);
    return { currentCutoff, prevCutoff };
  };

  const { currentCutoff, prevCutoff } = getCutoffMs(timeRange);

  const calcGrowth = (curr: number, prev: number): string => {
    if (prev === 0) {
      if (curr === 0) return '0.0%';
      return '+100.0%';
    }
    const pct = ((curr - prev) / prev) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
  };

  // Filter items by selected time range for period stats
  const periodUsers = users.filter(u => timeRange === 'all' || !u.createdAtMs || u.createdAtMs >= currentCutoff);
  const prevUsers = users.filter(u => u.createdAtMs && u.createdAtMs >= prevCutoff && u.createdAtMs < currentCutoff);

  const periodTours = tours.filter(t => timeRange === 'all' || !t.createdAtMs || t.createdAtMs >= currentCutoff);
  const prevTours = tours.filter(t => t.createdAtMs && t.createdAtMs >= prevCutoff && t.createdAtMs < currentCutoff);

  const periodBookings = bookings.filter(b => timeRange === 'all' || !b.createdAtMs || b.createdAtMs >= currentCutoff);
  const prevBookings = bookings.filter(b => b.createdAtMs && b.createdAtMs >= prevCutoff && b.createdAtMs < currentCutoff);

  const periodPayments = payments.filter(p => timeRange === 'all' || !p.createdAtMs || p.createdAtMs >= currentCutoff);

  const periodReviews = reviews.filter(r => !r.createdAtMs || r.createdAtMs >= currentCutoff);

  // Statistics calculation
  const userStats = {
    total: periodUsers.length,
    allTimeTotal: users.length,
    tourists: periodUsers.filter(u => u.role === 'tourist').length,
    agencies: periodUsers.filter(u => u.role === 'agency').length,
    cashiers: periodUsers.filter(u => u.role === 'cashier').length,
    active: periodUsers.filter(u => u.status === 'active').length,
    inactive: periodUsers.filter(u => u.status === 'inactive').length
  };

  const tourStats = {
    total: periodTours.length,
    allTimeTotal: tours.length,
    active: periodTours.filter(t => t.status === 'active').length,
    pending: periodTours.filter(t => t.status === 'pending').length,
    flagged: periodTours.filter(t => t.status === 'flagged').length
  };

  const bookingStats = {
    total: periodBookings.length,
    allTimeTotal: bookings.length,
    confirmed: periodBookings.filter(b => b.status === 'confirmed').length,
    pending: periodBookings.filter(b => b.status === 'pending').length,
    cancelled: periodBookings.filter(b => b.status === 'cancelled').length,
    revenue: periodBookings.reduce((sum, b) => sum + (b.status === 'confirmed' ? b.totalPrice || 0 : 0), 0),
    prevRevenue: prevBookings.reduce((sum, b) => sum + (b.status === 'confirmed' ? b.totalPrice || 0 : 0), 0)
  };

  const paymentStats = {
    total: periodPayments.length,
    successful: periodPayments.filter(p => p.status === 'successful').length,
    failed: periodPayments.filter(p => p.status === 'failed').length,
    totalRevenue: periodPayments.reduce((sum, p) => sum + (p.status === 'successful' ? p.amount || 0 : 0), 0)
  };

  const reviewStats = {
    total: periodReviews.length,
    verified: periodReviews.filter(r => r.verified).length,
    pending: periodReviews.filter(r => !r.verified).length,
    averageRating: periodReviews.length > 0 ? (periodReviews.reduce((sum, r) => sum + r.rating, 0) / periodReviews.length).toFixed(1) : '0.0'
  };

  const userGrowth = calcGrowth(periodUsers.length, prevUsers.length);
  const agencyGrowth = calcGrowth(userStats.agencies, prevUsers.filter(u => u.role === 'agency').length);
  const tourGrowth = calcGrowth(periodTours.length, prevTours.length);
  const revenueGrowth = calcGrowth(bookingStats.revenue, bookingStats.prevRevenue);

  const stats = [
    { label: 'Total Users', value: userStats.total.toString(), icon: Users, color: 'bg-blue-500', change: userGrowth },
    { label: 'Active Agencies', value: userStats.agencies.toString(), icon: Building, color: 'bg-emerald-500', change: agencyGrowth },
    { label: 'Total Tours', value: tourStats.total.toString(), icon: Package, color: 'bg-amber-500', change: tourGrowth },
    { 
      label: timeRange === '7d' ? '7-Day Revenue' : timeRange === '12m' ? 'Annual Revenue' : timeRange === 'all' ? 'All-Time Revenue' : 'Monthly Revenue', 
      value: `ETB ${bookingStats.revenue.toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'bg-purple-500', 
      change: revenueGrowth 
    },
    { label: 'Customer Reviews', value: reviewStats.total.toString(), icon: MessageSquare, color: 'bg-indigo-500', change: `${reviewStats.averageRating}/5.0` }
  ];

  const getAgencyName = async (agencyId: string): Promise<string> => {
    if (!agencyId) return 'Unknown Agency';
    try {
      const existingUser = users.find(user => user.id === agencyId);
      if (existingUser) {
        return existingUser.name || existingUser.email || 'Unknown Agency';
      }
      const agencyDoc = await getDoc(doc(db, 'users', agencyId));
      if (agencyDoc.exists()) {
        const agencyData = agencyDoc.data();
        return agencyData.name || agencyData.email || 'Unknown Agency';
      }
      return 'Unknown Agency';
    } catch (error) {
      console.error('Error fetching agency name:', error);
      return 'Unknown Agency';
    }
  };

  const fetchReviewsWithAgencyNames = async (snapshotDocs?: any[]) => {
    try {
      const docs = snapshotDocs || (await getDocs(collection(db, 'reviews'))).docs;
      const reviewsData = docs.map(doc => ({
        id: doc.id,
        createdAtMs: getTimestampMs(doc.data().createdAt),
        ...doc.data()
      })) as Review[];

      const reviewsWithAgencyNames = await Promise.all(
        reviewsData.map(async (review) => {
          let agencyName = review.agencyName || 'Unknown Agency';
          if (agencyName === 'Unknown Agency' && review.bookingId) {
            try {
              const bookingDoc = await getDoc(doc(db, 'bookings', review.bookingId));
              if (bookingDoc.exists()) {
                const bookingData = bookingDoc.data();
                agencyName = bookingData.agencyName || 'Unknown Agency';
              }
            } catch (error) {
              console.error('Error fetching booking:', error);
            }
          }
          if (agencyName === 'Unknown Agency' && review.agencyId) {
            agencyName = await getAgencyName(review.agencyId);
          }
          return {
            ...review,
            agencyName
          };
        })
      );

      setReviews(reviewsWithAgencyNames);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  // Modal state for modern confirmation dialogs
  const [confirmModalConfig, setConfirmModalConfig] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleDeleteReview = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Review',
      message: `Are you sure you want to delete the review by ${review?.touristName || 'this tourist'}?`,
      type: 'danger',
      confirmText: 'Delete Review',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await deleteDoc(doc(db, 'reviews', reviewId));
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        if (review) {
          await createSystemNotification(
            'review',
            'Review Deleted',
            `Review by ${review.touristName} for ${review.tourName} has been deleted`,
            'medium'
          );
        }
        toast.success('Review deleted successfully');
      }
    });
  };

  const handleVerifyReview = async (reviewId: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, { verified: true });
      
      setReviews(reviews.map(review => 
        review.id === reviewId ? { ...review, verified: true } : review
      ));
      
      if (review) {
        await createSystemNotification(
          'review',
          'Review Verified',
          `Review by ${review.touristName} for ${review.tourName} has been verified`,
          'low'
        );
      }
      toast.success('Review verified successfully');
    } catch (err) {
      console.error('Error verifying review:', err);
      toast.error('Failed to verify review');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${
              index < rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
            }`}
          />
        ))}
        <span className="text-xs font-semibold text-slate-500 ml-1">({rating}/5)</span>
      </div>
    );
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserData.email,
          name: newUserData.name,
          phone: newUserData.phone,
          role: newUserType,
          companyName: newUserData.companyName,
          address: newUserData.address,
          description: newUserData.description,
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create user');
      
      await createSystemNotification(
        'user',
        `New ${newUserType} Created`,
        `${newUserType.charAt(0).toUpperCase() + newUserType.slice(1)} ${newUserData.name} (${newUserData.email}) has been created`,
        'medium',
        data.userId,
        newUserData.email
      );
      
      toast.success(`${newUserType} account created! Welcome email dispatched.`);
      resetUserModal();
    } catch (err: any) {
      toast.error('User creation failed: ' + err.message);
    }
  };

  const resetUserModal = () => {
    setShowUserModal(false);
    setNewUserType('');
    setNewUserData({
      name: '',
      email: '',
      password: 'TempPassword123!',
      phone: '',
      companyName: '',
      address: '',
      description: ''
    });
    setUserModalStep(1);
  };

  const handleDeleteUser = (userId: string) => {
    if (!userId) return;
    const user = users.find(u => u.id === userId);
    const displayName = user?.name || user?.email || 'this user';

    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete User Account',
      message: `Are you sure you want to delete "${displayName}"? This will permanently remove all their profile data from Cloud Firestore and Firebase Authentication.`,
      type: 'danger',
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const response = await fetch(`/api/admin/delete-user/${userId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });

        const responseData = await response.json().catch(() => ({}));
        
        if (response.ok) {
          setUsers(prev => prev.filter(u => u.id !== userId));
          if (user) {
            await createSystemNotification(
              'user',
              'User Deleted',
              `User ${user.name} (${user.email}) has been deleted from the system`,
              'high',
              user.id,
              user.email
            );
          }
          toast.success('User deleted from Firebase Authentication and Firestore.');
        } else {
          const errorMessage = responseData.error || `HTTP error ${response.status}`;
          toast.error(`Failed to delete user: ${errorMessage}`);
          throw new Error(errorMessage);
        }
      }
    });
  };

  const handleDeleteBooking = (bookingId: string) => {
    if (!bookingId) return;
    const booking = bookings.find(b => b.id === bookingId);
    const tourTitle = booking?.tourName || 'this booking';

    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Booking Record',
      message: `Are you sure you want to delete booking #${bookingId.slice(0, 8)} (${tourTitle})? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Booking',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await deleteDoc(doc(db, 'bookings', bookingId));
        setBookings(prev => prev.filter(b => b.id !== bookingId));
        if (booking) {
          await createSystemNotification(
            'booking',
            'Booking Deleted',
            `Booking #${bookingId.slice(0, 8)} for ${booking.tourName} has been deleted`,
            'high'
          );
        }
        toast.success('Booking record deleted successfully.');
      }
    });
  };

  const handleDeleteTour = (tourId: string, tourTitle: string) => {
    if (!tourId) return;

    setConfirmModalConfig({
      isOpen: true,
      title: 'Remove Tour Package',
      message: `Are you sure you want to remove "${tourTitle || 'this tour'}"? This action will permanently delete the tour listing from Cloud Firestore.`,
      type: 'danger',
      confirmText: 'Remove Tour',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'tours', tourId));
          setTours(prev => prev.filter(t => t.id !== tourId));
          await createSystemNotification(
            'system',
            'Tour Deleted',
            `Tour "${tourTitle || tourId}" has been removed by administrator`,
            'high'
          );
          toast.success(`Tour "${tourTitle || 'package'}" removed successfully`);
        } catch (error: any) {
          console.error('Error removing tour:', error);
          toast.error(`Failed to remove tour: ${error.message || 'Unknown error'}`);
          throw error;
        }
      }
    });
  };

  const safeFormatDate = (dateVal: any): string => {
    if (!dateVal) return 'N/A';
    try {
      if (typeof dateVal?.toDate === 'function') {
        return dateVal.toDate().toLocaleDateString();
      }
      if (dateVal instanceof Date) {
        return dateVal.toLocaleDateString();
      }
      if (typeof dateVal === 'string' || typeof dateVal === 'number') {
        const parsed = new Date(dateVal);
        if (!isNaN(parsed.getTime())) return parsed.toLocaleDateString();
      }
    } catch (err) {
      console.warn('Error formatting date:', err);
    }
    return 'N/A';
  };

  const getTimestampMs = (dateVal: any): number => {
    if (!dateVal) return 0;
    try {
      if (typeof dateVal?.toDate === 'function') {
        return dateVal.toDate().getTime();
      }
      if (dateVal instanceof Date) {
        return dateVal.getTime();
      }
      if (typeof dateVal === 'string' || typeof dateVal === 'number') {
        const parsed = new Date(dateVal).getTime();
        return isNaN(parsed) ? 0 : parsed;
      }
    } catch (err) {
      return 0;
    }
    return 0;
  };

  useEffect(() => {
    if (currentUser && !adminAccessLogged.current) {
      logAdminAccess();
      adminAccessLogged.current = true;
    }

    const usersQuery = collection(db, 'users');
    const usersUnsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || data.companyName || data.displayName || 'Unknown Name',
          email: data.email || '',
          role: data.role || 'tourist',
          status: data.verified !== false && data.status !== 'inactive' ? 'active' : 'inactive',
          verified: data.verified ?? true,
          phone: data.phone || '',
          companyName: data.companyName || '',
          address: data.address || '',
          joinDate: safeFormatDate(data.createdAt),
          createdAtMs: getTimestampMs(data.createdAt)
        };
      }).sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      
      setUsers(usersData);
    }, error => console.error('Failed to fetch users:', error));

    const toursQuery = collection(db, 'tours');
    const toursUnsubscribe = onSnapshot(toursQuery, async (snapshot) => {
      const toursData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const agencyName = data.agencyName || await getAgencyName(data.agencyId);
          
          return {
            id: docSnap.id,
            title: data.title || '',
            agencyId: data.agencyId || '',
            agency: agencyName,
            status: data.status || (data.available !== false ? 'active' : 'pending'),
            rating: data.rating || 0,
            reviews: data.reviewsCount || data.reviews || 0,
            createdAt: safeFormatDate(data.createdAt),
            createdAtMs: getTimestampMs(data.createdAt)
          };
        })
      );
      toursData.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      setTours(toursData);
    }, error => console.error('Failed to fetch tours:', error));

    const bookingsQuery = collection(db, 'bookings');
    const bookingsUnsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: data.userId || data.touristId || '',
          tourId: data.tourId || '',
          tourName: data.tourName || 'Unknown Tour',
          totalPrice: data.totalPrice || data.price || 0,
          status: data.status || 'pending',
          createdAt: safeFormatDate(data.createdAt || data.bookingDate),
          createdAtMs: getTimestampMs(data.createdAt || data.bookingDate),
          touristId: data.touristId || '',
          agencyId: data.agencyId || '',
          agencyName: data.agencyName || 'Unknown Agency'
        };
      }).sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      setBookings(bookingsData);
    }, error => console.error('Failed to fetch bookings:', error));

    const paymentsQuery = collection(db, 'payments');
    const paymentsUnsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      const paymentsData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          bookingId: data.bookingId || '',
          amount: data.amount || 0,
          currency: data.currency || 'USD',
          status: data.status || 'pending',
          method: data.method || 'unknown',
          createdAt: safeFormatDate(data.createdAt),
          createdAtMs: getTimestampMs(data.createdAt)
        };
      }).sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      setPayments(paymentsData);
    }, error => console.error('Failed to fetch payments:', error));

    const logsQuery = collection(db, 'logs');
    const logsUnsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          action: data.action || '',
          user: data.user || '',
          timestamp: safeFormatDate(data.timestamp || data.createdAt),
          createdAtMs: getTimestampMs(data.timestamp || data.createdAt),
          details: data.details || ''
        };
      }).sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)).slice(0, 50);
      setLogs(logsData);
    }, error => console.error('Failed to fetch logs:', error));

    const notificationsQuery = collection(db, 'notifications');
    const notificationsUnsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          type: data.type || 'system',
          title: data.title || '',
          message: data.message || '',
          read: data.read || false,
          createdAt: data.createdAt,
          createdAtMs: getTimestampMs(data.createdAt),
          userId: data.userId,
          userEmail: data.userEmail,
          actionUrl: data.actionUrl,
          priority: data.priority || 'medium',
          adminName: data.adminName,
          adminEmail: data.adminEmail
        } as Notification;
      }).sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)).slice(0, 50);
      setNotifications(notificationsData);
    }, error => console.error('Failed to fetch notifications:', error));

    const reviewsQuery = collection(db, 'reviews');
    const reviewsUnsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
      fetchReviewsWithAgencyNames(snapshot.docs);
    }, error => console.error('Failed to fetch reviews:', error));

    return () => {
      usersUnsubscribe();
      toursUnsubscribe();
      bookingsUnsubscribe();
      paymentsUnsubscribe();
      logsUnsubscribe();
      notificationsUnsubscribe();
      reviewsUnsubscribe();
    };
  }, [currentUser]);

  const handleSendResetEmail = async () => {
    if (!resetUserEmail) return;
    try {
      await sendPasswordResetEmail(auth, resetUserEmail);
      await createSystemNotification(
        'user',
        'Password Reset Sent',
        `Password reset email sent to ${resetUserEmail}`,
        'medium'
      );
      toast.success(`Password reset email sent to ${resetUserEmail}`);
    } catch (error) {
      toast.error('Failed to send password reset email: ' + (error as Error).message);
    } finally {
      setShowResetConfirm(false);
      setResetUserEmail(null);
    }
  };

  const handleToggleStatus = async (user: any) => {
    if (!user || !user.id) return;
    
    try {
      const userDocRef = doc(db, 'users', user.id);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        toast.error('User document not found.');
        return;
      }
      
      const userData = userDocSnap.data();
      const currentVerifiedStatus = userData.verified === true;
      const newVerifiedStatus = !currentVerifiedStatus;
      
      await updateDoc(userDocRef, { verified: newVerifiedStatus });
      
      await createSystemNotification(
        'user',
        `User ${newVerifiedStatus ? 'Activated' : 'Deactivated'}`,
        `User ${user.name} (${user.email}) has been ${newVerifiedStatus ? 'activated' : 'deactivated'}`,
        'medium',
        user.id,
        user.email
      );
      
      toast.success(`User ${newVerifiedStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error("Error updating user status: ", error);
      toast.error("Failed to update user status.");
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const user = users.find(u => u.id === userId);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      
      if (user) {
        await createSystemNotification(
          'user',
          'User Role Updated',
          `User ${user.name} role changed to ${newRole}`,
          'medium',
          user.id,
          user.email
        );
      }
      toast.success('User role updated successfully');
    } catch (error) {
      console.error("Error updating user role: ", error);
      toast.error("Failed to update user role.");
    }
  };

  const handleUpdateTourStatus = async (tourId: string, newStatus: string) => {
    try {
      const tour = tours.find(t => t.id === tourId);
      const tourRef = doc(db, 'tours', tourId);
      await updateDoc(tourRef, { status: newStatus });
      
      if (tour) {
        await createSystemNotification(
          'system',
          'Tour Status Updated',
          `Tour "${tour.title}" status changed to ${newStatus}`,
          'medium'
        );
      }
      toast.success('Tour status updated successfully');
    } catch (error) {
      console.error("Error updating tour status: ", error);
      toast.error("Failed to update tour status.");
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { status: newStatus });
      
      if (booking) {
        await createSystemNotification(
          'booking',
          'Booking Status Updated',
          `Booking #${bookingId.slice(0, 8)} status changed to ${newStatus}`,
          'medium'
        );
      }
      toast.success('Booking status updated successfully');
    } catch (error) {
      console.error("Error updating booking status: ", error);
      toast.error("Failed to update booking status.");
    }
  };

  const handleSaveSettings = async () => {
    try {
      const settingsRef = doc(db, 'systemSettings', 'main');
      await setDoc(settingsRef, systemSettings, { merge: true });
      
      await createSystemNotification(
        'system',
        'System Settings Updated',
        'System settings have been updated successfully',
        'low'
      );
      
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error("Error saving settings: ", error);
      toast.error("Failed to save settings.");
    }
  };

  const filteredUsers = users.filter(user => {
    const roleMatch = userFilter.role ? user.role === userFilter.role : true;
    const statusMatch = userFilter.status ? user.status === userFilter.status : true;
    return roleMatch && statusMatch;
  });

  const filteredTours = tours.filter(tour => {
    return tourFilter.status ? tour.status === tourFilter.status : true;
  });

  const filteredBookings = bookings.filter(booking => {
    return bookingFilter.status ? booking.status === bookingFilter.status : true;
  });

  const ReviewsManagementTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">Reviews Management</h3>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Manage and verify customer feedback across tours</p>
        </div>
        <span className="px-3 py-1 bg-purple-50 border border-purple-100 text-purple-700 text-xs font-bold rounded-full">
          {reviews.length} Reviews
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tour & Tourist</th>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Agency</th>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Comment</th>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {reviews.map((review) => (
              <tr key={review.id} className="hover:bg-slate-50/60 transition-colors duration-150">
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-slate-900">{review.tourName}</div>
                  <div className="text-xs font-semibold text-slate-500 flex items-center mt-1">
                    <User className="h-3.5 w-3.5 text-slate-400 mr-1" />
                    {review.touristName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                  {review.agencyName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderStars(review.rating)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs font-medium text-slate-600 max-w-xs truncate italic">
                    "{review.comment}"
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                  {formatDate(review.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {review.verified ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      <Check className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold space-x-2">
                  {!review.verified && (
                    <button
                      onClick={() => handleVerifyReview(review.id)}
                      className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {reviews.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No reviews found</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, onClick: () => setActiveTab('overview'), active: activeTab === 'overview' },
    { id: 'users', label: 'Users', icon: Users, onClick: () => setActiveTab('users'), active: activeTab === 'users' },
    { id: 'tours', label: 'Tours', icon: Package, onClick: () => setActiveTab('tours'), active: activeTab === 'tours' },
    { id: 'bookings', label: 'Bookings', icon: CreditCard, onClick: () => setActiveTab('bookings'), active: activeTab === 'bookings' },
    { id: 'refunds', label: 'Refunds', icon: RefreshCw, onClick: () => setActiveTab('refunds'), active: activeTab === 'refunds' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, onClick: () => setActiveTab('analytics'), active: activeTab === 'analytics' },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare, onClick: () => setActiveTab('reviews'), active: activeTab === 'reviews' },
    { id: 'sentiment', label: 'Sentiment', icon: MessageSquare, onClick: () => setActiveTab('sentiment'), active: activeTab === 'sentiment' },
    { id: 'logs', label: 'Audit Logs', icon: FileText, onClick: () => setActiveTab('logs'), active: activeTab === 'logs' },
    { id: 'settings', label: 'Settings', icon: Settings, onClick: () => setActiveTab('settings'), active: activeTab === 'settings' }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DashboardLayout
      menuItems={menuItems}
      title="Admin Dashboard"
      userRole="admin"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Bar matching mockup aesthetic */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-purple-600 mb-1">
              <span>PORTAL</span>
              <span className="text-slate-300">&rsaquo;</span>
              <span className="text-slate-500 font-bold">{activeTab.toUpperCase()} OVERVIEW</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">
                {t('dashboard.welcome')}, {currentUser?.name || 'Admin'}!
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ETB Gateway Live
              </span>
            </div>
          </div>
          
          {/* Header Action Buttons & Notifications */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60 text-xs font-bold text-slate-600 flex-wrap gap-0.5">
              <button 
                onClick={() => {
                  setTimeRange('7d');
                  toast.success('Filtered data for Last 7 Days');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  timeRange === '7d' 
                    ? 'bg-white text-purple-700 shadow-2xs font-extrabold' 
                    : 'hover:text-slate-900 text-slate-600'
                }`}
              >
                7D
              </button>
              <button 
                onClick={() => {
                  setTimeRange('30d');
                  toast.success(`Filtered data for 30D (${currentMonthYear})`);
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  timeRange === '30d' 
                    ? 'bg-white text-purple-700 shadow-2xs font-extrabold' 
                    : 'hover:text-slate-900 text-slate-600'
                }`}
              >
                30D ({currentMonthYear})
              </button>
              <button 
                onClick={() => {
                  setTimeRange('12m');
                  toast.success('Filtered data for Last 12 Months');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  timeRange === '12m' 
                    ? 'bg-white text-purple-700 shadow-2xs font-extrabold' 
                    : 'hover:text-slate-900 text-slate-600'
                }`}
              >
                12M
              </button>
              <button 
                onClick={() => {
                  setTimeRange('all');
                  toast.success('Showing All-Time Data');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  timeRange === 'all' 
                    ? 'bg-white text-purple-700 shadow-2xs font-extrabold' 
                    : 'hover:text-slate-900 text-slate-600'
                }`}
              >
                All
              </button>
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button 
                className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:bg-slate-50 transition-all relative text-slate-700"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 max-h-96 overflow-hidden backdrop-blur-md">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                    <h3 className="font-extrabold text-slate-900 text-sm">System Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-xs text-purple-600 hover:text-purple-800 font-bold"
                        >
                          Mark all read
                        </button>
                      )}
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[10px] font-extrabold">
                        {unreadCount} unread
                      </span>
                    </div>
                  </div>
                  
                  <div className="overflow-y-auto max-h-80 divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        <Bell className="h-10 w-10 mx-auto mb-2 text-slate-300 opacity-60" />
                        <p className="font-bold text-sm text-slate-700">No notifications</p>
                        <p className="text-xs text-slate-400 mt-1">System alerts will appear here</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-slate-50/80 transition-colors ${
                            !notification.read ? 'bg-purple-50/30 border-l-4 border-l-purple-500' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                  notification.priority === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                  notification.priority === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  {notification.type}
                                </span>
                                {!notification.read && (
                                  <span className="flex items-center gap-1 text-[10px] text-purple-600 font-bold">
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                    New
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-slate-900 text-xs mb-0.5">
                                {notification.title}
                              </h4>
                              <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                                {notification.message}
                              </p>
                              <div className="flex justify-between items-center mt-2">
                                <p className="text-[10px] text-slate-400 font-semibold">
                                  {notification.createdAt ? 
                                    new Date(notification.createdAt.toDate?.() || notification.createdAt).toLocaleString() : 
                                    'Just now'
                                  }
                                </p>
                                {notification.adminEmail && (
                                  <p className="text-[10px] text-slate-400 truncate ml-2">
                                    by {notification.adminEmail}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              {!notification.read && (
                                <button
                                  onClick={() => markNotificationAsRead(notification.id)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Mark as read"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5-Column Stat Cards matching mockup UI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-2xl ${stat.color} text-white shadow-xs`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100">
                  {stat.change}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Activities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 lg:col-span-1"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-extrabold text-slate-900">Recent Activities</h3>
                <span className="text-xs font-bold text-purple-600 cursor-pointer hover:underline" onClick={() => setActiveTab('logs')}>
                  View all
                </span>
              </div>
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {logs.slice(0, 10).map((log, index) => (
                  <div key={index} className="p-3 bg-slate-50/70 border border-slate-100 rounded-2xl transition-all">
                    <p className="text-xs font-bold text-slate-900">{log.action}</p>
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 mt-2">
                      <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">{log.user}</span>
                      <span>{log.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* System Status Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-extrabold text-slate-900">System Status</h3>
                <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
                  All Systems Operational
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-2xl">
                  <p className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">Users</p>
                  <div className="mt-2">
                    <p className="text-2xl font-black text-slate-900">{userStats.total}</p>
                    <p className="text-xs font-bold text-emerald-600 mt-1">
                      <span>+{userStats.active}</span> active
                    </p>
                  </div>
                </div>
                
                <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl">
                  <p className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">Tours</p>
                  <div className="mt-2">
                    <p className="text-2xl font-black text-slate-900">{tourStats.total}</p>
                    <p className="text-xs font-bold text-amber-600 mt-1">
                      <span>{tourStats.pending}</span> pending
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50/60 border border-purple-100 p-4 rounded-2xl">
                  <p className="text-xs font-extrabold text-purple-700 uppercase tracking-wider">Bookings</p>
                  <div className="mt-2">
                    <p className="text-2xl font-black text-slate-900">{bookingStats.total}</p>
                    <p className="text-xs font-bold text-emerald-600 mt-1">
                      <span>ETB {bookingStats.revenue.toLocaleString()}</span> revenue
                    </p>
                  </div>
                </div>

                <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-2xl">
                  <p className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">Reviews</p>
                  <div className="mt-2">
                    <p className="text-2xl font-black text-slate-900">{reviewStats.total}</p>
                    <p className="text-xs font-bold text-emerald-600 mt-1">
                      <span>{reviewStats.averageRating}★</span> avg rating
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
                  <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Security</p>
                  <div className="mt-2">
                    <p className="text-2xl font-black text-emerald-600">Active</p>
                    <p className="text-xs font-bold text-slate-500 mt-1">No threats</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">User Management</h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Manage user accounts, roles, and permissions</p>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex gap-2">
                  <select 
                    className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    value={userFilter.role}
                    onChange={(e) => setUserFilter({...userFilter, role: e.target.value})}
                  >
                    <option value="">All Roles</option>
                    <option value="tourist">Tourist</option>
                    <option value="agency">Agency</option>
                    <option value="cashier">Cashier</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select 
                    className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    value={userFilter.status}
                    onChange={(e) => setUserFilter({...userFilter, status: e.target.value})}
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowUserModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4" />
                  Add User
                </button>
              </div>
            </div>

            {/* User Statistics 4-Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50/50 border-b border-slate-100">
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-2xs">
                <Users className="h-7 w-7 text-blue-500 mx-auto mb-1.5" />
                <div className="text-xl font-black text-slate-900">{userStats.total}</div>
                <div className="text-xs font-bold text-slate-500">Total Users</div>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-2xs">
                <User className="h-7 w-7 text-emerald-500 mx-auto mb-1.5" />
                <div className="text-xl font-black text-slate-900">{userStats.tourists}</div>
                <div className="text-xs font-bold text-slate-500">Tourists</div>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-2xs">
                <Building className="h-7 w-7 text-purple-500 mx-auto mb-1.5" />
                <div className="text-xl font-black text-slate-900">{userStats.agencies}</div>
                <div className="text-xs font-bold text-slate-500">Agencies</div>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-2xs">
                <CreditCard className="h-7 w-7 text-amber-500 mx-auto mb-1.5" />
                <div className="text-xl font-black text-slate-900">{userStats.cashiers}</div>
                <div className="text-xs font-bold text-slate-500">Cashiers</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Join Date</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-9 w-9 bg-purple-100 border border-purple-200 rounded-full flex items-center justify-center text-purple-700 font-extrabold text-sm">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-bold text-slate-900">{user.name}</div>
                            <div className="text-xs font-medium text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                          user.role === 'admin' ? 'bg-rose-50 text-rose-700 border border-rose-200/80' :
                          user.role === 'agency' ? 'bg-purple-50 text-purple-700 border border-purple-200/80' :
                          user.role === 'cashier' ? 'bg-amber-50 text-amber-700 border border-amber-200/80' :
                          'bg-blue-50 text-blue-700 border border-blue-200/80'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            user.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full mr-1.5 ${
                            user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                        {user.joinDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold space-x-2">
                        <button
                          onClick={() => {
                            setResetUserEmail(user.email);
                            setShowResetConfirm(true);
                          }}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Reset Password
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <Delete className="h-3.5 w-3.5" />
                          Delete User
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold">No users found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tour Management Tab */}
        {activeTab === 'tours' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Tour Management</h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Review and manage tour listings</p>
              </div>
              <div>
                <select 
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  value={tourFilter.status}
                  onChange={(e) => setTourFilter({...tourFilter, status: e.target.value})}
                >
                  <option value="">All Tours</option>
                  <option value="pending">Pending Approval</option>
                  <option value="active">Active</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tour</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Agency</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredTours.map((tour) => (
                    <tr key={tour.id} className="hover:bg-slate-50/60 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">{tour.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-900">{tour.agency}</div>
                        <div className="text-xs text-slate-400 font-mono">ID: {tour.agencyId?.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-bold text-slate-900 mr-1">{tour.rating}</span>
                          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                          <span className="text-xs text-slate-400 font-semibold ml-1">({tour.reviews})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          tour.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' :
                          tour.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200/80' :
                          'bg-rose-50 text-rose-700 border border-rose-200/80'
                        }`}>
                          {tour.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                        {tour.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold space-x-2">
                        <select 
                          className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1 text-xs font-bold focus:ring-2 focus:ring-purple-500/20"
                          value={tour.status}
                          onChange={(e) => handleUpdateTourStatus(tour.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Approve</option>
                          <option value="flagged">Flag</option>
                          <option value="rejected">Reject</option>
                        </select>
                        <button
                          onClick={() => handleDeleteTour(tour.id, tour.title)}
                          className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-bold bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-xl transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Booking & Payments Tab */}
        {activeTab === 'bookings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Booking & Payments</h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Manage customer reservations and transaction records</p>
              </div>
              <div>
                <select 
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  value={bookingFilter.status}
                  onChange={(e) => setBookingFilter({ ...bookingFilter, status: e.target.value })}
                >
                  <option value="">All Bookings</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Bookings Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Booking ID</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tour</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-50/60 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-mono font-bold text-slate-900">#{booking.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-900">
                            {users.find(user => user.id === booking.touristId)?.name || 'N/A'}
                          </div>
                          <div className="text-xs font-semibold text-slate-500">
                            {users.find(user => user.id === booking.touristId)?.email || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-900">{booking.tourName}</div>
                          <div className="text-xs font-semibold text-slate-500">Agency: {booking.agencyName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-black text-slate-900">
                            ETB {(booking.totalPrice || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                            booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' :
                            booking.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200/80' :
                            'bg-rose-50 text-rose-700 border border-rose-200/80'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                          {booking.createdAt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold space-x-2">
                          <div className="flex items-center gap-2">
                            <select 
                              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2 py-1 text-xs font-bold focus:ring-2 focus:ring-purple-500/20"
                              value={booking.status}
                              onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirm</option>
                              <option value="cancelled">Cancel</option>
                            </select>
                            <button
                              onClick={() => handleDeleteBooking(booking.id)}
                              className="text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-xl transition-colors"
                              title="Delete booking"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Booking Statistics 4-Cards */}
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                <h4 className="text-sm font-extrabold text-slate-900 mb-4 uppercase tracking-wider">Booking Analytics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 text-center border border-slate-100 shadow-2xs">
                    <div className="text-xl font-black text-slate-900">{bookingStats.total}</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">Total Bookings</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center border border-slate-100 shadow-2xs">
                    <div className="text-xl font-black text-emerald-600">{bookingStats.confirmed}</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">Confirmed</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center border border-slate-100 shadow-2xs">
                    <div className="text-xl font-black text-amber-600">{bookingStats.pending}</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">Pending</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center border border-slate-100 shadow-2xs">
                    <div className="text-xl font-black text-rose-600">{bookingStats.cancelled}</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">Cancelled</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Reviews Management Tab */}
        {activeTab === 'reviews' && <ReviewsManagementTab />}

        {/* Refunds Management Tab */}
        {activeTab === 'refunds' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <RefundManagement />
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AdminDashboardAnalytics />
          </motion.div>
        )}

        {/* Sentiment Tab */}
        {activeTab === 'sentiment' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SentimentAnalytics />
          </motion.div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'logs' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-extrabold text-slate-900">Audit Logs</h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Detailed system activity and admin audit trails</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {logs.map((log, index) => (
                    <tr key={index} className="hover:bg-slate-50/60 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">{log.action}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-700">
                        {log.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                        {log.timestamp}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-600 max-w-md truncate">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-extrabold text-slate-900">System Settings</h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Configure system-wide preferences and gateways</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Payment Settings */}
              <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/40">
                <h4 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  Payment Settings
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Gateway</label>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                      value={systemSettings.paymentGateway}
                      onChange={(e) => setSystemSettings({...systemSettings, paymentGateway: e.target.value})}
                    >
                      <option value="stripe">Chapa Payment Gateway</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Default Currency</label>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                      value={systemSettings.currency}
                      onChange={(e) => setSystemSettings({...systemSettings, currency: e.target.value})}
                    >
                      <option value="ETB">Ethiopian Birr (ETB)</option>
                      <option value="USD">US Dollar (USD)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Notification Settings */}
              <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/40">
                <h4 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Bell className="h-4 w-4 text-purple-600" />
                  Notification Preferences
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Notification Level</label>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                      value={systemSettings.notificationLevel}
                      onChange={(e) => setSystemSettings({...systemSettings, notificationLevel: e.target.value})}
                    >
                      <option value="high">High (All notifications)</option>
                      <option value="medium">Medium (Important only)</option>
                      <option value="low">Low (Critical only)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Email Notifications</label>
                    <div className="space-y-2 text-xs font-semibold text-slate-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-purple-600" defaultChecked />
                        <span>New user registrations</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-purple-600" defaultChecked />
                        <span>New tour bookings</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-purple-600" defaultChecked />
                        <span>Payment issues & refunds</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Role-Based Access Control */}
              <div className="border border-slate-100 rounded-2xl p-6 md:col-span-2 bg-slate-50/40">
                <h4 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Shield className="h-4 w-4 text-purple-600" />
                  Role-Based Access Control matrix
                </h4>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-extrabold text-slate-600 uppercase">Role</th>
                        <th className="px-4 py-3 text-left font-extrabold text-slate-600 uppercase">User Management</th>
                        <th className="px-4 py-3 text-left font-extrabold text-slate-600 uppercase">Tour Management</th>
                        <th className="px-4 py-3 text-left font-extrabold text-slate-600 uppercase">Booking Management</th>
                        <th className="px-4 py-3 text-left font-extrabold text-slate-600 uppercase">Financial Reports</th>
                        <th className="px-4 py-3 text-left font-extrabold text-slate-600 uppercase">System Settings</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100 font-semibold text-slate-800">
                      <tr>
                        <td className="px-4 py-3 font-bold">Admin</td>
                        <td className="px-4 py-3"><CheckCircle className="h-4 w-4 text-emerald-500" /></td>
                        <td className="px-4 py-3"><CheckCircle className="h-4 w-4 text-emerald-500" /></td>
                        <td className="px-4 py-3"><CheckCircle className="h-4 w-4 text-emerald-500" /></td>
                        <td className="px-4 py-3"><CheckCircle className="h-4 w-4 text-emerald-500" /></td>
                        <td className="px-4 py-3"><CheckCircle className="h-4 w-4 text-emerald-500" /></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold">Agency</td>
                        <td className="px-4 py-3"><XCircle className="h-4 w-4 text-rose-400" /></td>
                        <td className="px-4 py-3"><CheckCircle className="h-4 w-4 text-emerald-500" /></td>
                        <td className="px-4 py-3"><CheckCircle className="h-4 w-4 text-emerald-500" /></td>
                        <td className="px-4 py-3"><CheckCircle className="h-4 w-4 text-emerald-500" /></td>
                        <td className="px-4 py-3"><XCircle className="h-4 w-4 text-rose-400" /></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold">Cashier</td>
                        <td className="px-4 py-3"><XCircle className="h-4 w-4 text-rose-400" /></td>
                        <td className="px-4 py-3"><XCircle className="h-4 w-4 text-rose-400" /></td>
                        <td className="px-4 py-3"><CheckCircle className="h-4 w-4 text-emerald-500" /></td>
                        <td className="px-4 py-3"><CheckCircle className="h-4 w-4 text-emerald-500" /></td>
                        <td className="px-4 py-3"><XCircle className="h-4 w-4 text-rose-400" /></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold">Tourist</td>
                        <td className="px-4 py-3"><XCircle className="h-4 w-4 text-rose-400" /></td>
                        <td className="px-4 py-3"><XCircle className="h-4 w-4 text-rose-400" /></td>
                        <td className="px-4 py-3"><XCircle className="h-4 w-4 text-rose-400" /></td>
                        <td className="px-4 py-3"><XCircle className="h-4 w-4 text-rose-400" /></td>
                        <td className="px-4 py-3"><XCircle className="h-4 w-4 text-rose-400" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveSettings}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-purple-500/20"
              >
                Save System Settings
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      {/* Reset Password Confirmation Modal */}
      {showResetConfirm && resetUserEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">Confirm Password Reset</h2>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Send a password reset email link to <strong className="text-slate-900 font-bold">{resetUserEmail}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  setResetUserEmail(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendResetEmail}
                className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-colors"
              >
                Confirm & Send Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changePasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <h2 className="text-lg font-extrabold text-slate-900 mb-4">Change Password for {changePasswordUser.name}</h2>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mb-4 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setChangePasswordUser(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.error('Manual password change requires backend support.');
                  setChangePasswordUser(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition-colors"
                disabled={!newPassword}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {userModalStep === 1 && (
              <>
                <h2 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
                  <User className="h-6 w-6 text-amber-500" />
                  Add New Account
                </h2>
                <p className="text-xs text-slate-500 mb-6">Select the type of user role you want to create</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setNewUserType('cashier');
                      setUserModalStep(2);
                    }}
                    className="p-6 border-2 border-slate-100 rounded-2xl hover:border-amber-500 hover:bg-amber-50/50 transition-all text-center group"
                  >
                    <CreditCard className="h-8 w-8 text-amber-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-extrabold text-slate-900 text-sm">Cashier</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Payment processing</p>
                  </button>
                  
                  <button
                    onClick={() => {
                      setNewUserType('agency');
                      setUserModalStep(2);
                    }}
                    className="p-6 border-2 border-slate-100 rounded-2xl hover:border-purple-500 hover:bg-purple-50/50 transition-all text-center group"
                  >
                    <Building className="h-8 w-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-extrabold text-slate-900 text-sm">Agency</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Tour creation & management</p>
                  </button>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    onClick={resetUserModal}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {userModalStep === 2 && (
              <>
                <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                  {newUserType === 'cashier' ? (
                    <CreditCard className="h-6 w-6 text-amber-500" />
                  ) : (
                    <Building className="h-6 w-6 text-purple-600" />
                  )}
                  Create New {newUserType === 'cashier' ? 'Cashier' : 'Agency'}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newUserData.name}
                      onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500/20"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500/20"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={newUserData.phone}
                      onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500/20"
                      placeholder="+251 9XX XXX XXX"
                    />
                  </div>

                  {newUserType === 'agency' && (
                    <>
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          value={newUserData.companyName}
                          onChange={(e) => setNewUserData({ ...newUserData, companyName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500/20"
                          placeholder="Enter company name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1">
                          Business Address
                        </label>
                        <input
                          type="text"
                          value={newUserData.address}
                          onChange={(e) => setNewUserData({ ...newUserData, address: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500/20"
                          placeholder="Enter business address"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1">
                          Business Description
                        </label>
                        <textarea
                          value={newUserData.description}
                          onChange={(e) => setNewUserData({ ...newUserData, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500/20"
                          placeholder="Brief description of agency..."
                        />
                      </div>
                    </>
                  )}

                  <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex items-start gap-3">
                    <Mail className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-extrabold text-purple-900">
                        Password Setup Email
                      </p>
                      <p className="text-[11px] text-purple-700 mt-0.5 leading-relaxed">
                        A password setup link will be dispatched to the user so they can set their credential.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setUserModalStep(1)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    &larr; Back
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={resetUserModal}
                      className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateUser}
                      disabled={!newUserData.name || !newUserData.email || !newUserData.phone || (newUserType === 'agency' && !newUserData.companyName)}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                      <User className="h-4 w-4" />
                      Create {newUserType === 'cashier' ? 'Cashier' : 'Agency'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modern Custom Confirmation Modal */}
      <ConfirmModal
        {...confirmModalConfig}
        onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </DashboardLayout>
  );
};