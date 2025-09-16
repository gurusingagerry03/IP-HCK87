import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data - in real app this would come from API
const mockLeague = {
  id: 1,
  name: 'Premier League',
  country: 'England',
  logoUrl: 'https://logos-world.net/wp-content/uploads/2020/06/Premier-League-Logo.png',
  currentSeason: '2024/25',
  description: 'The Premier League is the top level of the English football league system.',
};

const mockMatches = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  date: new Date(2024, 8, 15 + Math.floor(i / 2)).toISOString().split('T')[0],
  time: ['15:00', '17:30', '20:00'][i % 3],
  status: ['finished', 'upcoming'][i % 2],
  homeTeam: {
    name: ['Manchester United', 'Arsenal', 'Chelsea', 'Liverpool', 'Manchester City'][i % 5],
    logo: '🔴',
  },
  awayTeam: {
    name: ['Tottenham', 'Brighton', 'Newcastle', 'Aston Villa', 'West Ham'][i % 5],
    logo: '⚪',
  },
  venue: ['Old Trafford', 'Emirates Stadium', 'Stamford Bridge', 'Anfield', 'Etihad Stadium'][
    i % 5
  ],
  score:
    i % 2 === 0
      ? { home: Math.floor(Math.random() * 4), away: Math.floor(Math.random() * 4) }
      : null,
}));

export default function LeagueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [league, setLeague] = useState(null);
  const [activeTab, setActiveTab] = useState('fixtures');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [isTabsSticky, setIsTabsSticky] = useState(false);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');

  // Match data
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const headerRef = useRef(null);
  const tabsRef = useRef(null);

  // Simple fade variant
  const fade = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  // Simulate API calls
  useEffect(() => {
    const fetchLeague = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setLeague(mockLeague);
        setMatches(mockMatches);
      } catch (err) {
        setError('Failed to load league data');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchLeague();
  }, [id]);

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

  // Filter matches with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      let filtered = matches;
      if (selectedStatus !== 'all') filtered = filtered.filter((m) => m.status === selectedStatus);
      if (selectedDate) filtered = filtered.filter((m) => m.date === selectedDate);
      setFilteredMatches(filtered.slice(0, page * 20));
      setHasMore(filtered.length > page * 20);
    }, 300);
    return () => clearTimeout(timer);
  }, [matches, selectedStatus, selectedDate, page]);

  const loadMore = useCallback(() => {
    if (!hasMore || matchesLoading) return;
    setPage((prev) => prev + 1);
  }, [hasMore, matchesLoading]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
        loadMore();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const formatDateTime = (date, time) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    return `${dateStr} ${time}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'finished':
        return 'bg-gray-600 text-gray-200';
      case 'upcoming':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-600 text-gray-200';
    }
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
          onClick={() => navigate(-1)}
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
                  <span className="text-accent font-medium text-sm">
                    Season {league?.currentSeason}
                  </span>
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
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Status</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
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

                  {(selectedDate || selectedStatus !== 'all') && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <button
                        onClick={() => {
                          setSelectedDate('');
                          setSelectedStatus('all');
                        }}
                        className="text-accent hover:text-orange-400 text-sm font-medium transition-colors duration-200"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </motion.div>

                {/* Results Info */}
                <div className="mb-6">
                  <p className="text-white/60">
                    Showing{' '}
                    <span className="text-accent font-semibold">{filteredMatches.length}</span>{' '}
                    matches
                    {selectedStatus !== 'all' && (
                      <span>
                        {' '}
                        - <span className="text-white capitalize">{selectedStatus}</span>
                      </span>
                    )}
                    {selectedDate && (
                      <span>
                        {' '}
                        on{' '}
                        <span className="text-white">
                          {new Date(selectedDate).toLocaleDateString()}
                        </span>
                      </span>
                    )}
                  </p>
                </div>

                {/* Matches List */}
                {filteredMatches.length > 0 ? (
                  <div className="space-y-4">
                    {filteredMatches.map((match) => (
                      <div
                        key={match.id}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div>
                              <p className="text-white font-medium">
                                {formatDateTime(match.date, match.time)}
                              </p>
                              <p className="text-white/50 text-sm">WIB</p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                match.status
                              )} w-fit`}
                            >
                              {match.status === 'finished' ? 'FT' : 'Upcoming'}
                            </span>
                          </div>

                          <div className="md:col-span-2">
                            <div className="flex items-center justify-center gap-4">
                              <div className="flex items-center gap-3 flex-1 justify-end">
                                <span className="text-white font-medium text-right">
                                  {match.homeTeam.name}
                                </span>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                                  {match.homeTeam.logo}
                                </div>
                              </div>

                              <div className="px-4 py-2 bg-white/10 rounded-lg min-w-[60px] text-center">
                                {match.score ? (
                                  <span className="text-white font-bold">
                                    {match.score.home} - {match.score.away}
                                  </span>
                                ) : (
                                  <span className="text-white/50">VS</span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                                  {match.awayTeam.logo}
                                </div>
                                <span className="text-white font-medium">
                                  {match.awayTeam.name}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-center md:text-right">
                            <p className="text-white/70 text-sm">📍 {match.venue}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {hasMore && (
                      <div className="text-center py-8">
                        <button
                          onClick={loadMore}
                          disabled={matchesLoading}
                          className="px-6 py-3 bg-white/10 border border-white/20 rounded-2xl text-white hover:bg-white/20 transition-all duration-300 disabled:opacity-50"
                        >
                          {matchesLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Loading...
                            </div>
                          ) : (
                            'Load More'
                          )}
                        </button>
                      </div>
                    )}
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
                      onClick={() => {
                        setSelectedStatus('all');
                        setSelectedDate('');
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-accent to-orange-500 text-white font-semibold rounded-2xl hover:from-orange-500 hover:to-accent transition-all duration-300"
                    >
                      Clear All Filters
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'table' && (
              <motion.div
                key="table"
                variants={fade}
                initial="hidden"
                animate="show"
                className="text-center py-20"
              >
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-white text-2xl font-bold mb-4">League Table</h3>
                <p className="text-white/60">League table feature coming soon...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA to clubs */}
          <motion.div variants={fade} initial="hidden" animate="show" className="mt-16 text-center">
            <button
              onClick={() => navigate(`/clubs?league=${id}`)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent/20 to-orange-500/20 border border-accent/30 text-accent hover:from-accent/30 hover:to-orange-500/30 rounded-2xl transition-all duration-300 hover:scale-105"
            >
              <span>View all clubs in this league</span>
              <span>→</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
