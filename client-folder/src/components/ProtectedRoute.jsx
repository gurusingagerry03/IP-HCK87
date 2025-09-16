import { useAuth } from '../ui/AuthContext';
import { Navigate, useLocation } from 'react-router';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    // Redirect to login with the current location as state
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}