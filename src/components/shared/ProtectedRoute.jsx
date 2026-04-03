import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isReady, isAuthenticated, profile, profileError, signOut } = useAuth();

  if (!isReady) {
    return (
      <div className="hero-bg min-h-screen flex items-center justify-center">
        <div className="text-blue-400 font-bold animate-pulse text-xs tracking-widest uppercase">
          Initializing System...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Trap specifically for Database/Network failures, not just empty profiles
  if (isAuthenticated && profileError) {
    return (
      <div className="hero-bg min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-slate-800/60 backdrop-blur-xl border border-white/[.07] rounded-2xl p-8 max-w-sm shadow-2xl">
          <div className="text-red-400 mb-4 flex justify-center">
             <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-white font-700 text-lg mb-2">System Sync Failed</h2>
          <p className="text-slate-400 text-sm mb-6">Your authentication was successful, but we could not securely load your account permissions.</p>
          <div className="space-y-3">
            <button onClick={() => window.location.reload()} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all text-sm font-700">
              Try Again
            </button>
            <button onClick={signOut} className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all text-sm font-600">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
