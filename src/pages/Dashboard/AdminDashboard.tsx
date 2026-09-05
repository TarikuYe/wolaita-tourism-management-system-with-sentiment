import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Building, Package, TrendingUp, AlertTriangle, CheckCircle, XCircle, 
  MessageSquare, BarChart3, CreditCard, Settings, Shield, FileText, Bell,
  Star, Edit, Delete, User, Check, Mail, Plus, Eye, EyeOff, Trash2,
  LayoutDashboard, RefreshCw
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

interface Review {
  id: string;
  touristName: string;
  touristId: string;
  tourName: string;
  tourId: string;
  rating: number;
  comment: string;
  createdAt: any;
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
    password: 'TempPassword123!', // Temporary password, will be reset
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
  const adminAccessLogged = useRef(false); // Add this ref to prevent duplicate notifications

  // Notification functions
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { 
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(notification =>
        updateDoc(doc(db, 'notifications', notification.id), { 
          read: true,
          readAt: serverTimestamp()
        })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Function to log admin access
  const logAdminAccess = async () => {
    if (!currentUser) return;
    
    try {
      await addDoc(collection(db, 'notifications'), {
        type: 'access',
        title: 'Admin Dashboard Access',
        message: `Admin user ${currentUser.email} accessed the dashboard`,
        read: false,
        createdAt: serverTimestamp(),
        userId: currentUser.id,
        userEmail: currentUser.email,
        adminName: currentUser.name || 'Admin',
        adminEmail: currentUser.email,
        priority: 'low'
      });
    } catch (error) {
      console.error('Error logging admin access:', error);
    }
  };

  // Function to create system notifications
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

  // Close notifications when clicking outside
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

  // Statistics calculation
  const userStats = {
    total: users.length,
    tourists: users.filter(u => u.role === 'tourist').length,
    agencies: users.filter(u => u.role === 'agency').length,
    cashiers: users.filter(u => u.role === 'cashier').length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length
  };

  const tourStats = {
    total: tours.length,
    active: tours.filter(t => t.status === 'active').length,
    pending: tours.filter(t => t.status === 'pending').length,
    flagged: tours.filter(t => t.status === 'flagged').length
  };

  const bookingStats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    revenue: bookings.reduce((sum, b) => sum + (b.status === 'confirmed' ? b.totalPrice || 0 : 0), 0)
  };

  const paymentStats = {
    total: payments.length,
    successful: payments.filter(p => p.status === 'successful').length,
    failed: payments.filter(p => p.status === 'failed').length,
    totalRevenue: payments.reduce((sum, p) => sum + (p.status === 'successful' ? p.amount || 0 : 0), 0)
  };

  const reviewStats = {
    total: reviews.length,
    verified: reviews.filter(r => r.verified).length,
    pending: reviews.filter(r => !r.verified).length,
    averageRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0'
  };

  const stats = [
    { label: 'Total Users', value: userStats.total.toString(), icon: Users, color: 'bg-blue-500', change: '+12%' },
    { label: 'Active Agencies', value: userStats.agencies.toString(), icon: Building, color: 'bg-green-500', change: '+5%' },
    { label: 'Total Tours', value: tourStats.total.toString(), icon: Package, color: 'bg-amber-500', change: '+18%' },
    { label: 'Monthly Revenue', value: `$${bookingStats.revenue.toLocaleString()}`, icon: TrendingUp, color: 'bg-purple-500', change: '+23%' },
    { label: 'Customer Reviews', value: reviewStats.total.toString(), icon: MessageSquare, color: 'bg-indigo-500', change: '+15%' }
  ];

  // Function to get agency name by ID
  const getAgencyName = async (agencyId: string): Promise<string> => {
    if (!agencyId) return 'Unknown Agency';
    
    try {
      // First check if we already have the user in our local state
      const existingUser = users.find(user => user.id === agencyId);
      if (existingUser) {
        return existingUser.name || existingUser.email || 'Unknown Agency';
      }
      
      // If not found in local state, fetch from Firestore
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

  // Function to fetch reviews with agency names
  const fetchReviewsWithAgencyNames = async () => {
    try {
      // Fetch reviews
      const reviewsSnapshot = await getDocs(collection(db, 'reviews'));
      const reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];

      // Map agency names to reviews
      const reviewsWithAgencyNames = await Promise.all(
        reviewsData.map(async (review) => {
          let agencyName = 'Unknown Agency';
          
          // Try to find matching booking by bookingId first
          if (review.bookingId) {
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

          // If no booking found or no agency name from booking, try by agencyId
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

  // Review management functions
  const handleDeleteReview = async (reviewId: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      await deleteDoc(doc(db, 'reviews', reviewId));
      setReviews(reviews.filter(review => review.id !== reviewId));
      
      // Add notification
      if (review) {
        await createSystemNotification(
          'review',
          'Review Deleted',
          `Review by ${review.touristName} for ${review.tourName} has been deleted`,
          'medium'
        );
      }
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const handleVerifyReview = async (reviewId: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, { verified: true });
      
      setReviews(reviews.map(review => 
        review.id === reviewId ? { ...review, verified: true } : review
      ));
      
      // Add notification
      if (review) {
        await createSystemNotification(
          'review',
          'Review Verified',
          `Review by ${review.touristName} for ${review.tourName} has been verified`,
          'low'
        );
      }
    } catch (err) {
      console.error('Error verifying review:', err);
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
              index < rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-500 ml-1">({rating}/5)</span>
      </div>
    );
  };

  // User Management Functions
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
      
      // Add notification
      await createSystemNotification(
        'user',
        `New ${newUserType} Created`,
        `${newUserType.charAt(0).toUpperCase() + newUserType.slice(1)} ${newUserData.name} (${newUserData.email}) has been created`,
        'medium',
        data.userId,
        newUserData.email
      );
      
      alert(`${newUserType} created! A password setup link will be sent to: ${newUserData.email}\n\nPassword Setup Link (for testing): ${data.resetLink}`);
      resetUserModal();
    } catch (err: any) {
      alert('User creation failed: ' + err.message);
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

  // UPDATED: User deletion function that ensures both Firestore and Firebase Auth deletion
  const handleDeleteUser = async (userId: string) => {
    if (!userId) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this user? This will remove all their data permanently from both Firestore and Firebase Authentication.');
    if (!confirmed) return;
    
    try {
      const user = users.find(u => u.id === userId);
      
      // Always use API endpoint to ensure both Firestore and Firebase Auth deletion
      const response = await fetch(`/api/admin/delete-user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json().catch(() => ({}));
      
      if (response.ok) {
        // Check if both deletions succeeded
        const { authDeleted, firestoreDeleted, authError } = responseData;
        
        // Update local state
        setUsers(users.filter(u => u.id !== userId));
        
        // Add notification
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
        
        // Show appropriate message based on what was deleted
        if (authDeleted && firestoreDeleted) {
          alert('User deleted successfully from both Firebase Authentication and Firestore.');
        } else if (firestoreDeleted && !authDeleted) {
          if (authError && authError.code === 'auth/user-not-found') {
            alert('User deleted from Firestore. User was not found in Firebase Authentication (may have been deleted already).');
          } else {
            alert(`Warning: User deleted from Firestore, but Firebase Authentication deletion failed: ${authError?.message || 'Unknown error'}. Please check Firebase Console.`);
          }
        } else if (!firestoreDeleted) {
          alert(`Error: Failed to delete user from Firestore. ${responseData.error || 'Unknown error'}`);
          return; // Don't update local state if Firestore deletion failed
        }
      } else {
        // API call failed
        const errorMessage = responseData.error || `HTTP error! status: ${response.status}`;
        console.error('API deletion failed:', errorMessage);
        
        // Don't fall back to direct Firestore deletion - this would leave Auth user intact
        alert(`Failed to delete user: ${errorMessage}\n\nPlease ensure the backend server is running and try again. Both Firestore and Firebase Auth deletion are required.`);
        throw new Error(errorMessage);
      }
      
    } catch (err: any) {
      console.error('Delete user failed:', err);
      
      // More specific error messages
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        alert('Network error: Could not connect to backend server. Please ensure the backend is running on port 3001 and try again.');
      } else if (err.message.includes('404') || err.message.includes('User not found')) {
        alert('User not found. They may have already been deleted.');
      } else if (err.message.includes('403') || err.message.includes('permission')) {
        alert('You do not have permission to delete users. Check backend authentication.');
      } else {
        alert(`Failed to delete user: ${err.message || 'Unknown error'}\n\nPlease ensure the backend server is running.`);
      }
    }
  };

  // NEW: Booking deletion function
  const handleDeleteBooking = async (bookingId: string) => {
    if (!bookingId) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this booking? This action cannot be undone and will remove all booking data permanently.');
    if (!confirmed) return;
    
    try {
      const booking = bookings.find(b => b.id === bookingId);
      
      // Delete booking from Firestore
      await deleteDoc(doc(db, 'bookings', bookingId));
      
      // Update local state
      setBookings(bookings.filter(b => b.id !== bookingId));
      
      // Add notification
      if (booking) {
        await createSystemNotification(
          'booking',
          'Booking Deleted',
          `Booking #${bookingId.slice(0, 8)} for ${booking.tourName} has been deleted`,
          'high'
        );
      }
      
      alert('Booking deleted successfully');
      
    } catch (err: any) {
      console.error('Delete booking failed:', err);
      
      // More specific error messages
      if (err.message.includes('404') || err.message.includes('not found')) {
        alert('Booking not found. It may have already been deleted.');
      } else if (err.message.includes('403') || err.message.includes('permission')) {
        alert('You do not have permission to delete bookings. Check Firestore security rules.');
      } else {
        alert(`Failed to delete booking: ${err.message || 'Unknown error'}`);
      }
    }
  };

  // Fetch data from Firestore
  useEffect(() => {
    // Log admin access - only once when component mounts and currentUser is available
    if (currentUser && !adminAccessLogged.current) {
      logAdminAccess();
      adminAccessLogged.current = true; // Mark as logged to prevent duplicates
    }

    // Users
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const usersUnsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          role: data.role || '',
          status: data.verified ? 'active' : 'inactive',
          joinDate: data.createdAt ? data.createdAt.toDate().toLocaleDateString() : '',
        };
      });
      setUsers(usersData);
    }, error => console.error('Failed to fetch users:', error));

    // Tours - Updated to fetch agency name properly
    const toursQuery = query(collection(db, 'tours'), orderBy('createdAt', 'desc'));
    const toursUnsubscribe = onSnapshot(toursQuery, async (snapshot) => {
      const toursData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const agencyName = await getAgencyName(data.agencyId);
          
          return {
            id: doc.id,
            title: data.title || '',
            agencyId: data.agencyId || '',
            agency: agencyName, // Use the fetched agency name
            status: data.status || 'pending',
            rating: data.rating || 0,
            reviews: data.reviews || 0,
            createdAt: data.createdAt ? data.createdAt.toDate().toLocaleDateString() : '',
          };
        })
      );
      setTours(toursData);
    }, error => console.error('Failed to fetch tours:', error));

    // Bookings
    const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const bookingsUnsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId || '',
          tourId: data.tourId || '',
          tourName: data.tourName || '',
          totalPrice: data.totalPrice || 0,
          status: data.status || 'pending',
          createdAt: data.createdAt ? data.createdAt.toDate().toLocaleDateString() : '',
          touristId: data.touristId || '',
          agencyId: data.agencyId || '',
          agencyName: data.agencyName || 'Unknown Agency'
        };
      });
      setBookings(bookingsData);
    }, error => console.error('Failed to fetch bookings:', error));

    // Payments
    const paymentsQuery = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    const paymentsUnsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      const paymentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          bookingId: data.bookingId || '',
          amount: data.amount || 0,
          currency: data.currency || 'USD',
          status: data.status || 'pending',
          method: data.method || 'unknown',
          createdAt: data.createdAt ? data.createdAt.toDate().toLocaleDateString() : '',
        }
      });
      setPayments(paymentsData);
    }, error => console.error('Failed to fetch payments:', error));

    // Logs
    const logsQuery = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(50));
    const logsUnsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          action: data.action || '',
          user: data.user || '',
          timestamp: data.timestamp ? data.timestamp.toDate().toLocaleString() : '',
          details: data.details || ''
        };
      });
      setLogs(logsData);
    }, error => console.error('Failed to fetch logs:', error));

    // Notifications
    const notificationsQuery = query(
      collection(db, 'notifications'), 
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const notificationsUnsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || 'system',
          title: data.title || '',
          message: data.message || '',
          read: data.read || false,
          createdAt: data.createdAt,
          userId: data.userId,
          userEmail: data.userEmail,
          actionUrl: data.actionUrl,
          priority: data.priority || 'medium',
          adminName: data.adminName,
          adminEmail: data.adminEmail
        } as Notification;
      });
      setNotifications(notificationsData);
    }, error => console.error('Failed to fetch notifications:', error));

    // Fetch reviews
    fetchReviewsWithAgencyNames();

    return () => {
      usersUnsubscribe();
      toursUnsubscribe();
      bookingsUnsubscribe();
      paymentsUnsubscribe();
      logsUnsubscribe();
      notificationsUnsubscribe();
    };
  }, [currentUser]);

  // Handle functions
  const handleSendResetEmail = async () => {
    if (!resetUserEmail) return;
    try {
      await sendPasswordResetEmail(auth, resetUserEmail);
      
      // Add notification
      await createSystemNotification(
        'user',
        'Password Reset Sent',
        `Password reset email sent to ${resetUserEmail}`,
        'medium'
      );
      
      alert(`Password reset email sent to ${resetUserEmail}`);
    } catch (error) {
      alert('Failed to send password reset email: ' + (error as Error).message);
    } finally {
      setShowResetConfirm(false);
      setResetUserEmail(null);
    }
  };

  const handleToggleStatus = async (user: any) => {
    if (!user || !user.id) return;
    
    try {
      // Read current verified status directly from Firestore for accuracy
      const userDocRef = doc(db, 'users', user.id);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        alert('User document not found.');
        return;
      }
      
      const userData = userDocSnap.data();
      const currentVerifiedStatus = userData.verified === true;
      const newVerifiedStatus = !currentVerifiedStatus;
      
      // Update the verified field in Firestore
      await updateDoc(userDocRef, { verified: newVerifiedStatus });
      
      // If deactivating, also disable Firebase Auth user
      if (!newVerifiedStatus) {
        try {
          // Note: This requires Firebase Admin SDK on backend
          // For now, the Firestore check will prevent login
          // You may want to call a backend endpoint to disable Firebase Auth user
        } catch (authError) {
          console.error("Error disabling Firebase Auth user:", authError);
          // Continue even if this fails - Firestore check will still work
        }
      }
      
      // Add notification
      await createSystemNotification(
        'user',
        `User ${newVerifiedStatus ? 'Activated' : 'Deactivated'}`,
        `User ${user.name} (${user.email}) has been ${newVerifiedStatus ? 'activated' : 'deactivated'}`,
        'medium',
        user.id,
        user.email
      );
      
      // Show success message
      alert(`User ${newVerifiedStatus ? 'activated' : 'deactivated'} successfully`);
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
      
      // Add notification
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
    } catch (error) {
      console.error("Error updating user role: ", error);
      alert("Failed to update user role.");
    }
  };

  const handleUpdateTourStatus = async (tourId: string, newStatus: string) => {
    try {
      const tour = tours.find(t => t.id === tourId);
      const tourRef = doc(db, 'tours', tourId);
      await updateDoc(tourRef, { status: newStatus });
      
      // Add notification
      if (tour) {
        await createSystemNotification(
          'system',
          'Tour Status Updated',
          `Tour "${tour.title}" status changed to ${newStatus}`,
          'medium'
        );
      }
    } catch (error) {
      console.error("Error updating tour status: ", error);
      alert("Failed to update tour status.");
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { status: newStatus });
      
      // Add notification
      if (booking) {
        await createSystemNotification(
          'booking',
          'Booking Status Updated',
          `Booking #${bookingId.slice(0, 8)} status changed to ${newStatus}`,
          'medium'
        );
      }
    } catch (error) {
      console.error("Error updating booking status: ", error);
      alert("Failed to update booking status.");
    }
  };

  const handleSaveSettings = async () => {
    try {
      const settingsRef = doc(db, 'systemSettings', 'main');
      await setDoc(settingsRef, systemSettings, { merge: true });
      
      // Add notification
      await createSystemNotification(
        'system',
        'System Settings Updated',
        'System settings have been updated successfully',
        'low'
      );
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error("Error saving settings: ", error);
      alert("Failed to save settings.");
    }
  };

  // Filter functions
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

  // Reviews Management Tab Content
  const ReviewsManagementTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-lg shadow overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Reviews Management</h3>
        <p className="text-sm text-gray-500 mt-1">Manage and verify customer reviews</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour & Tourist</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reviews.map((review) => (
              <tr key={review.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{review.tourName}</div>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <User className="h-4 w-4 mr-1" />
                    {review.touristName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{review.agencyName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderStars(review.rating)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    "{review.comment}"
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(review.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {review.verified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {!review.verified && (
                    <button
                      onClick={() => handleVerifyReview(review.id)}
                      className="text-green-600 hover:text-green-900 flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="text-red-600 hover:text-red-900 flex items-center"
                  >
                    <Delete className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {reviews.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No reviews found</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  // Menu items for sidebar
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('dashboard.welcome')}, {currentUser?.name}!
            </h1>
            <p className="text-gray-600 mt-2">
              {t('dashboard.admin.title')}
            </p>
          </div>
          
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button 
              className="p-2 rounded-full hover:bg-gray-200 transition-colors relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-6 w-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                    <span className="text-xs text-gray-500">
                      {unreadCount} unread
                    </span>
                  </div>
                </div>
                
                <div className="overflow-y-auto max-h-80">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-3 text-gray-400 opacity-50" />
                      <p className="font-medium">No notifications</p>
                      <p className="text-sm mt-1">System alerts will appear here</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                notification.priority === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
                                notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                {notification.type}
                              </span>
                              {!notification.read && (
                                <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  Unread
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-gray-500">
                                {notification.createdAt ? 
                                  new Date(notification.createdAt.toDate()).toLocaleString() : 
                                  'Just now'
                                }
                              </p>
                              {notification.adminEmail && (
                                <p className="text-xs text-gray-400 truncate ml-2">
                                  by {notification.adminEmail}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            {!notification.read && (
                              <button
                                onClick={() => markNotificationAsRead(notification.id)}
                                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                                title="Mark as read"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
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
                
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => {
                        setActiveTab('logs');
                        setShowNotifications(false);
                      }}
                      className="w-full text-center text-sm text-gray-600 hover:text-gray-800 font-medium py-2 hover:bg-white rounded transition-colors"
                    >
                      View all activity logs
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow p-4"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                    <span className="text-xs font-medium text-green-600">{stat.change}</span>
                  </div>
                </div>
              </div>
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
              transition={{ duration: 0.6 }}
              className="bg-white rounded-lg shadow p-6 lg:col-span-1"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {logs.slice(0, 10).map((log, index) => (
                  <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                    <p className="text-sm text-gray-900">{log.action}</p>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{log.user}</span>
                      <span>{log.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* System Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-lg shadow p-6 lg:col-span-2"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-blue-800">Users</p>
                  <div className="mt-2">
                    <p className="text-xl font-bold">{userStats.total}</p>
                    <p className="text-xs text-green-600 mt-1">
                      <span className="font-semibold">+{userStats.active}</span> active
                    </p>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xs text-green-800">Tours</p>
                  <div className="mt-2">
                    <p className="text-xl font-bold">{tourStats.total}</p>
                    <p className="text-xs text-amber-600 mt-1">
                      <span className="font-semibold">{tourStats.pending}</span> pending
                    </p>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-xs text-purple-800">Bookings</p>
                  <div className="mt-2">
                    <p className="text-xl font-bold">{bookingStats.total}</p>
                    <p className="text-xs text-green-600 mt-1">
                      <span className="font-semibold">${bookingStats.revenue.toLocaleString()}</span> revenue
                    </p>
                  </div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-xs text-indigo-800">Reviews</p>
                  <div className="mt-2">
                    <p className="text-xl font-bold">{reviewStats.total}</p>
                    <p className="text-xs text-green-600 mt-1">
                      <span className="font-semibold">{reviewStats.averageRating}</span> avg rating
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-800">Security</p>
                  <div className="mt-2">
                    <p className="text-xl font-bold text-green-600">Active</p>
                    <p className="text-xs text-gray-600 mt-1">No threats detected</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* User Management */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                <p className="text-sm text-gray-500 mt-1">Manage users, roles, and permissions</p>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Role: </label>
                    <select 
                      className="border rounded p-2 text-sm"
                      value={userFilter.role}
                      onChange={(e) => setUserFilter({...userFilter, role: e.target.value})}
                    >
                      <option value="">All Roles</option>
                      <option value="tourist">Tourist</option>
                      <option value="agency">Agency</option>
                      <option value="cashier">Cashier</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Status: </label>
                    <select 
                      className="border rounded p-2 text-sm"
                      value={userFilter.status}
                      onChange={(e) => setUserFilter({...userFilter, status: e.target.value})}
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowUserModal(true)}
                    className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 flex items-center gap-2 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add User
                  </button>
                </div>
              </div>
            </div>

            {/* User Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-b">
              <div className="bg-white rounded-lg p-4 text-center border">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{userStats.total}</div>
                <div className="text-sm text-gray-500">Total Users</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border">
                <User className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{userStats.tourists}</div>
                <div className="text-sm text-gray-500">Tourists</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border">
                <Building className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{userStats.agencies}</div>
                <div className="text-sm text-gray-500">Agencies</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border">
                <CreditCard className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{userStats.cashiers}</div>
                <div className="text-sm text-gray-500">Cashiers</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-amber-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'agency' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'cashier' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            user.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.joinDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            setResetUserEmail(user.email);
                            setShowResetConfirm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                          Reset Password
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1 transition-colors"
                        >
                          <Delete className="h-4 w-4" />
                          Delete User
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No users found</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tour Management */}
        {activeTab === 'tours' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4 md:mb-0">Tour Management</h3>
              <div className="flex gap-3">
                <div>
                  <label className="text-xs text-gray-500">Status: </label>
                  <select 
                    className="border rounded p-2 text-sm"
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
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTours.map((tour) => (
                    <tr key={tour.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{tour.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tour.agency}</div>
                        <div className="text-xs text-gray-500">ID: {tour.agencyId?.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 mr-1">{tour.rating}</span>
                          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs text-gray-500 ml-1">({tour.reviews})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          tour.status === 'active' ? 'bg-green-100 text-green-800' :
                          tour.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {tour.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tour.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <select 
                          className="border rounded p-1 text-sm"
                          value={tour.status}
                          onChange={(e) => handleUpdateTourStatus(tour.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Approve</option>
                          <option value="flagged">Flag</option>
                          <option value="rejected">Reject</option>
                        </select>
                        <button className="text-red-600 hover:text-red-900">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Booking & Payments */}
        {activeTab === 'bookings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4 md:mb-0">Booking & Payments</h3>
              <div className="flex gap-3">
                <div>
                  <label className="text-xs text-gray-500">Status: </label>
                  <select 
                    className="border rounded p-2 text-sm"
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
            </div>
            
            <div className="p-6 space-y-8">
              {/* Bookings Table */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Bookings</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-100">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">#{booking.id.slice(0, 8)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {users.find(user => user.id === booking.touristId)?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {users.find(user => user.id === booking.touristId)?.email || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{booking.tourName}</div>
                            <div className="text-xs text-gray-500">Agency: {booking.agencyName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ${(booking.totalPrice || 0).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.createdAt}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <select 
                                  className="border rounded p-1 text-sm flex-1"
                                  value={booking.status}
                                  onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirm</option>
                                  <option value="cancelled">Cancel</option>
                                </select>
                              </div>
                              <button
                                onClick={() => handleDeleteBooking(booking.id)}
                                className="text-red-600 hover:text-red-900 flex items-center gap-1 justify-center transition-colors bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredBookings.length === 0 && (
                    <div className="text-center py-12">
                      <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No bookings found</p>
                      <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Booking Statistics */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Booking Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center border">
                    <div className="text-2xl font-bold text-gray-900">{bookingStats.total}</div>
                    <div className="text-sm text-gray-500">Total Bookings</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center border">
                    <div className="text-2xl font-bold text-green-600">{bookingStats.confirmed}</div>
                    <div className="text-sm text-gray-500">Confirmed</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center border">
                    <div className="text-2xl font-bold text-yellow-600">{bookingStats.pending}</div>
                    <div className="text-sm text-gray-500">Pending</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center border">
                    <div className="text-2xl font-bold text-red-600">{bookingStats.cancelled}</div>
                    <div className="text-sm text-gray-500">Cancelled</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Reviews Management */}
        {activeTab === 'reviews' && <ReviewsManagementTab />}

        {/* Refunds Management */}
        {activeTab === 'refunds' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <RefundManagement />
          </motion.div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <AdminDashboardAnalytics />
          </motion.div>
        )}

        {/* Sentiment Analysis */}
        {activeTab === 'sentiment' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SentimentAnalytics />
          </motion.div>
        )}

        {/* Audit Logs */}
        {activeTab === 'logs' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
              <p className="text-sm text-gray-500 mt-1">Detailed system activity records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{log.action}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.user}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.timestamp}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">{log.details}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
              <p className="text-sm text-gray-500 mt-1">Configure system-wide preferences</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Payment Settings */}
              <div className="border rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Settings
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Gateway</label>
                    <select 
                      className="w-full border rounded p-2"
                      value={systemSettings.paymentGateway}
                      onChange={(e) => setSystemSettings({...systemSettings, paymentGateway: e.target.value})}
                    >
                      <option value="stripe">Chapa</option>
                      {/* <option value="paypal">PayPal</option> */}
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                    <select 
                      className="w-full border rounded p-2"
                      value={systemSettings.currency}
                      onChange={(e) => setSystemSettings({...systemSettings, currency: e.target.value})}
                    >
                      <option value="ETB">Ethiopian Birr (ETB)</option>
                      <option value="USD">US Dollar (USD)</option>
                      {/* <option value="EUR">Euro (EUR)</option>
                      <option value="GBP">British Pound (GBP)</option> */}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Notification Settings */}
              <div className="border rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Settings
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notification Level</label>
                    <select 
                      className="w-full border rounded p-2"
                      value={systemSettings.notificationLevel}
                      onChange={(e) => setSystemSettings({...systemSettings, notificationLevel: e.target.value})}
                    >
                      <option value="high">High (All notifications)</option>
                      <option value="medium">Medium (Important only)</option>
                      <option value="low">Low (Critical only)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Notifications</label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center">
                        <input type="checkbox" id="new-user" className="mr-2" defaultChecked />
                        <label htmlFor="new-user" className="text-sm text-gray-700">New user registrations</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="new-booking" className="mr-2" defaultChecked />
                        <label htmlFor="new-booking" className="text-sm text-gray-700">New bookings</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="payment" className="mr-2" defaultChecked />
                        <label htmlFor="payment" className="text-sm text-gray-700">Payment issues</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Access Control */}
              <div className="border rounded-lg p-6 md:col-span-2">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Role-Based Access Control
                </h4>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Management</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour Management</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Management</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial Reports</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System Settings</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Admin</td>
                        <td className="px-6 py-4 whitespace-nowrap"><CheckCircle className="h-5 w-5 text-green-500" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><CheckCircle className="h-5 w-5 text-green-500" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><CheckCircle className="h-5 w-5 text-green-500" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><CheckCircle className="h-5 w-5 text-green-500" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><CheckCircle className="h-5 w-5 text-green-500" /></td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Agency</td>
                        <td className="px-6 py-4 whitespace-nowrap"><XCircle className="h-5 w-5 text-red-500" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><CheckCircle className="h-5 w-5 text-green-500" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><CheckCircle className="h-5 w-5 text-green-500" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><CheckCircle className="h-5 w-5 text-green-500" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><XCircle className="h-5 w-5 text-red-500" /></td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Cashier</td>
                        <td className="px-6 py-4 whitespace-nowrap"><XCircle className="h-5 w-5 text-red-500" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><XCircle className="h-5 w-5 text-red-500" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><CheckCircle className="h-5 w-5 text-green-500" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><CheckCircle className="h-5 w-5 text-green-500" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><XCircle className="h-5 w-5 text-red-500" /></td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Tourist</td>
                        <td className="px-6 py-4 whitespace-nowrap"><XCircle className="h-5 w-5 text-red-500" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><XCircle className="h-5 w-5 text-red-500" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><XCircle className="h-5 w-5 text-red-500" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><XCircle className="h-5 w-5 text-red-500" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><XCircle className="h-5 w-5 text-red-500" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleSaveSettings}
                className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
              >
                Save Settings
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      {/* Reset Password Confirmation Modal */}
      {showResetConfirm && resetUserEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Confirm Password Reset</h2>
            <p className="mb-4">Send password reset email to <strong>{resetUserEmail}</strong>?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  setResetUserEmail(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSendResetEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changePasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Change Password for {changePasswordUser.name}</h2>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mb-4 px-3 py-2 border rounded"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setChangePasswordUser(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Manual password change requires backend support and secure handling.');
                  setChangePasswordUser(null);
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Step 1: User Type Selection */}
            {userModalStep === 1 && (
              <>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-amber-600" />
                  Add New User
                </h2>
                <p className="text-gray-600 mb-6">Select the type of user you want to create</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setNewUserType('cashier');
                      setUserModalStep(2);
                    }}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all text-center group"
                  >
                    <CreditCard className="h-8 w-8 text-amber-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-gray-900">Cashier</h3>
                    <p className="text-sm text-gray-500 mt-1">Payment processing and booking management</p>
                  </button>
                  
                  <button
                    onClick={() => {
                      setNewUserType('agency');
                      setUserModalStep(2);
                    }}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-center group"
                  >
                    <Building className="h-8 w-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-gray-900">Agency</h3>
                    <p className="text-sm text-gray-500 mt-1">Tour creation and management</p>
                  </button>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    onClick={resetUserModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Step 2: User Details Form */}
            {userModalStep === 2 && (
              <>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  {newUserType === 'cashier' ? (
                    <CreditCard className="h-5 w-5 text-amber-600" />
                  ) : (
                    <Building className="h-5 w-5 text-purple-600" />
                  )}
                  Create New {newUserType === 'cashier' ? 'Cashier' : 'Agency'}
                </h2>

                <div className="space-y-4">
                  {/* Basic Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newUserData.name}
                      onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={newUserData.phone}
                      onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="+251 9XX XXX XXX"
                    />
                  </div>

                  {/* Agency-specific fields */}
                  {newUserType === 'agency' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          value={newUserData.companyName}
                          onChange={(e) => setNewUserData({ ...newUserData, companyName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Enter company name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Address
                        </label>
                        <input
                          type="text"
                          value={newUserData.address}
                          onChange={(e) => setNewUserData({ ...newUserData, address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Enter business address"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Description
                        </label>
                        <textarea
                          value={newUserData.description}
                          onChange={(e) => setNewUserData({ ...newUserData, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Brief description of the agency..."
                        />
                      </div>
                    </>
                  )}

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-800 font-medium">
                          Password Reset Email
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          A password reset email will be sent to the user so they can set their own secure password.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setUserModalStep(1)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={resetUserModal}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateUser}
                      disabled={!newUserData.name || !newUserData.email || !newUserData.phone || (newUserType === 'agency' && !newUserData.companyName)}
                      className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
    </DashboardLayout>
  );
};