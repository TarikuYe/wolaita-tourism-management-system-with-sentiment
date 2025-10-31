import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TouristDashboard } from './TouristDashboard';
import { AgencyDashboard } from './AgencyDashboard';
import { AdminDashboard } from './AdminDashboard';
import CashierDashboard from './CashierDashboard';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">Please log in to access your dashboard.</p>
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Invalid Role</h2>
            <p className="text-gray-600">Your account role is not recognized.</p>
          </div>
        </div>
      );
  }
};
