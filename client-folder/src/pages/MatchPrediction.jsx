import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import http from '../helpers/http';

export default function MatchPrediction() {
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
        await http.put(`/matches/preview/${matchId}`);
        const response = await http.get(`/matches/${matchId}`);
        if (response.data.success) {
          setMatch(response.data.data);
        } else {
          setError('Match not found');
        }
      } catch (err) {
        console.error('Error fetching match data:', err);
        setError('Failed to load match data');
      } finally {
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

  // Static prediction data for demonstration

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

      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-white mb-4">
              Match{' '}
              <span className="bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
                Prediction
              </span>
            </h1>
            <p className="text-xl text-white/70">AI-Generated Match Forecast</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-stretch">
            {/* Left Column - Match Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-8 flex flex-col h-full"
            >
              {/* Teams vs Score Card */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex-1">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Upcoming Match</h2>
                  <div className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/30">
                    <span className="text-blue-400 font-medium text-sm">UPCOMING</span>
                  </div>
                </div>

                {/* Teams and Predicted Score */}
                <div className="space-y-6">
                  {/* Home Team */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                        {match?.HomeTeam?.logoUrl ? (
                          <img
                            src={match.HomeTeam.logoUrl}
                            alt={match.HomeTeam.name}
                            className="w-10 h-10 object-contain"
                          />
                        ) : (
                          <span className="text-xl">🏠</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">
                          {match?.HomeTeam?.name || 'Home Team'}
                        </h3>
                        <p className="text-white/60 text-sm">Home</p>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-blue-400">
                      {match?.predicted_score_home ?? '-'}
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div className="text-center">
                    <span className="text-white/50 text-lg font-semibold">VS</span>
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                        {match?.AwayTeam?.logoUrl ? (
                          <img
                            src={match.AwayTeam.logoUrl}
                            alt={match.AwayTeam.name}
                            className="w-10 h-10 object-contain"
                          />
                        ) : (
                          <span className="text-xl">⚽</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">
                          {match?.AwayTeam?.name || 'Away Team'}
                        </h3>
                        <p className="text-white/60 text-sm">Away</p>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-blue-400">
                      {match?.predicted_score_away ?? '-'}
                    </div>
                  </div>
                </div>

                {/* Match Info */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-white/60 text-sm">Date</p>
                      <p className="text-white font-medium">{dateStr}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Time</p>
                      <p className="text-white font-medium">{time || '--:--'} WIB</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-white/60 text-sm">Venue</p>
                    <p className="text-white font-medium">📍 {match?.venue || 'Stadium'}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - AI Prediction */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="space-y-8 flex flex-col h-full"
            >
              {/* Match Preview */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex-1">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span>👁️</span>
                  Match Preview
                </h2>
                <p className="text-white/80 leading-relaxed text-lg">
                  {match?.match_preview || 'Generating Match Preview...'}
                </p>
              </div>

              {/* AI Prediction */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex-1">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span>🤖</span>
                  AI Prediction
                </h2>
                <p className="text-white/80 leading-relaxed text-lg">
                  {match?.prediction || 'Generating Tactical Analysis...'}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
