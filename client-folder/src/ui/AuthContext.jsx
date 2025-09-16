import { createContext, useContext, useState, useEffect } from 'react';
import http from '../helpers/http';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check for existing token on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Set token in http headers
          http.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Get user data from token payload (you might want to decode JWT or call user endpoint)
          const userData = JSON.parse(localStorage.getItem('user_data'));
          if (userData) {
            setUser(userData);
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_data');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await http.post('/users/login', { email, password });

      if (response.data.success) {
        const { access_token, user: userData } = response.data.data;

        // Store token and user data
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user_data', JSON.stringify(userData));

        // Set authorization header
        http.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

        // Update state
        setUser(userData);

        return { success: true };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (fullname, email, password) => {
    try {
      const response = await http.post('/users/register', {
        fullname,
        email,
        password,
      });

      if (response.data.success) {
        const { access_token, user: userData } = response.data.data;

        // Store token and user data
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user_data', JSON.stringify(userData));

        // Set authorization header
        http.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

        // Update state
        setUser(userData);

        return { success: true };
      }
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');

    // Clear authorization header
    delete http.defaults.headers.common['Authorization'];

    // Clear state
    setUser(null);
    setFavorites([]);
  };

  const addToFavorites = (team) => {
    setFavorites((prev) => [...prev, { ...team, id: Date.now() }]);
  };

  const removeFromFavorites = (teamId) => {
    setFavorites((prev) => prev.filter((team) => team.id !== teamId));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        favorites,
        loading,
        login,
        register,
        logout,
        addToFavorites,
        removeFromFavorites,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
