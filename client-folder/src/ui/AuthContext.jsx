import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = belum login, object = sudah login
  const [favorites, setFavorites] = useState([]);

  const login = (userData) => {
    setUser(userData);
    setFavorites([
      { id: 1, name: 'Manchester United', league: 'Premier League', logo: '🔴' },
      { id: 2, name: 'Real Madrid', league: 'La Liga', logo: '⚪' },
      { id: 3, name: 'Bayern Munich', league: 'Bundesliga', logo: '🔵' },
    ]);
  };

  const logout = () => {
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
        login,
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
