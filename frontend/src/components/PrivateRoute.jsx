import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#030b1e] gap-4">
        <div className="w-14 h-14 rounded-full border-4 border-t-[#00f2ff] border-r-[#38bdf8] border-b-transparent border-l-transparent animate-spin glow-cyan" />
        <p className="text-slate-400 text-xs font-black tracking-widest uppercase animate-pulse">
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
