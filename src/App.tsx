import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
//import { Toaster } from 'react-hot-toast';
import toast, { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { Navbar } from './components/Layout/Navbar';
import { Footer } from './components/Layout/Footer';
import { Home } from './pages/Home';
import { Tours } from './pages/Tours';
import { Festivals } from './pages/Festivals';
import FestivalDetail from './pages/FestivalDetail';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Improved ProtectedRoute with better loading state
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
};

// Improved PublicRoute to redirect authenticated users away from auth pages
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return currentUser ? <Navigate to="/dashboard" replace /> : <>{children}</>;
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
  const tourismStats = [
    { year: 2020, total: 580, foreign: 120, local: 460 },
    { year: 2021, total: 890, foreign: 240, local: 650 },
    { year: 2022, total: 1060, foreign: 300, local: 760 },
    { year: 2023, total: 1250, foreign: 380, local: 870 },
    { year: 2024, total: 1380, foreign: 400, local: 980 },
    { year: 2025, total: 0, foreign: 0, local: 0 }
  ];

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/tours" element={<Tours />} />
            <Route path="/festivals" element={<Festivals />} />
            <Route path="/festivals/:id" element={<FestivalDetail />} />
            <Route path="/tour/:id" element={<TourDetail />} />
            <Route path="/hotel" element={<Hotel />} />
            <Route path="/explore-wolaita" element={<ExploreWolaita />} />
            <Route path="/culture/food-drinks" element={<FoodDrinks />} />
            <Route path="/culture/clothes" element={<Clothes />} />
            <Route path="/culture/dances" element={<Dances />} />
            <Route path="/culture/cottages" element={<Cottages />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            {/* Auth Routes - Redirect if already authenticated */}
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-8">
                    {t('about.title')}
                  </h1>
                  <p className="text-xl text-gray-600 mb-8">
                    {t('about.description')}
                  </p>
                  <div className="bg-white rounded-lg shadow-lg p-8 text-left">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                      {t('about.missionTitle')}
                    </h2>
                    <p className="text-gray-700 mb-6">
                      {t('about.missionText')}
                    </p>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                      {t('about.whyChooseUsTitle')}
                    </h2>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      {(t('about.whyChooseUsItems') as string[]).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Tourism Statistics Section */}
                  <div className="bg-white rounded-lg shadow-lg p-8 text-left mt-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                      {t('about.tourismTitle')}
                    </h2>

                    {/* Summary Cards / Animated Counters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
                      <div className="bg-amber-100 p-6 rounded-lg shadow">
                        <p className="text-lg font-medium text-gray-700">
                          {t('about.totalTourists')}
                        </p>
                        <p className="text-3xl font-bold text-amber-700 mt-2">
                          <AnimatedCounter from={0} to={tourismStats.reduce((sum, stat) => sum + stat.total, 0)} duration={2} />+
                        </p>
                      </div>
                      <div className="bg-blue-100 p-6 rounded-lg shadow">
                        <p className="text-lg font-medium text-gray-700">
                          {t('about.foreignTourists')}
                        </p>
                        <p className="text-3xl font-bold text-blue-700 mt-2">
                          <AnimatedCounter from={0} to={tourismStats.reduce((sum, stat) => sum + stat.foreign, 0)} duration={2} />+
                        </p>
                      </div>
                      <div className="bg-green-100 p-6 rounded-lg shadow">
                        <p className="text-lg font-medium text-gray-700">
                          {t('about.localTourists')}
                        </p>
                        <p className="text-3xl font-bold text-green-700 mt-2">
                          <AnimatedCounter from={0} to={tourismStats.reduce((sum, stat) => sum + stat.local, 0)} duration={2} />+
                        </p>
                      </div>
                    </div>

                    {/* Tourism Statistics Chart */}
                    <div className="mb-8">
                      <Bar
                        data={{
                          labels: tourismStats.map(stat => stat.year),
                          datasets: [
                            {
                              label: t('about.foreignTourists') as string,
                              data: tourismStats.map(stat => stat.foreign),
                              backgroundColor: 'rgba(59, 130, 246, 0.8)',
                            },
                            {
                              label: t('about.localTourists') as string,
                              data: tourismStats.map(stat => stat.local),
                              backgroundColor: 'rgba(34, 197, 94, 0.8)',
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { position: 'top' },
                            title: { 
                              display: true, 
                              text: t('about.chartTitle') 
                            },
                          },
                        }}
                      />
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
                    <div className="bg-white rounded-lg shadow-lg p-8">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                        {t('contact.formTitle')}
                      </h2>
                      <form className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('contact.nameLabel')}
                          </label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('contact.emailLabel')}
                          </label>
                          <input 
                            type="email" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('contact.messageLabel')}
                          </label>
                          <textarea 
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                        >
                          {t('contact.sendButton')}
                        </button>
                      </form>
                    </div>
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
                          <p className="text-gray-600">info@wolaitatours.com</p>
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

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
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
      </div>
    </Router>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
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
