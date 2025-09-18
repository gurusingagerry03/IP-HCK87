import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router';
import toast from 'react-hot-toast';
import { useAuth } from '../helpers/auth.jsx';
import http from '../helpers/http';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [filterBy, setFilterBy] = useState('all');
  const [loading, setLoading] = useState(true);
  const { isLoggedIn, getToken } = useAuth();

  // Load favorites from database on component mount
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isLoggedIn) {
        setFavorites([]);
        setLoading(false);
        return;
      }
      
      const token = getToken();

      try {
        const response = await http.get('/favorites', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setFavorites(response.data.data || []);
        }
      } catch (error) {
        // Silent error - user might not be logged in
        setFavorites([]);
        if (error.response?.status === 401) {
          toast.error('Please login to view your favorites');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const removeFavorite = async (favoriteId) => {
    if (!isLoggedIn) {
      toast.error('Please login to remove favorites');
      return;
    }
    
    const token = getToken();

    try {
      await http({
        method: 'delete',
        url: `/favorites/${favoriteId}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFavorites((prev) => prev.filter((fav) => fav.id !== favoriteId));
      toast.success('Team removed from favorites!');
    } catch (error) {
      toast.error('Failed to remove favorite. Please try again.');
    }
  };

  const clearAllFavorites = async () => {
    if (!isLoggedIn) {
      toast.error('Please login to clear favorites');
      return;
    }
    
    const token = getToken();

    try {
      // Delete all favorites for the user
      const deletePromises = favorites.map((fav) =>
        http({
          method: 'delete',
          url: `/favorites/${fav.id}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      await Promise.all(deletePromises);
      setFavorites([]);
      toast.success('All favorites cleared!');
    } catch (error) {
      toast.error('Failed to clear favorites. Please try again.');
    }
  };

  const filteredFavorites = useMemo(() => {
    let filtered = favorites.filter((favorite) => {
      const team = favorite.Team;
      if (!team) return false;

      if (filterBy === 'all') return true;
      return team.country === filterBy;
    });

    return filtered;
  }, [favorites, filterBy]);

  const countries = [
    ...new Set(favorites.map((favorite) => favorite.Team?.country).filter(Boolean)),
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  // Check if user is logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center py-20"
          >
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-blue-400"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            </div>

            <h3 className="text-white text-3xl font-bold mb-4">Login Required</h3>
            <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">
              Please login to view and manage your favorite teams.
            </p>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-accent to-orange-500 text-white font-semibold hover:from-orange-500 hover:to-accent transition-all duration-300 hover:scale-105"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10,17 15,12 10,7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Login Now
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-white mb-6">
            My{' '}
            <span className="bg-gradient-to-r from-red-500 via-pink-500 to-red-600 bg-clip-text text-transparent">
              Favorites
            </span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Your personally curated collection of football clubs. Manage and explore your favorite
            teams.
          </p>
        </motion.div>

        {favorites.length > 0 ? (
          <>
            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12 bg-gradient-to-r from-red-500/10 to-pink-500/10 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8"
            >
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-3">{favorites.length}</div>
                <div className="text-white/60 text-lg">Favorite Clubs</div>
              </div>
            </motion.div>

            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-12"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
                  {/* Filter by League */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      Filter by Country
                    </label>
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value)}
                      className="appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer min-w-[200px]"
                    >
                      <option value="all" className="bg-gray-800">
                        All Countries
                      </option>
                      {countries.map((country) => (
                        <option key={country} value={country} className="bg-gray-800">
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clear All Button */}
                  <button
                    onClick={clearAllFavorites}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all duration-300"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 6h18l-2 13H5L3 6z"></path>
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Results Info */}
            <div className="mb-8">
              <div className="text-white/60">
                Showing{' '}
                <span className="text-red-400 font-semibold">{filteredFavorites.length}</span> of{' '}
                <span className="text-red-400 font-semibold">{favorites.length}</span> favorite
                clubs
                {filterBy !== 'all' && (
                  <span>
                    {' '}
                    in <span className="text-white">{filterBy}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Favorites Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {filteredFavorites.map((favorite, index) => {
                const team = favorite.Team;
                if (!team) return null;

                return (
                  <motion.div
                    key={favorite.id}
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:from-red-500/10 hover:to-pink-500/10 hover:border-red-500/30 transition-all duration-500"
                  >
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFavorite(favorite.id)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="mx-auto"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>

                    {/* Favorite Badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="none"
                        className="text-red-400"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      <span className="text-red-400 text-xs font-medium">Favorite</span>
                    </div>

                    {/* Club Content */}
                    <div className="mt-8">
                      {/* Club Logo */}
                      <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 border border-white/30 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                          {team.logoUrl ? (
                            <img
                              src={team.logoUrl}
                              alt={`${team.name} logo`}
                              className="w-16 h-16 object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="w-full h-full flex items-center justify-center text-2xl"
                            style={{ display: team.logoUrl ? 'none' : 'flex' }}
                          >
                            ⚽
                          </div>
                        </div>
                      </div>

                      {/* Club Name */}
                      <h3 className="text-white font-bold text-xl mb-2 text-center group-hover:text-red-400 transition-colors duration-300">
                        {team.name}
                      </h3>

                      {/* League Badge */}
                      <div className="flex justify-center mb-4">
                        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-accent/20 to-orange-500/20 border border-accent/30">
                          <span className="text-accent font-medium text-sm">{team.country}</span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Stadium</span>
                          <span className="text-white font-medium">
                            {team.stadiumName || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Founded</span>
                          <span className="text-white font-medium">
                            {team.foundedYear || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">City</span>
                          <span className="text-white font-medium">
                            {team.stadiumCity || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-6">
                        <Link
                          to={`/teams/${team.id}`}
                          className="w-full block py-2 text-center rounded-xl bg-gradient-to-r from-accent to-orange-500 text-white font-medium hover:from-orange-500 hover:to-accent transition-all duration-300 text-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* No filtered results */}
            {favorites.length > 0 && filteredFavorites.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-white text-xl font-bold mb-2">No clubs found</h3>
                <p className="text-white/60 mb-6">No favorites match your current filter</p>
                <button
                  onClick={() => setFilterBy('all')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold hover:from-pink-500 hover:to-red-500 transition-all duration-300"
                >
                  Show All Favorites
                </button>
              </motion.div>
            )}
          </>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-20"
          >
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 flex items-center justify-center">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-red-400"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>

            <h3 className="text-white text-3xl font-bold mb-4">No Favorites Yet</h3>
            <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">
              Start building your collection by adding clubs to your favorites from the clubs page.
            </p>

            <Link
              to="/clubs"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-accent to-orange-500 text-white font-semibold hover:from-orange-500 hover:to-accent transition-all duration-300 hover:scale-105"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              Explore Clubs
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
