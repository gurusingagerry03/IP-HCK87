import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import http from '../helpers/http';

export default function LeagueTable({ leagueId }) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!leagueId) return;
    fetchStandings();
  }, [leagueId]);

  const fetchStandings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await http.get(`/matches/league/${leagueId}`);
      console.log('response', response.data.data);

      if (response.data.success) {
        const matches = response.data.data;
        const calculatedStandings = calculateStandings(matches);

        setStandings(calculatedStandings);
      }
    } catch (err) {
      console.error('Error fetching standings:', err);
      setError('Failed to load league table');
    } finally {
      setLoading(false);
    }
  };

  const calculateStandings = (matches) => {
    const teams = {};

    matches
      .filter(
        (match) =>
          match.status === 'finished' && match.home_score !== null && match.away_score !== null
      )
      .forEach((match) => {
        const homeTeam = match.HomeTeam;
        const awayTeam = match.AwayTeam;
        const homeScore = parseInt(match.home_score);
        const awayScore = parseInt(match.away_score);

        if (!teams[homeTeam.name]) {
          teams[homeTeam.name] = {
            name: homeTeam.name,
            logoUrl: homeTeam.logoUrl,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
          };
        }

        if (!teams[awayTeam.name]) {
          teams[awayTeam.name] = {
            name: awayTeam.name,
            logoUrl: awayTeam.logoUrl,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
          };
        }

        teams[homeTeam.name].played++;
        teams[awayTeam.name].played++;

        teams[homeTeam.name].goalsFor += homeScore;
        teams[homeTeam.name].goalsAgainst += awayScore;
        teams[awayTeam.name].goalsFor += awayScore;
        teams[awayTeam.name].goalsAgainst += homeScore;

        if (homeScore > awayScore) {
          teams[homeTeam.name].wins++;
          teams[homeTeam.name].points += 3;
          teams[awayTeam.name].losses++;
        } else if (homeScore < awayScore) {
          teams[awayTeam.name].wins++;
          teams[awayTeam.name].points += 3;
          teams[homeTeam.name].losses++;
        } else {
          teams[homeTeam.name].draws++;
          teams[awayTeam.name].draws++;
          teams[homeTeam.name].points += 1;
          teams[awayTeam.name].points += 1;
        }

        teams[homeTeam.name].goalDifference =
          teams[homeTeam.name].goalsFor - teams[homeTeam.name].goalsAgainst;
        teams[awayTeam.name].goalDifference =
          teams[awayTeam.name].goalsFor - teams[awayTeam.name].goalsAgainst;
      });

    return Object.values(teams)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      })
      .map((team, index) => ({ ...team, position: index + 1 }));
  };

  const fade = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-white/10 rounded mb-6"></div>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        variants={fade}
        initial="hidden"
        animate="show"
        className="text-center py-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
      >
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-white text-2xl font-bold mb-4">Error Loading Table</h3>
        <p className="text-white/60 mb-6">{error}</p>
        <button
          onClick={fetchStandings}
          className="px-6 py-3 bg-gradient-to-r from-accent to-orange-500 text-white font-semibold rounded-2xl hover:from-orange-500 hover:to-accent transition-all duration-300"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  console.log(standings, 'standings');

  if (standings.length === 0) {
    return (
      <motion.div
        variants={fade}
        initial="hidden"
        animate="show"
        className="text-center py-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
      >
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-white text-2xl font-bold mb-4">No Finished Matches</h3>
        <p className="text-white/60">League table will be available once matches are completed.</p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fade} initial="hidden" animate="show">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-white text-2xl font-bold">League Table</h2>
          <p className="text-white/60 text-sm mt-1">
            Based on {standings.reduce((acc, team) => acc + team.played, 0) / 2} completed matches
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr className="text-white/70 text-sm">
                <th className="text-left p-4 font-medium">Position</th>
                <th className="text-left p-4 font-medium">Team</th>
                <th className="text-center p-4 font-medium">MP</th>
                <th className="text-center p-4 font-medium">W</th>
                <th className="text-center p-4 font-medium">D</th>
                <th className="text-center p-4 font-medium">L</th>
                <th className="text-center p-4 font-medium">GF</th>
                <th className="text-center p-4 font-medium">GA</th>
                <th className="text-center p-4 font-medium">GD</th>
                <th className="text-center p-4 font-medium">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => (
                <motion.tr
                  key={team.name}
                  variants={fade}
                  initial="hidden"
                  animate="show"
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/10 hover:bg-white/5 transition-all duration-300"
                >
                  <td className="p-4">
                    <span className="font-bold text-lg text-white">{team.position}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                        {team.logoUrl ? (
                          <img
                            src={team.logoUrl}
                            alt={team.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span
                          className="text-sm"
                          style={{ display: team.logoUrl ? 'none' : 'flex' }}
                        >
                          ⚽
                        </span>
                      </div>
                      <span className="text-white font-medium">{team.name}</span>
                    </div>
                  </td>
                  <td className="text-center p-4 text-white">{team.played}</td>
                  <td className="text-center p-4 text-green-400">{team.wins}</td>
                  <td className="text-center p-4 text-yellow-400">{team.draws}</td>
                  <td className="text-center p-4 text-red-400">{team.losses}</td>
                  <td className="text-center p-4 text-white">{team.goalsFor}</td>
                  <td className="text-center p-4 text-white">{team.goalsAgainst}</td>
                  <td className="text-center p-4">
                    <span className={team.goalDifference >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {team.goalDifference >= 0 ? '+' : ''}
                      {team.goalDifference}
                    </span>
                  </td>
                  <td className="text-center p-4">
                    <span className="font-bold text-accent text-lg">{team.points}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
