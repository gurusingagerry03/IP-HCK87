import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router';
import toast from 'react-hot-toast';
import http from '../helpers/http';
import { useSearchParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClub } from '../store/clubSlice';

export default function Clubs() {
  const [allTeams, setAllTeams] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [addingFavorites, setAddingFavorites] = useState(new Set());
  const [searchParams, setSearchParams] = useSearchParams({
    q: '',
    filter: '',
    sort: 'country',
    pageNumber: 1,
    pageSize: 9,
  });

  const { teams, loading, error, meta } = useSelector((state) => state.clubs);

  const dispatch = useDispatch();

  useEffect(() => {
    const q = searchParams.get('q');
    const filter = searchParams.get('filter');
    const sort = searchParams.get('sort');
    const pageNumber = searchParams.get('pageNumber');
    const pageSize = searchParams.get('pageSize');

    const params = {};
    if (q) params.q = q;
    if (filter) params.filter = filter;
    if (sort) params.sort = sort;
    if (pageSize) params['page[size]'] = pageSize;
    if (pageNumber) params['page[number]'] = pageNumber;

    dispatch(fetchClub(params));
  }, [searchParams]);

  const obj = Object.fromEntries(searchParams.entries());
  const searchRef = useRef(null);

  const scrollToSearch = () => {
    if (!searchRef.current) return;
    const y = searchRef.current.getBoundingClientRect().top + window.pageYOffset - 120;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchAllTeams = async () => {
      try {
        const response = await http.get('/teams');
        setAllTeams(response.data.data || []);
      } catch (error) {
        setAllTeams([]);
        toast.error('Failed to load teams. Please try again.');
      }
    };
    fetchAllTeams();
  }, []);

  // Fetch user's favorites from database
  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setFavorites([]);
        return;
      }

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
      }
    };

    fetchFavorites();
  }, []);

  const handleFavoriteToggle = async (team) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Please login to add favorites');
      return;
    }

    const isCurrentlyFavorite = favorites.some((fav) => fav.Team?.id === team.id);

    try {
      // Add team ID to loading set
      setAddingFavorites((prev) => new Set([...prev, team.id]));

      if (isCurrentlyFavorite) {
        // Remove from favorites
        const favoriteToRemove = favorites.find((fav) => fav.Team?.id === team.id);
        await http({
          method: 'delete',
          url: `/favorites/${favoriteToRemove.id}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setFavorites((prev) => prev.filter((fav) => fav.Team?.id !== team.id));
        toast.success('Team removed from favorites!');
      } else {
        // Add to favorites
        await http({
          method: 'post',
          url: `/favorites/${team.id}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Refetch favorites to get the complete data structure
        const response = await http.get('/favorites', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setFavorites(response.data.data || []);
        }

        toast.success('Team added to favorites!');
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.message ||
        'Failed to update favorites';
      toast.error(errorMessage);
    } finally {
      // Remove team ID from loading set
      setAddingFavorites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(team.id);
        return newSet;
      });
    }
  };

  const countries = [...new Set(allTeams.map((team) => team.country).filter(Boolean))].sort();

  const currentPage = meta.page || 1;
  const totalPages = meta.totalPages || 1;

  const getPaginationRange = () => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const handlePageChange = (page) => {
    const next = Math.max(1, Math.min(page, totalPages));
    setSearchParams({ ...obj, pageNumber: next });
    scrollToSearch();
  };

  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-white mb-6">
            Football{' '}
            <span className="bg-gradient-to-r from-accent via-orange-500 to-red-500 bg-clip-text text-transparent">
              Teams
            </span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Explore football teams from around the world. Add your favorites and discover new teams
            to follow.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div
            ref={searchRef}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 scroll-mt-32"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-3">Search Teams</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, country, or city..."
                    value={searchParams.get('q') ?? ''}
                    onChange={(e) => setSearchParams({ ...obj, q: e.target.value, pageNumber: 1 })}
                    className="w-full px-5 py-4 pl-12 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">🔍</div>
                </div>
              </div>

              <div className="lg:justify-self-end">
                <label className="block text-white/70 text-sm font-medium mb-3">
                  Filter by Country
                </label>
                <select
                  value={searchParams.get('filter') ?? ''}
                  onChange={(e) =>
                    setSearchParams({ ...obj, filter: e.target.value, pageNumber: 1 })
                  }
                  className="w-full lg:w-80 appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                >
                  <option value="" className="bg-gray-800">
                    All Countries
                  </option>
                  {countries.map((country, i) => (
                    <option key={i} value={country} className="bg-gray-800">
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mb-8 flex items-center justify-between">
          <div className="text-white/60">
            Showing <span className="text-accent font-semibold">{teams.length}</span> of{' '}
            <span className="text-accent font-semibold">{meta.total || 0}</span> teams
          </div>
          {totalPages > 1 && (
            <div className="text-white/40 text-sm">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {loading
            ? // Loading state
              Array.from({ length: 9 }).map((_, index) => (
                <div
                  key={index}
                  className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 animate-pulse"
                >
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-white/10"></div>
                  </div>
                  <div className="flex justify-center mb-6">
                    <div className="h-10 w-32 bg-white/10 rounded-xl"></div>
                  </div>
                  <div className="h-8 bg-white/10 rounded mb-2"></div>
                  <div className="h-6 bg-white/10 rounded mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-white/10 rounded"></div>
                    <div className="h-4 bg-white/10 rounded"></div>
                    <div className="h-4 bg-white/10 rounded"></div>
                  </div>
                  <div className="h-12 bg-white/10 rounded-xl mt-6"></div>
                </div>
              ))
            : teams.map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:from-white/15 hover:to-white/10 hover:border-accent/30 transition-all duration-500"
                >
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 border border-white/30 flex items-center justify-center overflow-hidden">
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

                  <div className="flex justify-center mb-6">
                    <button
                      onClick={() => handleFavoriteToggle(team)}
                      disabled={addingFavorites.has(team.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                        favorites.some((fav) => fav.Team?.id === team.id)
                          ? 'bg-red-500 border-red-500 text-white'
                          : 'bg-white/10 border-white/20 text-white/60 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400'
                      }`}
                    >
                      {addingFavorites.has(team.id) ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill={
                            favorites.some((fav) => fav.Team?.id === team.id)
                              ? 'currentColor'
                              : 'none'
                          }
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      )}
                      <span className="font-medium text-sm">
                        {addingFavorites.has(team.id)
                          ? 'Adding...'
                          : favorites.some((fav) => fav.Team?.id === team.id)
                          ? 'Favorited'
                          : 'Add to Favorites'}
                      </span>
                    </button>
                  </div>

                  <h3 className="text-white font-bold text-2xl mb-2 text-center group-hover:text-accent transition-colors duration-300">
                    {team.name}
                  </h3>

                  <div className="flex justify-center mb-4">
                    <div className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-accent/20 to-orange-500/20 border border-accent/30">
                      <span className="text-accent font-medium text-sm">{team.country}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Founded</span>
                      <span className="text-white font-medium">{team.foundedYear || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Stadium</span>
                      <span className="text-white font-medium text-right">
                        {team.stadiumName || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">City</span>
                      <span className="text-white font-medium">{team.stadiumCity || 'N/A'}</span>
                    </div>
                    {team.coach && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Coach</span>
                        <span className="text-white font-medium text-right">{team.coach}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/teams/${team.id}`}
                    className="block w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-accent to-orange-500 text-white font-semibold hover:from-orange-500 hover:to-accent transition-all duration-300 text-center"
                  >
                    View Details
                  </Link>
                </motion.div>
              ))}
        </div>

        {teams.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">⚽</div>
            <h3 className="text-white text-2xl font-bold mb-4">No teams found</h3>
            <p className="text-white/60 mb-8">Try adjusting your search terms or filters</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!meta.hasPrev}
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                {currentPage > 3 && totalPages > 5 && (
                  <>
                    <button
                      onClick={() => handlePageChange(1)}
                      className="w-12 h-12 rounded-xl font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                    >
                      1
                    </button>
                    {currentPage > 4 && <span className="text-white/40 px-2">...</span>}
                  </>
                )}

                {getPaginationRange().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-12 h-12 rounded-xl font-semibold transition-all duration-300 ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-accent to-orange-500 text-white'
                        : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {currentPage < totalPages - 2 && totalPages > 5 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <span className="text-white/40 px-2">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="w-12 h-12 rounded-xl font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!meta.hasNext}
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
