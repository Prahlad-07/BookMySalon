import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessSalonOwnerRoute, getDashboardPathByRole } from '../utils/roleRouting';

export default function SalonOwnerRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessSalonOwnerRoute(user.role)) {
    return <Navigate to={getDashboardPathByRole(user.role)} replace />;
  }

  return children;
}
