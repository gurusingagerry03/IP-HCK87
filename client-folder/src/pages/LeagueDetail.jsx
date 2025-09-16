import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import http from '../helpers/http';
import LeagueTable from '../components/LeagueTable';

export default function LeagueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [league, setLeague] = useState(null);
  const [activeTab, setActiveTab] = useState('fixtures');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [isTabsSticky, setIsTabsSticky] = useState(false);

  // Search params for filtering and pagination
  const [searchParams, setSearchParams] = useSearchParams({
    status: 'all',
    date: '',
    pageNumber: 1,
    pageSize: 10,
  });

  const obj = Object.fromEntries(searchParams.entries());

  // Match data
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchMeta, setMatchMeta] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false,
  });

  const headerRef = useRef(null);
  const tabsRef = useRef(null);

  // Simple fade variant
  const fade = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch league data and initial matches
  useEffect(() => {
    const fetchLeague = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch league data
        const leagueResponse = await http.get(`/leagues/${id}`);
        if (leagueResponse.data.success) {
          setLeague(leagueResponse.data.data);
        }
      } catch (err) {
        console.error('Error fetching league data:', err);
        setError('Failed to load league data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeague();
  }, [id]);

  // Fetch matches when search params change
  useEffect(() => {
    if (!id) return;
    fetchMatches();
  }, [id, searchParams]);

  // Fetch matches with filters and pagination
  const fetchMatches = async () => {
    setMatchesLoading(true);

    try {
      const status = searchParams.get('status');
      const date = searchParams.get('date');
      const pageNumber = searchParams.get('pageNumber');
      const pageSize = searchParams.get('pageSize');

      const params = {};

      // Add pagination
      if (pageSize) params['page[size]'] = pageSize;
      if (pageNumber) params['page[number]'] = pageNumber;

      // Add filters
      if (status && status !== 'all') {
        params['status'] = status;
      }

      if (date) {
        // Send date in MM/DD/YYYY format to server
        // Server will handle the conversion
        params['date'] = date;
      }

      const response = await http.get(`/matches/league/${id}`, { params });

      if (response.data.success) {
        setMatches(response.data.data);
        setMatchMeta(response.data.meta);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
      setMatches([]);
      setMatchMeta({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNext: false,
        hasPrev: false,
      });
    } finally {
      setMatchesLoading(false);
    }
  };

  // Handle scroll for sticky elements
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        setIsHeaderSticky(rect.top <= 0);
      }
      if (tabsRef.current) {
        const rect = tabsRef.current.getBoundingClientRect();
        setIsTabsSticky(rect.top <= 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pagination helper functions
  const currentPage = matchMeta.currentPage || 1;
  const totalPages = matchMeta.totalPages || 1;

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
  };

  // Date format helper functions
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // Convert YYYY-MM-DD to MM/DD/YYYY for input
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  const formatDateFromInput = (inputDate) => {
    if (!inputDate) return '';
    // Keep MM/DD/YYYY format for URL params
    return inputDate;
  };

  // Updated formatDateTime function to show year and time separately
  const formatDateTime = (date, time) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric', // Added year
    });
    return { dateStr, time: time || '' };
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'finished':
        return 'bg-gray-600 text-gray-200';
      case '':
      case 'upcoming':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-600 text-gray-200';
    }
  };

  const formatMatchScore = (match) => {
    if (match.status === 'finished' && match.home_score !== null && match.away_score !== null) {
      return `${match.home_score} - ${match.away_score}`;
    }
    return 'VS';
  };

  const getDisplayStatus = (status) => {
    if (status === 'finished') return 'FT';
    if (status === '' || status === null) return 'Upcoming';
    return status;
  };

  // ---- Loading / Error ----
  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111]">
        <div className="p-4">
          <div className="w-20 h-10 bg-white/10 rounded-xl animate-pulse"></div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 bg-white/10 rounded-2xl"></div>
                <div>
                  <div className="h-8 w-48 bg-white/10 rounded mb-2"></div>
                  <div className="h-4 w-32 bg-white/10 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <motion.div
          variants={fade}
          initial="hidden"
          animate="show"
          className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-md mx-4"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-4">League Not Found</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-300"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-accent to-orange-500 text-white font-semibold rounded-2xl hover:from-orange-500 hover:to-accent transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---- Main ----
  return (
    <div className="min-h-screen">
      {/* Back Button bar */}
      <div className="p-4 bg-[#111111] top-0 z-50">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-[#111111]/70 hover:bg-[#111111]/60 border border-white/10 rounded-xl text-white transition-all duration-300"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Header (black) */}
      <div
        ref={headerRef}
        className={`px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300 bg-[#111111] ${
          isHeaderSticky ? 'sticky top-0 z-40' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center overflow-hidden">
              {league?.logoUrl ? (
                <img
                  src={league.logoUrl}
                  alt={`${league.name} logo`}
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <span className="text-3xl" style={{ display: league?.logoUrl ? 'none' : 'flex' }}>
                ⚽
              </span>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2">
                {league?.name}
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-lg text-white/70">📍 {league?.country}</span>
                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-accent/20 to-orange-500/20 border border-accent/30">
                  <span className="text-accent font-medium text-sm">Season 2025/26</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* soft white gradient under header */}
      <div className="h-6 bg-gradient-to-b from-white/10 to-transparent" />

      {/* Tabs — transparent */}
      <div
        ref={tabsRef}
        className="px-4 sm:px-6 lg:px-8 py-4 transition-all duration-300 bg-transparent"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="rounded-2xl p-2 flex gap-2 border border-white/10 bg-white/5 backdrop-blur-sm">
              {['table', 'fixtures'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 capitalize ${
                    activeTab === tab
                      ? 'bg-accent text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab === 'fixtures' ? 'Fixtures & Results' : 'Table'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'fixtures' && (
              <motion.div key="fixtures" variants={fade} initial="hidden" animate="show">
                {/* Filter Bar */}
                <motion.div
                  variants={fade}
                  initial="hidden"
                  animate="show"
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">
                        Filter by Date
                      </label>
                      <input
                        type="date"
                        value={
                          searchParams.get('date')
                            ? (() => {
                                // Convert MM/DD/YYYY to YYYY-MM-DD for date input
                                const dateStr = searchParams.get('date');
                                const [month, day, year] = dateStr.split('/');
                                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                              })()
                            : ''
                        }
                        onChange={(e) => {
                          if (e.target.value) {
                            // Convert YYYY-MM-DD to MM/DD/YYYY for URL params
                            const [year, month, day] = e.target.value.split('-');
                            const formattedDate = `${month}/${day}/${year}`;
                            setSearchParams({ ...obj, date: formattedDate, pageNumber: 1 });
                          } else {
                            setSearchParams({ ...obj, date: '', pageNumber: 1 });
                          }
                        }}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Status</label>
                      <select
                        value={searchParams.get('status') ?? 'all'}
                        onChange={(e) =>
                          setSearchParams({ ...obj, status: e.target.value, pageNumber: 1 })
                        }
                        className="w-full appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer text-sm"
                      >
                        <option value="all" className="bg-gray-800">
                          All
                        </option>
                        <option value="upcoming" className="bg-gray-800">
                          Upcoming
                        </option>
                        <option value="finished" className="bg-gray-800">
                          Finished
                        </option>
                      </select>
                    </div>
                  </div>

                  {(searchParams.get('date') || searchParams.get('status') !== 'all') && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <button
                        onClick={() =>
                          setSearchParams({ status: 'all', date: '', pageNumber: 1, pageSize: 10 })
                        }
                        className="text-accent hover:text-orange-400 text-sm font-medium transition-colors duration-200"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </motion.div>

                {/* Results Info */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="text-white/60">
                    Showing <span className="text-accent font-semibold">{matches.length}</span> of{' '}
                    <span className="text-accent font-semibold">{matchMeta.totalItems}</span>{' '}
                    matches
                    {searchParams.get('status') !== 'all' && (
                      <span>
                        {' '}
                        -{' '}
                        <span className="text-white capitalize">
                          {searchParams.get('status') === 'upcoming'
                            ? 'Upcoming'
                            : searchParams.get('status')}
                        </span>
                      </span>
                    )}
                    {searchParams.get('date') && (
                      <span>
                        {' '}
                        on <span className="text-white">{searchParams.get('date')}</span>
                      </span>
                    )}
                  </div>
                  {totalPages > 1 && (
                    <div className="text-white/40 text-sm">
                      Page {currentPage} of {totalPages}
                    </div>
                  )}
                </div>

                {/* Matches List */}
                {matches.length > 0 ? (
                  <div className="space-y-4">
                    {matches.map((match) => {
                      const { dateStr, time } = formatDateTime(match.match_date, match.match_time);
                      return (
                        <div
                          key={match.id}
                          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <div>
                                <p className="text-white font-medium">{dateStr}</p>
                                {time && <p className="text-white/50 text-sm">{time} WIB</p>}
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  match.status
                                )} w-fit`}
                              >
                                {getDisplayStatus(match.status)}
                              </span>
                            </div>

                            <div className="md:col-span-2">
                              <div className="flex items-center justify-center gap-4">
                                <div className="flex items-center gap-3 flex-1 justify-end">
                                  <span className="text-white font-medium text-right">
                                    {match.HomeTeam?.name || 'TBD'}
                                  </span>
                                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm overflow-hidden">
                                    {match.HomeTeam?.logoUrl ? (
                                      <img
                                        src={match.HomeTeam.logoUrl}
                                        alt={match.HomeTeam.name}
                                        className="w-6 h-6 object-contain"
                                      />
                                    ) : (
                                      '🏠'
                                    )}
                                  </div>
                                </div>

                                <div className="px-4 py-2 bg-white/10 rounded-lg min-w-[60px] text-center">
                                  <span className="text-white font-bold">
                                    {formatMatchScore(match)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm overflow-hidden">
                                    {match.AwayTeam?.logoUrl ? (
                                      <img
                                        src={match.AwayTeam.logoUrl}
                                        alt={match.AwayTeam.name}
                                        className="w-6 h-6 object-contain"
                                      />
                                    ) : (
                                      '⚽'
                                    )}
                                  </div>
                                  <span className="text-white font-medium">
                                    {match.AwayTeam?.name || 'TBD'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-center md:text-right">
                              <p className="text-white/70 text-sm mb-3">📍 {match.venue || 'TBD'}</p>
                              {match.status === 'finished' ? (
                                <button
                                  onClick={() => navigate(`/matches/${match.id}/summary`)}
                                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-medium rounded-xl hover:from-green-500 hover:to-green-400 transition-all duration-300 hover:scale-105"
                                >
                                  📊 Summarize
                                </button>
                              ) : (
                                <button
                                  onClick={() => console.log('Predict match:', match.id)}
                                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all duration-300 hover:scale-105"
                                >
                                  🔮 Prediction
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <motion.div
                    variants={fade}
                    initial="hidden"
                    animate="show"
                    className="text-center py-16"
                  >
                    <div className="text-8xl mb-6">⚽</div>
                    <h3 className="text-white text-2xl font-bold mb-4">No Matches Found</h3>
                    <p className="text-white/60 mb-8">
                      No matches match your current filters. Try adjusting the criteria above.
                    </p>
                    <button
                      onClick={() =>
                        setSearchParams({ status: 'all', date: '', pageNumber: 1, pageSize: 10 })
                      }
                      className="px-6 py-3 bg-gradient-to-r from-accent to-orange-500 text-white font-semibold rounded-2xl hover:from-orange-500 hover:to-accent transition-all duration-300"
                    >
                      Clear All Filters
                    </button>
                  </motion.div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!matchMeta.hasPrev}
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
                        disabled={!matchMeta.hasNext}
                        className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'table' && (
              <motion.div key="table" variants={fade} initial="hidden" animate="show">
                <LeagueTable leagueId={id} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA to clubs */}
          <motion.div variants={fade} initial="hidden" animate="show" className="mt-16 text-center">
            <button
              onClick={() => navigate(`/clubs`)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent/20 to-orange-500/20 border border-accent/30 text-accent hover:from-accent/30 hover:to-orange-500/30 rounded-2xl transition-all duration-300 hover:scale-105"
            >
              <span>View all clubs</span>
              <span>→</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
