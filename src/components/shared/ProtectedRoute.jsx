import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from './Icon';

const ProtectedRoute = ({ allowedRoles }) => {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="user" size={24} color="#3b82f6" className="animate-pulse" />
          </div>
        </div>
        <p className="mt-6 text-slate-400 font-medium tracking-wide animate-pulse">
          Validating Secure Session...
        </p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect authorized users to their correct dashboard if they're in the wrong place
    const redirectPath = role === 'admin' ? '/admin' : '/talent';
    
    // Only navigate if we're not already at the destination to avoid infinite loops
    if (window.location.pathname === redirectPath) {
      return <Outlet />;
    }
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
