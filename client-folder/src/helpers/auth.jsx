import { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';

// Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user_data');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    } catch (error) {
      // Clear invalid data
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setIsLoggedIn(false);
    toast.success('Logged out successfully');
  };

  const isAdmin = () => {
    return isLoggedIn && user?.role === 'admin';
  };

  const getToken = () => {
    return localStorage.getItem('access_token');
  };

  const value = {
    user,
    isLoggedIn,
    loading,
    login,
    logout,
    isAdmin,
    getToken,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protecting routes
export const withAuth = (WrappedComponent, options = {}) => {
  const { requireAdmin = false, redirectTo = '/login' } = options;

  return function AuthenticatedComponent(props) {
    const { isLoggedIn, isAdmin, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!loading) {
        if (!isLoggedIn) {
          toast.error('Please login to access this page');
          navigate(redirectTo);
        } else if (requireAdmin && !isAdmin()) {
          toast.error('Admin access required');
          navigate('/');
        }
      }
    }, [isLoggedIn, loading, navigate]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isLoggedIn || (requireAdmin && !isAdmin())) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

// Component for protecting content
export const ProtectedContent = ({ 
  children, 
  requireAuth = true, 
  requireAdmin = false,
  fallback = null 
}) => {
  const { isLoggedIn, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (requireAuth && !isLoggedIn) {
    return fallback || (
      <div className="text-center py-8">
        <p className="text-white/60 mb-4">Please login to access this content</p>
      </div>
    );
  }

  if (requireAdmin && !isAdmin()) {
    return fallback || (
      <div className="text-center py-8">
        <p className="text-white/60 mb-4">Admin access required</p>
      </div>
    );
  }

  return children;
};

// Utility functions (backward compatibility)
export const getAuthStatus = () => {
  const token = localStorage.getItem('access_token');
  const userData = localStorage.getItem('user_data');

  if (!token || !userData) {
    return { isLoggedIn: false, user: null };
  }

  try {
    const user = JSON.parse(userData);
    return { isLoggedIn: true, user };
  } catch (error) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    return { isLoggedIn: false, user: null };
  }
};

export const isAdminUser = () => {
  const { isLoggedIn, user } = getAuthStatus();
  return isLoggedIn && user?.role === 'admin';
};

export const logoutUser = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_data');
};

export const getToken = () => {
  return localStorage.getItem('access_token');
};

export const getUser = () => {
  const { user } = getAuthStatus();
  return user;
};