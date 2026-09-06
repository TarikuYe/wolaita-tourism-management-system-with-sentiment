import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TouristDashboard } from './TouristDashboard';
import { AgencyDashboard } from './AgencyDashboard';
import { AdminDashboard } from './AdminDashboard';
import CashierDashboard from './CashierDashboard';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-10 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Access Denied</h2>
          <p className="text-slate-600 text-sm">Please log in to access your personalized dashboard.</p>
          <div className="pt-2">
            <Link
              to="/login"
              className="w-full inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-xs text-sm"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  switch (currentUser.role) {
    case 'tourist':
      return <TouristDashboard />;
    case 'agency':
      return <AgencyDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'cashier':
      return <CashierDashboard />;
    default:
      return (
        <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-10 max-w-md w-full text-center space-y-4">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Invalid Role</h2>
            <p className="text-slate-600 text-sm">Your account role is not recognized by the system.</p>
            <Link
              to="/"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all"
            >
              Return Home
            </Link>
          </div>
        </div>
      );
  }
};

export default Dashboard;
