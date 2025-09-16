import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router';
import http from '../helpers/http';

export default function Leagues() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLeagues = async () => {
      setLoading(true);
      try {
        const response = await http.get('/leagues');
        setLeagues(response.data.data || []);
      } catch (error) {
        console.error('Error fetching leagues:', error);
        setLeagues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, []);



  const leagueStats = [
    { label: "Total Leagues", value: "100+", icon: "🏆" },
    { label: "Countries", value: "50+", icon: "🌍" },
    { label: "Total Teams", value: "2000+", icon: "⚽" },
    { label: "Active Seasons", value: "2024/25", icon: "📅" }
  ];

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
              Leagues
            </span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Explore football leagues from around the world. Discover competitions, track your favorites, and stay updated with the latest league information.
          </p>
        </motion.div>

        {/* League Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {leagueStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index + 0.3 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center hover:bg-white/10 transition-all duration-300"
              >
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-2xl lg:text-3xl font-bold text-accent mb-2">{stat.value}</div>
                <div className="text-white/70 text-sm font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>


        {/* All Leagues Section */}
        {leagues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                All{' '}
                <span className="bg-gradient-to-r from-accent via-orange-500 to-red-500 bg-clip-text text-transparent">
                  Leagues
                </span>
              </h2>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Browse through our complete collection of football leagues
              </p>
            </div>

            <div className="mb-8">
              <div className="text-white/60 text-center">
                Showing <span className="text-accent font-semibold">{leagues.length}</span> leagues
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {loading
                ? // Loading state
                  Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 animate-pulse"
                    >
                      <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-white/10"></div>
                      </div>
                      <div className="h-8 bg-white/10 rounded mb-2"></div>
                      <div className="h-6 bg-white/10 rounded mb-4"></div>
                      <div className="space-y-3">
                        <div className="h-4 bg-white/10 rounded"></div>
                        <div className="h-4 bg-white/10 rounded"></div>
                      </div>
                      <div className="h-12 bg-white/10 rounded-xl mt-6"></div>
                    </div>
                  ))
                : leagues.map((league, index) => (
                    <motion.div
                      key={league.id}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index + 0.5 }}
                      className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:from-white/15 hover:to-white/10 hover:border-accent/30 transition-all duration-500"
                    >
                      <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 border border-white/30 flex items-center justify-center overflow-hidden">
                          {league.logoUrl ? (
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
                          <div
                            className="w-full h-full flex items-center justify-center text-2xl"
                            style={{ display: league.logoUrl ? 'none' : 'flex' }}
                          >
                            🏆
                          </div>
                        </div>
                      </div>

                      <h3 className="text-white font-bold text-2xl mb-2 text-center group-hover:text-accent transition-colors duration-300">
                        {league.name}
                      </h3>

                      <div className="flex justify-center mb-4">
                        <div className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-accent/20 to-orange-500/20 border border-accent/30">
                          <span className="text-accent font-medium text-sm">{league.country}</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/60">Competition</span>
                          <span className="text-white font-medium text-right">{league.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/60">Country</span>
                          <span className="text-white font-medium">{league.country}</span>
                        </div>
                      </div>

                      <Link
                        to={`/leagues/${league.id}`}
                        className="block w-full py-3 px-4 text-center rounded-xl bg-gradient-to-r from-accent to-orange-500 text-white font-semibold hover:from-orange-500 hover:to-accent transition-all duration-300"
                      >
                        View League Details
                      </Link>
                    </motion.div>
                  ))}
            </div>
          </motion.div>
        )}

        {leagues.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center py-20"
          >
            <div className="text-8xl mb-6">🏆</div>
            <h3 className="text-white text-2xl font-bold mb-4">No leagues available</h3>
            <p className="text-white/60 mb-8">Check back later for more leagues</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}