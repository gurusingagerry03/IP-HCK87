import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import http from '../helpers/http';

export default function MatchSummary() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!matchId) return;

      setLoading(true);
      setError(null);

      try {
        // Simulate a successful match fetch for now
        // const response = await http.get(`/matches/${matchId}`);
        // if (response.data.success) {
        //   setMatch(response.data.data);
        // }

        // Mock match data for demonstration
        setTimeout(() => {
          setMatch({
            id: matchId,
            match_date: '2024-12-15',
            match_time: '20:00',
            venue: 'Wembley Stadium',
            status: 'finished',
            home_score: 2,
            away_score: 1,
            HomeTeam: {
              id: 1,
              name: 'Arsenal FC',
              logoUrl: 'https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png'
            },
            AwayTeam: {
              id: 2,
              name: 'Chelsea FC',
              logoUrl: 'https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png'
            }
          });
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Error fetching match data:', err);
        setError('Failed to load match data');
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  const formatDateTime = (date, time) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return { dateStr, time: time || '' };
  };

  const formatMatchScore = (match) => {
    if (match?.status === 'finished' && match.home_score !== null && match.away_score !== null) {
      return `${match.home_score} - ${match.away_score}`;
    }
    return 'N/A';
  };

  // Static summary data for demonstration
  const staticSummary = {
    overview: "An intense match filled with excitement and tactical brilliance. Both teams displayed exceptional skill and determination throughout the 90 minutes.",
    keyMoments: [
      { minute: "12'", event: "⚽ Goal", description: "Brilliant strike from outside the box" },
      { minute: "34'", event: "🟨 Yellow Card", description: "Tactical foul in midfield" },
      { minute: "58'", event: "⚽ Goal", description: "Header from corner kick" },
      { minute: "72'", event: "🔄 Substitution", description: "Fresh legs brought on" },
      { minute: "89'", event: "🟨 Yellow Card", description: "Time wasting" }
    ],
    statistics: {
      possession: { home: 58, away: 42 },
      shots: { home: 14, away: 8 },
      shotsOnTarget: { home: 6, away: 3 },
      corners: { home: 7, away: 4 },
      fouls: { home: 12, away: 15 }
    },
    analysis: "The home team dominated possession and created more clear-cut chances. The tactical switch to a more aggressive formation in the second half proved decisive. The away team showed great resilience and counter-attacking threat despite being under pressure for long periods."
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111]">
        <div className="p-4">
          <div className="w-20 h-10 bg-white/10 rounded-xl animate-pulse"></div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-white/10 rounded-xl"></div>
              <div className="h-32 bg-white/10 rounded-xl"></div>
              <div className="h-96 bg-white/10 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-md mx-4"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-4">Match Not Found</h2>
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

  const { dateStr, time } = formatDateTime(match?.match_date, match?.match_time);

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="p-4 bg-[#111111] top-0 z-50">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-[#111111]/70 hover:bg-[#111111]/60 border border-white/10 rounded-xl text-white transition-all duration-300"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-white mb-4">
              Match{' '}
              <span className="bg-gradient-to-r from-green-500 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                Summary
              </span>
            </h1>
            <p className="text-xl text-white/70">AI-Generated Match Analysis</p>
          </motion.div>

          {/* Match Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Home Team */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden">
                    {match?.HomeTeam?.logoUrl ? (
                      <img
                        src={match.HomeTeam.logoUrl}
                        alt={match.HomeTeam.name}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <span className="text-2xl">🏠</span>
                    )}
                  </div>
                </div>
                <h3 className="text-white font-bold text-xl mb-2">
                  {match?.HomeTeam?.name || 'Home Team'}
                </h3>
              </div>

              {/* Score & Info */}
              <div className="text-center">
                <div className="mb-4">
                  <div className="text-4xl font-bold text-white mb-2">
                    {formatMatchScore(match)}
                  </div>
                  <div className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-green-600/20 to-green-500/20 border border-green-500/30">
                    <span className="text-green-400 font-medium text-sm">FULL TIME</span>
                  </div>
                </div>
                <div className="text-white/70 text-sm">
                  <p>{dateStr}</p>
                  {time && <p>{time} WIB</p>}
                  <p>📍 {match?.venue || 'Stadium'}</p>
                </div>
              </div>

              {/* Away Team */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden">
                    {match?.AwayTeam?.logoUrl ? (
                      <img
                        src={match.AwayTeam.logoUrl}
                        alt={match.AwayTeam.name}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <span className="text-2xl">⚽</span>
                    )}
                  </div>
                </div>
                <h3 className="text-white font-bold text-xl mb-2">
                  {match?.AwayTeam?.name || 'Away Team'}
                </h3>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* AI Generated Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-600/20 to-green-500/20 border border-green-500/30 rounded-2xl">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div className="flex items-center gap-2">
                <span>🤖</span>
                <span className="text-green-400 font-medium">AI Generated Summary</span>
              </div>
            </div>
          </motion.div>

          {/* Match Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📝</span>
              Match Overview
            </h2>
            <p className="text-white/80 leading-relaxed">
              {staticSummary.overview}
            </p>
          </motion.div>

          {/* Key Moments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span>⚡</span>
              Key Moments
            </h2>
            <div className="space-y-4">
              {staticSummary.keyMoments.map((moment, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-accent font-bold text-lg min-w-[60px]">
                    {moment.minute}
                  </div>
                  <div className="text-2xl">
                    {moment.event.split(' ')[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{moment.event}</div>
                    <div className="text-white/70 text-sm">{moment.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Match Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span>📊</span>
              Match Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-white font-semibold mb-4">{match?.HomeTeam?.name || 'Home'}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-white/80">
                    <span>Possession</span>
                    <span>{staticSummary.statistics.possession.home}%</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Shots</span>
                    <span>{staticSummary.statistics.shots.home}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Shots on Target</span>
                    <span>{staticSummary.statistics.shotsOnTarget.home}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Corners</span>
                    <span>{staticSummary.statistics.corners.home}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Fouls</span>
                    <span>{staticSummary.statistics.fouls.home}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">{match?.AwayTeam?.name || 'Away'}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-white/80">
                    <span>Possession</span>
                    <span>{staticSummary.statistics.possession.away}%</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Shots</span>
                    <span>{staticSummary.statistics.shots.away}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Shots on Target</span>
                    <span>{staticSummary.statistics.shotsOnTarget.away}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Corners</span>
                    <span>{staticSummary.statistics.corners.away}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Fouls</span>
                    <span>{staticSummary.statistics.fouls.away}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>


          {/* Match Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🔍</span>
              Tactical Analysis
            </h2>
            <p className="text-white/80 leading-relaxed">
              {staticSummary.analysis}
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}