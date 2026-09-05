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
import { ContactForm } from './components/ContactForm';
import { Users, Heart, Shield, Globe, Award } from 'lucide-react';

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

const AnimatedCounter: React.FC<{ from: number; to: number; duration: number }> = ({ from, to, duration }) => {
  const [count, setCount] = React.useState(from);

  React.useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      setCount(Math.floor(from + progress * (to - from)));
      if (progress === 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [from, to, duration]);
  
  return <span>{count.toLocaleString()}</span>;
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
            <Route path="/about" element={
              <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                  {/* Header Section */}
                  <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    {t('about.title')}
                  </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    {t('about.description')}
                  </p>
                  </div>

                  {/* Mission Section */}
                  <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 mb-8">
                    <div className="max-w-4xl mx-auto">
                      <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                      {t('about.missionTitle')}
                    </h2>
                      <p className="text-lg text-gray-700 leading-relaxed text-center">
                      {t('about.missionText')}
                    </p>
                    </div>
                  </div>

                  {/* Why Choose Us Section */}
                  <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                      {t('about.whyChooseUsTitle')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(t('about.whyChooseUsItems') as string[]).map((item, index) => {
                        const icons = [
                          <Users className="h-8 w-8" key="users" />,
                          <Heart className="h-8 w-8" key="heart" />,
                          <Award className="h-8 w-8" key="award" />,
                          <Globe className="h-8 w-8" key="globe" />,
                          <Shield className="h-8 w-8" key="shield" />,
                        ];
                        const iconBgColors = [
                          'bg-amber-100 text-amber-700',
                          'bg-red-100 text-red-700',
                          'bg-blue-100 text-blue-700',
                          'bg-green-100 text-green-700',
                          'bg-purple-100 text-purple-700',
                        ];
                        return (
                          <div
                            key={index}
                            className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-2xl hover:border-amber-300 transition-all duration-300 hover:-translate-y-2"
                          >
                            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 ${iconBgColors[index] || iconBgColors[0]} shadow-sm`}>
                              {icons[index] || icons[0]}
                            </div>
                            <p className="text-gray-700 leading-relaxed font-medium">
                              {item}
                            </p>
                            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500 opacity-0 group-hover:opacity-5 rounded-bl-full transition-opacity duration-300"></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tourism Statistics Section */}
                  <div className="bg-white rounded-xl shadow-lg p-8 md:p-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                      {t('about.tourismTitle')}
                    </h2>

                    {/* Summary Cards / Animated Counters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-700 mb-3">
                          {t('about.totalTourists')}
                        </p>
                          <p className="text-4xl font-bold text-amber-800">
                          <AnimatedCounter from={0} to={580 + 890 + 1060 + 1250 + 1380} duration={2} />+
                        </p>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-700 mb-3">
                          {t('about.foreignTourists')}
                        </p>
                          <p className="text-4xl font-bold text-blue-800">
                          <AnimatedCounter from={0} to={120 + 240 + 300 + 380 + 400} duration={2} />+
                        </p>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-100 to-green-200 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-700 mb-3">
                          {t('about.localTourists')}
                        </p>
                          <p className="text-4xl font-bold text-green-800">
                          <AnimatedCounter from={0} to={460 + 650 + 760 + 870 + 980} duration={2} />+
                        </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            } />

            {/* Contact Page */}
            <Route path="/contact" element={
              <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                      {t('contact.title')}
                    </h1>
                    <p className="text-xl text-gray-600">
                      {t('contact.subtitle')}
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <ContactForm />
                    <div className="bg-white rounded-lg shadow-lg p-8">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                        {t('contact.infoTitle')}
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {t('contact.addressLabel')}
                          </h3>
                          <p className="text-gray-600">Sodo, Wolaita Zone, Ethiopia</p>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {t('contact.phoneLabel')}
                          </h3>
                          <p className="text-gray-600">+251 465 510 615</p>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {t('contact.emailLabel')}
                          </h3>
                          <p className="text-gray-600">tarikunegesa19@gmail.com</p>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {t('contact.hoursLabel')}
                          </h3>
                          <p className="text-gray-600">
                            {t('contact.hours.weekdays')}<br />
                            {t('contact.hours.saturday')}<br />
                            {t('contact.hours.sunday')}
                          </p>
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
                            {t('contact.safetyTitle')}
                          </h2>
                          <div className="space-y-4 text-gray-600">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {t('contact.emergency.police')}
                              </h3>
                              <p>{t('contact.emergency.phoneLabel')}: +251 465 510 146</p>
                              <p>{t('contact.emergency.locationLabel')}: {t('contact.emergency.policeLocation')}</p>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {t('contact.emergency.hospital')}
                              </h3>
                              <p>{t('contact.emergency.phoneLabel')}: +251 461 801 573</p>
                              <p>{t('contact.emergency.locationLabel')}: {t('contact.emergency.hospitalLocation')}</p>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {t('contact.emergency.clinic')}
                              </h3>
                              <p>{t('contact.emergency.phoneLabel')}: +251 465 510 107</p>
                              <p>{t('contact.emergency.locationLabel')}: {t('contact.emergency.clinicLocation')}</p>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {t('contact.emergency.redcross')}
                              </h3>
                              <p>{t('contact.emergency.phoneLabel')}: 952 (Toll-Free)</p>
                              <p>{t('contact.emergency.serviceLabel')}: {t('contact.emergency.redcrossService')}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            } />

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