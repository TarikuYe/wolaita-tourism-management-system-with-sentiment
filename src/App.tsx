import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { Navbar } from './components/Layout/Navbar';
import { Footer } from './components/Layout/Footer';
import { Home } from './pages/Home';
import { Tours } from './pages/Tours';
import { Festivals } from './pages/Festivals';
import FestivalDetail from './pages/FestivalDetail';
import { Login } from './pages/Auth/Login';
import { AdminLogin } from './pages/Auth/AdminLogin';
import { Register } from './pages/Auth/Register';
import { NotFound } from './pages/NotFound';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { PaymentSuccess } from './pages/Payment/PaymentSuccess';
import { PaymentCallback } from './pages/Payment/PaymentCallback';
import ExploreWolaita from './pages/ExploreWolaita'; 
import Hotel from './pages/Hotel';
import FoodDrinks from './pages/Culture/FoodDrinks';
import Clothes from './pages/Culture/Clothes';
import Dances from './pages/Culture/Dances';
import Cottages from './pages/Culture/Cottages';
import CashierDashboard from './pages/Dashboard/CashierDashboard';
import { CashierRoute } from './components/ProtectedRoute';
import { AgencyDashboard } from './pages/Dashboard/AgencyDashboard';
import { TouristDashboard } from './pages/Dashboard/TouristDashboard';
import { FavoritesPage } from './pages/FavoritesPage';
import { TourDetail } from './pages/TourDetail';
import TouristProfile from './pages/Profile/TouristProfile';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { VerifyEmail } from './pages/Auth/VerifyEmail';
import { About } from './pages/About';
import { Contact } from './pages/Contact';

// Improved ProtectedRoute with better loading state
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  allowedRoles?: string[] 
}> = ({ children, allowedRoles = [] }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your experience...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    // Redirect to appropriate dashboard based on user role
    const destination =
      currentUser.role === 'admin'
        ? '/dashboard'
        : currentUser.role === 'agency'
        ? '/agency'
        : currentUser.role === 'cashier'
        ? '/cashier'
        : '/tourist';
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
};

// Improved PublicRoute to redirect authenticated users away from auth pages
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, redirect to appropriate dashboard
  // Admin, Agency, and Cashier must go to their dashboards
  // Tourists can access public pages
  if (currentUser) {
    if (currentUser.role === 'admin' || currentUser.role === 'agency' || currentUser.role === 'cashier') {
    const destination =
      currentUser.role === 'admin'
        ? '/dashboard'
        : currentUser.role === 'agency'
        ? '/agency'
          : '/cashier';
    return <Navigate to={destination} replace />;
    }
    // Tourists can stay on auth pages if they want, but typically redirect to home
    // For now, let them access auth pages if they're already logged in (they might want to switch accounts)
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const { currentUser, loading } = useAuth();

  // Hide navbar and footer for admin, agency, and cashier dashboards, and admin login portal
  const isAdminLoginRoute = location.pathname.startsWith('/tourAdminsodo/login');
  const isDashboardRoute = location.pathname.startsWith('/dashboard') || 
                          location.pathname.startsWith('/cashier') || 
                          location.pathname.startsWith('/agency') ||
                          location.pathname.startsWith('/tourist');
  
  // Check if current user is admin, agency, or cashier on dashboard route, or on admin login
  const shouldHideNavbarFooter = isAdminLoginRoute || (isDashboardRoute && 
    currentUser && 
    (currentUser.role === 'admin' || currentUser.role === 'agency' || currentUser.role === 'cashier'));

  // Show loading screen while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Force Admin, Agency, and Cashier users to stay on their dashboards
  // Redirect them away from public pages (home, tours, festivals, etc.)
  if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'agency' || currentUser.role === 'cashier')) {
    const privilegedUserRoutes = [
      '/dashboard', 
      '/agency', 
      '/cashier', 
      '/login', 
      '/tourAdminsodo/login',
      '/register', 
      '/forgot-password'
      // Only allow dashboard and auth routes - no public pages
    ];
    const isOnPrivilegedRoute = privilegedUserRoutes.some(route => location.pathname.startsWith(route));
    
    if (!isOnPrivilegedRoute) {
      const destination =
        currentUser.role === 'admin'
          ? '/dashboard'
          : currentUser.role === 'agency'
          ? '/agency'
          : '/cashier';
      return <Navigate to={destination} replace />;
    }
  }

  return (
    <>
      {!shouldHideNavbarFooter && <Navbar />}
      <main className={shouldHideNavbarFooter ? '' : ''}>
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/tours" element={<Tours />} />
            <Route path="/festivals" element={<Festivals />} />
            <Route path="/festivals/:id" element={<FestivalDetail />} />
            <Route path="/tours/:id" element={<TourDetail />} />
            <Route path="/hotel" element={<Hotel />} />
            <Route path="/explore-wolaita" element={<ExploreWolaita />} />
            <Route path="/culture/food-drinks" element={<FoodDrinks />} />
            <Route path="/culture/clothes" element={<Clothes />} />
            <Route path="/culture/dances" element={<Dances />} />
            <Route path="/culture/cottages" element={<Cottages />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            
            {/* Secret Dedicated Admin Login Route */}
            <Route path="/tourAdminsodo/login" element={<AdminLogin />} />

            {/* Public Auth Routes - Redirect if already authenticated */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <TouristProfile />
              </ProtectedRoute>
            } />
            <Route path="/cashier" element={
              <CashierRoute>
                <CashierDashboard />
              </CashierRoute>
            } />
            <Route path="/agency" element={
              <ProtectedRoute allowedRoles={['agency']}>
                <AgencyDashboard />
              </ProtectedRoute>
            } />
            <Route path="/tourist" element={
              <ProtectedRoute>
                <TouristDashboard />
              </ProtectedRoute>
            } />

            {/* Payment Routes */}
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/callback" element={<PaymentCallback />} />

            {/* About Page */}
            <Route path="/about" element={<About />} />

            {/* Contact Page */}
            <Route path="/contact" element={<Contact />} />

            {/* Fallback 404 route for unknown routes including /admin/login */}
            <Route path="*" element={<NotFound />} />
          </Routes>
      </main>
      {!shouldHideNavbarFooter && <Footer />}
    </>
  );
};

const AppContentWrapper: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContentWrapper />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;