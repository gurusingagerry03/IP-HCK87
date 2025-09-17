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
