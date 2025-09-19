import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
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
    const fetchData = async () => {
      if (!matchId) return;

      setLoading(true);
      setError(null);

      try {
        await http.put(`/matches/analysis/${matchId}`);
        const response = await http.get(`/matches/${matchId}`);
        if (response.data.success) {
          setMatch(response.data.data);
        } else {
          setError('Match not found');
        }
      } catch (err) {
        setError('Failed to load match data');
        toast.error('Failed to load match data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  // Static summary data for demonstration

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
              <span className="bg-gradient-to-r from-green-500 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                Summary
              </span>
            </h1>
            <p className="text-xl text-white/70">AI-Generated Match Analysis</p>
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
                  <h2 className="text-2xl font-bold text-white mb-2">Match Details</h2>
                  <div className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-green-600/20 to-green-500/20 border border-green-500/30">
                    <span className="text-green-400 font-medium text-sm">FULL TIME</span>
                  </div>
                </div>

                {/* Teams and Score */}
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
                    <div className="text-3xl font-bold text-white">{match?.home_score ?? '-'}</div>
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
                    <div className="text-3xl font-bold text-white">{match?.away_score ?? '-'}</div>
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

            {/* Right Column - AI Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="space-y-8 flex flex-col h-full"
            >
              {/* Match Overview */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex-1">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span>📝</span>
                  Match Overview
                </h2>
                <p className="text-white/80 leading-relaxed text-lg">
                  {match?.match_overview || 'Generating Overview...'}
                </p>
              </div>

              {/* Tactical Analysis */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex-1">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span>🔍</span>
                  Tactical Analysis
                </h2>
                <p className="text-white/80 leading-relaxed text-lg">
                  {match?.tactical_analysis || 'Generating Tactical Analysis...'}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Match Statistics Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                <span>📊</span>
                Match Statistics
              </h2>

              {match?.statistics && match.statistics.length > 0 ? (
                <div className="space-y-6">
                  {/* Key Statistics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Ball Possession */}
                    {(() => {
                      const possessionStat = match.statistics.find(
                        (stat) => stat.type === 'Ball Possession'
                      );
                      if (possessionStat) {
                        return (
                          <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                            <h3 className="text-white/80 text-sm mb-2">Possession %</h3>
                            <div className="flex justify-between items-center">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">
                                  {possessionStat.home}
                                </div>
                                <div className="text-xs text-white/60">{match.HomeTeam?.name}</div>
                              </div>
                              <div className="text-white/40 mx-4">vs</div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">
                                  {possessionStat.away}
                                </div>
                                <div className="text-xs text-white/60">{match.AwayTeam?.name}</div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Shots Total */}
                    {(() => {
                      const shotsStat = match.statistics.find(
                        (stat) => stat.type === 'Shots Total'
                      );
                      if (shotsStat) {
                        return (
                          <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                            <h3 className="text-white/80 text-sm mb-2">Total Shots</h3>
                            <div className="flex justify-between items-center">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">
                                  {shotsStat.home}
                                </div>
                                <div className="text-xs text-white/60">{match.HomeTeam?.name}</div>
                              </div>
                              <div className="text-white/40 mx-4">vs</div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">
                                  {shotsStat.away}
                                </div>
                                <div className="text-xs text-white/60">{match.AwayTeam?.name}</div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Shots On Goal */}
                    {(() => {
                      const shotsOnGoalStat = match.statistics.find(
                        (stat) => stat.type === 'Shots On Goal'
                      );
                      if (shotsOnGoalStat) {
                        return (
                          <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                            <h3 className="text-white/80 text-sm mb-2">Shots on Target</h3>
                            <div className="flex justify-between items-center">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">
                                  {shotsOnGoalStat.home}
                                </div>
                                <div className="text-xs text-white/60">{match.HomeTeam?.name}</div>
                              </div>
                              <div className="text-white/40 mx-4">vs</div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white">
                                  {shotsOnGoalStat.away}
                                </div>
                                <div className="text-xs text-white/60">{match.AwayTeam?.name}</div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Essential Statistics Only */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Passing Accuracy */}
                      {(() => {
                        const passesAccurate = match.statistics.find(
                          (s) => s.type === 'Passes Accurate'
                        );
                        const passesTotal = match.statistics.find((s) => s.type === 'Passes Total');

                        if (passesAccurate && passesTotal) {
                          const homeAccuracy = passesTotal.home
                            ? Math.round((passesAccurate.home / passesTotal.home) * 100)
                            : 0;
                          const awayAccuracy = passesTotal.away
                            ? Math.round((passesAccurate.away / passesTotal.away) * 100)
                            : 0;

                          return (
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                              <h3 className="text-white/80 font-medium text-center mb-4">
                                Passing Accuracy %
                              </h3>
                              <div className="flex justify-between items-center">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-400">
                                    {homeAccuracy}%
                                  </div>
                                  <div className="text-xs text-white/60 mt-1">
                                    {passesAccurate.home}/{passesTotal.home}
                                  </div>
                                  <div className="text-xs text-white/60">
                                    {match.HomeTeam?.name}
                                  </div>
                                </div>
                                <div className="flex-1 mx-6">
                                  <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000"
                                      style={{
                                        width: `${
                                          homeAccuracy > awayAccuracy
                                            ? 60 + (homeAccuracy - awayAccuracy) / 2
                                            : 40
                                        }%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-400">
                                    {awayAccuracy}%
                                  </div>
                                  <div className="text-xs text-white/60 mt-1">
                                    {passesAccurate.away}/{passesTotal.away}
                                  </div>
                                  <div className="text-xs text-white/60">
                                    {match.AwayTeam?.name}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Corners */}
                      {(() => {
                        const cornersStat = match.statistics.find((s) => s.type === 'Corners');
                        if (cornersStat) {
                          return (
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                              <h3 className="text-white/80 font-medium text-center mb-4">
                                Corners
                              </h3>
                              <div className="flex justify-between items-center">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-blue-400">
                                    {cornersStat.home}
                                  </div>
                                  <div className="text-xs text-white/60">
                                    {match.HomeTeam?.name}
                                  </div>
                                </div>
                                <div className="flex-1 mx-6">
                                  <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                                    {(() => {
                                      const homeVal = parseFloat(cornersStat.home) || 0;
                                      const awayVal = parseFloat(cornersStat.away) || 0;
                                      const total = homeVal + awayVal;
                                      const homePercentage =
                                        total > 0 ? (homeVal / total) * 100 : 50;

                                      return (
                                        <div
                                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000"
                                          style={{ width: `${homePercentage}%` }}
                                        ></div>
                                      );
                                    })()}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-blue-400">
                                    {cornersStat.away}
                                  </div>
                                  <div className="text-xs text-white/60">
                                    {match.AwayTeam?.name}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Fouls */}
                      {(() => {
                        const foulsStat = match.statistics.find((s) => s.type === 'Fouls');
                        if (foulsStat) {
                          return (
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                              <h3 className="text-white/80 font-medium text-center mb-4">Fouls</h3>
                              <div className="flex justify-between items-center">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-red-400">
                                    {foulsStat.home}
                                  </div>
                                  <div className="text-xs text-white/60">
                                    {match.HomeTeam?.name}
                                  </div>
                                </div>
                                <div className="flex-1 mx-6">
                                  <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                                    {(() => {
                                      const homeVal = parseFloat(foulsStat.home) || 0;
                                      const awayVal = parseFloat(foulsStat.away) || 0;
                                      const total = homeVal + awayVal;
                                      const homePercentage =
                                        total > 0 ? (homeVal / total) * 100 : 50;

                                      return (
                                        <div
                                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-1000"
                                          style={{ width: `${homePercentage}%` }}
                                        ></div>
                                      );
                                    })()}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-red-400">
                                    {foulsStat.away}
                                  </div>
                                  <div className="text-xs text-white/60">
                                    {match.AwayTeam?.name}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Yellow Cards */}
                      {(() => {
                        const yellowCardsStat = match.statistics.find(
                          (s) => s.type === 'Yellow Cards'
                        );
                        if (yellowCardsStat) {
                          return (
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                              <h3 className="text-white/80 font-medium text-center mb-4">
                                Yellow Cards
                              </h3>
                              <div className="flex justify-between items-center">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-yellow-400">
                                    {yellowCardsStat.home}
                                  </div>
                                  <div className="text-xs text-white/60">
                                    {match.HomeTeam?.name}
                                  </div>
                                </div>
                                <div className="flex-1 mx-6">
                                  <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                                    {(() => {
                                      const homeVal = parseFloat(yellowCardsStat.home) || 0;
                                      const awayVal = parseFloat(yellowCardsStat.away) || 0;
                                      const total = homeVal + awayVal;
                                      const homePercentage =
                                        total > 0 ? (homeVal / total) * 100 : 50;

                                      return (
                                        <div
                                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-1000"
                                          style={{ width: `${homePercentage}%` }}
                                        ></div>
                                      );
                                    })()}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-yellow-400">
                                    {yellowCardsStat.away}
                                  </div>
                                  <div className="text-xs text-white/60">
                                    {match.AwayTeam?.name}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Right Column - Team Summary */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white mb-4 text-center">
                        Team Performance
                      </h3>

                      {/* Team Comparison Cards */}
                      <div className="grid grid-cols-1 gap-6">
                        {/* Home Team Card */}
                        <div className="bg-gradient-to-r from-green-600/10 to-blue-600/10 rounded-xl p-6 border border-green-500/20">
                          <div className="flex items-center gap-4 mb-4">
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
                              <h4 className="text-white font-semibold text-lg">
                                {match.HomeTeam?.name}
                              </h4>
                              <p className="text-white/60 text-sm">Home Team</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {(() => {
                              const saves = match.statistics.find((s) => s.type === 'Saves');
                              const possession = match.statistics.find(
                                (s) => s.type === 'Ball Possession'
                              );
                              const shotsOnGoal = match.statistics.find(
                                (s) => s.type === 'Shots On Goal'
                              );
                              const corners = match.statistics.find((s) => s.type === 'Corners');

                              return (
                                <>
                                  {saves && (
                                    <div className="text-center p-3 bg-white/5 rounded-lg">
                                      <div className="text-xl font-bold text-purple-400">
                                        {saves.home}
                                      </div>
                                      <div className="text-xs text-white/60">Saves</div>
                                    </div>
                                  )}
                                  {possession && (
                                    <div className="text-center p-3 bg-white/5 rounded-lg">
                                      <div className="text-xl font-bold text-blue-400">
                                        {possession.home}
                                      </div>
                                      <div className="text-xs text-white/60">Possession</div>
                                    </div>
                                  )}
                                  {shotsOnGoal && (
                                    <div className="text-center p-3 bg-white/5 rounded-lg">
                                      <div className="text-xl font-bold text-orange-400">
                                        {shotsOnGoal.home}
                                      </div>
                                      <div className="text-xs text-white/60">On Target</div>
                                    </div>
                                  )}
                                  {corners && (
                                    <div className="text-center p-3 bg-white/5 rounded-lg">
                                      <div className="text-xl font-bold text-green-400">
                                        {corners.home}
                                      </div>
                                      <div className="text-xs text-white/60">Corners</div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Away Team Card */}
                        <div className="bg-gradient-to-r from-purple-600/10 to-red-600/10 rounded-xl p-6 border border-purple-500/20">
                          <div className="flex items-center gap-4 mb-4">
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
                              <h4 className="text-white font-semibold text-lg">
                                {match.AwayTeam?.name}
                              </h4>
                              <p className="text-white/60 text-sm">Away Team</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {(() => {
                              const saves = match.statistics.find((s) => s.type === 'Saves');
                              const possession = match.statistics.find(
                                (s) => s.type === 'Ball Possession'
                              );
                              const shotsOnGoal = match.statistics.find(
                                (s) => s.type === 'Shots On Goal'
                              );
                              const corners = match.statistics.find((s) => s.type === 'Corners');

                              return (
                                <>
                                  {saves && (
                                    <div className="text-center p-3 bg-white/5 rounded-lg">
                                      <div className="text-xl font-bold text-purple-400">
                                        {saves.away}
                                      </div>
                                      <div className="text-xs text-white/60">Saves</div>
                                    </div>
                                  )}
                                  {possession && (
                                    <div className="text-center p-3 bg-white/5 rounded-lg">
                                      <div className="text-xl font-bold text-blue-400">
                                        {possession.away}
                                      </div>
                                      <div className="text-xs text-white/60">Possession</div>
                                    </div>
                                  )}
                                  {shotsOnGoal && (
                                    <div className="text-center p-3 bg-white/5 rounded-lg">
                                      <div className="text-xl font-bold text-orange-400">
                                        {shotsOnGoal.away}
                                      </div>
                                      <div className="text-xs text-white/60">On Target</div>
                                    </div>
                                  )}
                                  {corners && (
                                    <div className="text-center p-3 bg-white/5 rounded-lg">
                                      <div className="text-xl font-bold text-green-400">
                                        {corners.away}
                                      </div>
                                      <div className="text-xs text-white/60">Corners</div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-white text-xl font-semibold mb-2">No Statistics Available</h3>
                  <p className="text-white/60">Match statistics will appear here when available.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
