import React, { useState, useEffect } from 'react';
import { 
  Users, Building, Package, TrendingUp, AlertTriangle, CheckCircle, XCircle, 
  MessageSquare, BarChart3, CreditCard, Flag, Settings, Shield, FileText, Bell,
  Star, Edit, Delete, User, Check, Mail, Plus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';

import { 
  collection, onSnapshot, query, orderBy, doc, setDoc, updateDoc, where, getDoc,
  limit, getDocs, deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';

import AdminDashboardAnalytics from '../../components/Analytics/AdminDashboardAnalytics';
import { ReviewManagement } from '../../components/Admin/ReviewManagement';
import { SentimentAnalytics } from '../../components/Analytics/SentimentAnalytics';

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

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
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
  
  const [payments, setPayments] = useState<any[]>([]);
  const [userFilter, setUserFilter] = useState({ role: '', status: '' });
  const [tourFilter, setTourFilter] = useState({ status: '' });
  const [bookingFilter, setBookingFilter] = useState({ status: '' });
  const [disputeFilter, setDisputeFilter] = useState({ status: '' });
  const [systemSettings, setSystemSettings] = useState({
    paymentGateway: 'stripe',
    currency: 'USD',
    notificationLevel: 'high'
  });

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
      await deleteDoc(doc(db, 'reviews', reviewId));
      setReviews(reviews.filter(review => review.id !== reviewId));
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const handleVerifyReview = async (reviewId: string) => {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, { verified: true });
      
      setReviews(reviews.map(review => 
        review.id === reviewId ? { ...review, verified: true } : review
      ));
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

  // Fetch data from Firestore
  useEffect(() => {
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

    // Disputes
    const disputesQuery = query(collection(db, 'disputes'), where('status', '==', 'open'), orderBy('createdAt', 'desc'));
    const disputesUnsubscribe = onSnapshot(disputesQuery, (snapshot) => {
      const disputesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          user: data.user || '',
          booking: data.booking || '',
          reason: data.reason || '',
          status: data.status || 'open',
          createdAt: data.createdAt ? data.createdAt.toDate().toLocaleDateString() : '',
        };
      });
      setDisputes(disputesData);
    }, error => console.error('Failed to fetch disputes:', error));

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

    // Fetch reviews
    fetchReviewsWithAgencyNames();

    return () => {
      usersUnsubscribe();
      toursUnsubscribe();
      bookingsUnsubscribe();
      paymentsUnsubscribe();
      disputesUnsubscribe();
      logsUnsubscribe();
    };
  }, []);

  // Handle functions
  const handleSendResetEmail = async () => {
    if (!resetUserEmail) return;
    try {
      await sendPasswordResetEmail(auth, resetUserEmail);
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
      const userRef = doc(db, 'users', user.id);
      const newStatus = user.status === 'active' ? false : true;
      await updateDoc(userRef, { verified: newStatus });
    } catch (error) {
      console.error("Error updating user status: ", error);
      alert("Failed to update user status.");
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
    } catch (error) {
      console.error("Error updating user role: ", error);
      alert("Failed to update user role.");
    }
  };

  const handleUpdateTourStatus = async (tourId: string, newStatus: string) => {
    try {
      const tourRef = doc(db, 'tours', tourId);
      await updateDoc(tourRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating tour status: ", error);
      alert("Failed to update tour status.");
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating booking status: ", error);
      alert("Failed to update booking status.");
    }
  };

  const handleResolveDispute = async (disputeId: string) => {
    try {
      const disputeRef = doc(db, 'disputes', disputeId);
      await updateDoc(disputeRef, { status: 'resolved' });
    } catch (error) {
      console.error("Error resolving dispute: ", error);
      alert("Failed to resolve dispute.");
    }
  };

  const handleSaveSettings = async () => {
    try {
      const settingsRef = doc(db, 'systemSettings', 'main');
      await setDoc(settingsRef, systemSettings, { merge: true });
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

  const filteredDisputes = disputes.filter(dispute => {
    return disputeFilter.status ? dispute.status === disputeFilter.status : true;
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

  const handleDeleteUser = async (userId: string) => {
    if (!userId) return;
    const confirmed = window.confirm('Are you sure you want to delete this user? This cannot be undone.');
    if (!confirmed) return;
    try {
      const resp = await fetch(`/api/admin/delete-user/${userId}`, {
        method: 'DELETE',
      });
      // Read body ONCE as text, then try to parse JSON
      let data: any = null;
      const bodyText = await resp.text();
      if (bodyText) {
        try {
          data = JSON.parse(bodyText);
        } catch {
          data = { error: bodyText };
        }
      }
      if (!resp.ok) throw new Error((data && data.error) || 'Failed to delete user');
      alert('User deleted successfully');
      // OnSnapshot will refresh users list automatically
    } catch (err: any) {
      console.error('Delete user failed:', err);
      alert(`Failed to delete user: ${err.message || err}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="relative">
            <button className="p-2 rounded-full hover:bg-gray-200">
              <Bell className="h-6 w-6 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
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

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="-mb-px flex space-x-1 md:space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'tours', label: 'Tours', icon: Package },
                { id: 'bookings', label: 'Bookings', icon: CreditCard },
                { id: 'disputes', label: 'Disputes', icon: Flag },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'reviews', label: 'Reviews', icon: MessageSquare },
                { id: 'sentiment', label: 'Sentiment', icon: MessageSquare },
                { id: 'logs', label: 'Audit Logs', icon: FileText },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 md:px-3 border-b-2 font-medium text-xs md:text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-1 md:mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
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
                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-xs text-amber-800">Disputes</p>
                  <div className="mt-2">
                    <p className="text-xl font-bold">{disputes.length}</p>
                    <p className="text-xs text-red-600 mt-1">
                      <span className="font-semibold">{disputes.filter(d => d.status === 'open').length}</span> open
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
                        <div className="flex items-center gap-2">
                          <select 
                            className="border rounded p-1 text-sm capitalize focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                          >
                            <option value="tourist">Tourist</option>
                            <option value="agency">Agency</option>
                            <option value="cashier">Cashier</option>
                            <option value="admin">Admin</option>
                          </select>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'agency' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'cashier' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </div>
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
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
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
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{booking.tourName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <select 
                              className="border rounded p-1 text-sm"
                              value={booking.status}
                              onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirm</option>
                              <option value="cancelled">Cancel</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Dispute Resolution */}
        {activeTab === 'disputes' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4 md:mb-0">Dispute Resolution</h3>
              <div className="flex gap-3">
                <div>
                  <label className="text-xs text-gray-500">Status: </label>
                  <select 
                    className="border rounded p-2 text-sm"
                    value={disputeFilter.status}
                    onChange={(e) => setDisputeFilter({...disputeFilter, status: e.target.value})}
                  >
                    <option value="">All Disputes</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispute ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDisputes.map((dispute) => (
                    <tr key={dispute.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{dispute.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{dispute.user}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{dispute.booking}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 line-clamp-1">{dispute.reason}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dispute.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          dispute.status === 'open' ? 'bg-red-100 text-red-800' :
                          dispute.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {dispute.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => alert('Open chat with user')}
                        >
                          Chat
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900"
                          onClick={() => handleResolveDispute(dispute.id)}
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Reviews Management */}
        {activeTab === 'reviews' && <ReviewsManagementTab />}

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
                      <option value="stripe">Stripe</option>
                      <option value="paypal">PayPal</option>
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
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="GBP">British Pound (GBP)</option>
                      <option value="ETB">Ethiopian Birr (ETB)</option>
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
                        <input type="checkbox" id="dispute" className="mr-2" defaultChecked />
                        <label htmlFor="dispute" className="text-sm text-gray-700">New disputes</label>
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
</div>
  );
};