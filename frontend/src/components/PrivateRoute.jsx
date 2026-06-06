import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Protects a route. Redirects to /login if not authenticated.
 * Optionally restricts to admin users with requireAdmin prop.
 */
export default function PrivateRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  // While verifying session, show a full-screen spinner to avoid flash
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary gap-4">
        <div className="w-14 h-14 rounded-full border-4 border-t-accent-red border-r-accent-purple border-b-transparent border-l-transparent animate-spin" />
        <p className="text-slate-400 text-sm font-semibold tracking-wider animate-pulse">
          Verificando sesión...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
