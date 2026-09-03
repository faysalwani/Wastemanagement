import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading, getDashboardRoute } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role || 'CITIZEN';
    const isDirectMatch = allowedRoles.includes(userRole);
    // Hierarchy: SUPER_ADMIN has access to ADMIN screens
    const isSuperAdminInherited = userRole === 'SUPER_ADMIN' && allowedRoles.includes('ADMIN');

    if (!isDirectMatch && !isSuperAdminInherited) {
      const myDashboard = getDashboardRoute(user);
      return (
        <div className="max-w-md mx-auto my-20 p-8 bg-white border border-rose-200 rounded-3xl shadow-xl text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-600">
            Your account role (<span className="font-bold text-rose-600">{userRole}</span>) is not authorized to access this panel.
          </p>
          <div className="pt-2">
            <Link
              to={myDashboard}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Go to My Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      );
    }
  }

  return children;
}
