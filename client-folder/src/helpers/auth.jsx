// Helper functions for authentication

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
    // If parsing fails, clear invalid data
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    return { isLoggedIn: false, user: null };
  }
};

export const isAdmin = () => {
  const { isLoggedIn, user } = getAuthStatus();
  return isLoggedIn && user?.role === 'admin';
};

export const logout = () => {
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

// New helper functions for consistent auth handling
export const setAuthData = (token, userData) => {
  localStorage.setItem('access_token', token);
  localStorage.setItem('user_data', JSON.stringify(userData));
};

export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const isLoggedIn = () => {
  return getAuthStatus().isLoggedIn;
};

// Helper to clear auth data and redirect if needed
export const clearAuthAndRedirect = (navigate = null, redirectPath = '/login') => {
  logout();
  if (navigate) {
    navigate(redirectPath);
  }
};