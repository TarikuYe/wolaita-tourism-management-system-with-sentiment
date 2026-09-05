import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const CashierRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();

  if (!currentUser || currentUser.role !== 'cashier') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};
