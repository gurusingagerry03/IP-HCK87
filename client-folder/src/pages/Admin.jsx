import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import http from '../helpers/http';

export default function Admin() {
  const navigate = useNavigate();
  const [createStatus, setCreateStatus] = useState('idle'); // idle, creating, success, error
  const [leagueName, setLeagueName] = useState('');
  const [country, setCountry] = useState('');
  const [teamPlayerSyncStatus, setTeamPlayerSyncStatus] = useState('idle');
  const [matchSyncStatus, setMatchSyncStatus] = useState('idle');
  const [selectedLeagueForTeams, setSelectedLeagueForTeams] = useState('');
  const [selectedLeagueForMatches, setSelectedLeagueForMatches] = useState('');
  const [leagues, setLeagues] = useState([]);
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [stats, setStats] = useState({
    totalLeagues: 0,
    activeLeagues: 0,
    totalTeams: 0,
    totalPlayers: 0,
    totalMatches: 0,
    completedMatches: 0,
    upcomingMatches: 0,
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingLeagues(true);

        // Fetch leagues
        const leaguesResponse = await http.get('/leagues');
        const leaguesData = leaguesResponse.data.data || leaguesResponse.data || [];
        setLeagues(leaguesData);

        // Fetch teams (get all teams without query parameters)
        const teamsResponse = await http.get('/teams');
        const teamsData = teamsResponse.data.data || teamsResponse.data || [];

        // Fetch players count (loop through teams to get total players)
        const playersResponse = await http.get('/players');
        let totalPlayers = playersResponse.data.data.length || playersResponse.data.length || 0;

        // Fetch matches data (get all matches from new endpoint)
        const matchesResponse = await http.get('/matches');
        const matchesData = matchesResponse.data.data || matchesResponse.data || [];

        const totalMatches = matchesData.length;

        // Count completed and upcoming matches based on status from database
        const completedMatches = matchesData.filter(
          (match) =>
            match.status === 'finished' || match.status === 'completed' || match.status === 'FT'
        ).length;

        const upcomingMatches = matchesData.filter(
          (match) =>
            match.status === 'scheduled' || match.status === 'upcoming' || match.status === 'NS'
        ).length;

        // Calculate stats
        const totalLeagues = leaguesData.length;
        const totalTeams = teamsData.length;

        setStats((prevStats) => ({
          ...prevStats,
          totalLeagues,
          totalTeams,
          totalPlayers,
          totalMatches,
          completedMatches,
          upcomingMatches,
        }));
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to load data';
        toast.error(errorMessage);
      } finally {
        setLoadingLeagues(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleCreateLeague = async () => {
    if (!leagueName.trim() || !country.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setCreateStatus('creating');
      await http({
        method: 'POST',
        url: '/leagues/sync',
        data: { leagueName: leagueName.trim(), leagueCountry: country.trim() },
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });

      setCreateStatus('success');
      toast.success(`League "${leagueName}" sync initiated successfully!`);
      setLeagueName('');
      setCountry('');

      // Refresh leagues after sync
      const response = await http.get('/leagues');
      setLeagues(response.data.data || response.data || []);

      setTimeout(() => setCreateStatus('idle'), 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to sync league';
      toast.error(errorMessage);
      setCreateStatus('idle');
    }
  };

  const handleTeamPlayerSync = async () => {
    if (!selectedLeagueForTeams.trim()) {
      toast.error('Please select a league first');
      return;
    }

    try {
      setTeamPlayerSyncStatus('syncing');
      const selectedLeague = leagues.find((league) => league.id == selectedLeagueForTeams);

      await http({
        method: 'POST',
        url: `/teams/sync/${selectedLeagueForTeams}`,
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });

      setTeamPlayerSyncStatus('success');
      toast.success(
        `Teams and players for "${
          selectedLeague?.name || 'selected league'
        }" synchronized successfully!`
      );
      setTimeout(() => setTeamPlayerSyncStatus('idle'), 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to sync teams and players';
      toast.error(errorMessage);
      setTeamPlayerSyncStatus('idle');
    }
  };

  const handleMatchSync = async () => {
    if (!selectedLeagueForMatches.trim()) {
      toast.error('Please select a league first');
      return;
    }

    try {
      setMatchSyncStatus('syncing');
      const selectedLeague = leagues.find((league) => league.id == selectedLeagueForMatches);

      await http({
        method: 'POST',
        url: `/matches/sync/${selectedLeagueForMatches}`,
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });

      setMatchSyncStatus('success');
      toast.success(
        `Matches for "${selectedLeague?.name || 'selected league'}" synchronized successfully!`
      );
      setTimeout(() => setMatchSyncStatus('idle'), 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to sync matches';
      toast.error(errorMessage);
      setMatchSyncStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-12">
        {/* Navigation Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            {/* Left navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all duration-300"
              >
                <span>←</span>
                <span>Back Home</span>
              </button>

              <button
                onClick={() => navigate('/admin/teams')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300"
              >
                <span>👥</span>
                <span>Team List</span>
              </button>
            </div>

            {/* Right logout */}
            <button
              onClick={() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_data');
                navigate('/login');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-all duration-300"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Ninety Minutes - Admin Panel</h1>
          <p className="text-slate-600">Content Management System</p>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Create League Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
          >
            {/* League Creation Section */}
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-800 mb-2">Sync New League</h2>
                  <p className="text-slate-600">Add specific league from external API</p>
                </div>
                <div className="text-4xl">⚽</div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-4 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Leagues</p>
                      <p className="text-2xl font-bold text-blue-800">{stats.totalLeagues}</p>
                    </div>
                    <div className="text-blue-500 text-xl">🏆</div>
                  </div>
                </div>
              </div>

              {/* League Input Form */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">League Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      League Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={leagueName}
                      onChange={(e) => setLeagueName(e.target.value)}
                      placeholder="Enter league name"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-800 placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Enter country name"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-800 placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleCreateLeague}
                    disabled={createStatus === 'creating'}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      createStatus === 'creating'
                        ? 'bg-blue-400 text-white cursor-not-allowed'
                        : createStatus === 'success'
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {createStatus === 'creating' && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    )}
                    {createStatus === 'success' && <span>✓</span>}
                    {createStatus === 'idle' && <span>🔄</span>}

                    {createStatus === 'creating'
                      ? 'Syncing...'
                      : createStatus === 'success'
                      ? 'Sync Complete!'
                      : 'Sync League'}
                  </button>
                </div>

                {/* Progress indicator */}
                {createStatus === 'creating' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <div className="bg-blue-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, ease: 'easeInOut' }}
                        className="bg-blue-600 h-2 rounded-full"
                      />
                    </div>
                    <p className="text-sm text-slate-600 mt-2">Syncing leagues from API...</p>
                  </motion.div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {[
                    { action: 'Ready to create leagues', time: '--', status: 'pending' },
                    { action: 'Database connection established', time: '--', status: 'success' },
                    {
                      action: 'Ninety Minutes admin panel initialized',
                      time: '--',
                      status: 'success',
                    },
                  ].map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.status === 'success'
                              ? 'bg-green-500'
                              : activity.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span className="text-slate-700">{activity.action}</span>
                      </div>
                      <span className="text-sm text-slate-500">{activity.time}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Team & Player Sync Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                    Team & Player Synchronization
                  </h2>
                  <p className="text-slate-600">Sync teams and their players from external API</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>

              {/* Team & Player Sync Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Total Teams</p>
                      <p className="text-2xl font-bold text-purple-800">{stats.totalTeams}</p>
                    </div>
                    <div className="text-purple-500 text-xl">⚽</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-600 text-sm font-medium">Total Players</p>
                      <p className="text-2xl font-bold text-indigo-800">{stats.totalPlayers}</p>
                    </div>
                    <div className="text-indigo-500 text-xl">👤</div>
                  </div>
                </div>
              </div>

              {/* League Selection for Teams */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select League <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedLeagueForTeams}
                    onChange={(e) => setSelectedLeagueForTeams(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-slate-800"
                    disabled={loadingLeagues}
                  >
                    <option value="">
                      {loadingLeagues
                        ? 'Loading leagues...'
                        : 'Choose a league to sync teams & players'}
                    </option>
                    {leagues.map((league) => (
                      <option key={league.id} value={league.id}>
                        {league.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sync Controls */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">
                      Sync Teams & Players
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Synchronize teams and players for selected league
                    </p>
                  </div>

                  <button
                    onClick={handleTeamPlayerSync}
                    disabled={teamPlayerSyncStatus === 'syncing'}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      teamPlayerSyncStatus === 'syncing'
                        ? 'bg-purple-400 text-white cursor-not-allowed'
                        : teamPlayerSyncStatus === 'success'
                        ? 'bg-green-500 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {teamPlayerSyncStatus === 'syncing' && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    )}
                    {teamPlayerSyncStatus === 'success' && <span>✓</span>}
                    {teamPlayerSyncStatus === 'idle' && <span>🔄</span>}

                    {teamPlayerSyncStatus === 'syncing'
                      ? 'Syncing...'
                      : teamPlayerSyncStatus === 'success'
                      ? 'Sync Complete!'
                      : 'Start Sync'}
                  </button>
                </div>

                {/* Progress indicator */}
                {teamPlayerSyncStatus === 'syncing' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <div className="bg-purple-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3, ease: 'easeInOut' }}
                        className="bg-purple-600 h-2 rounded-full"
                      />
                    </div>
                    <p className="text-sm text-slate-600 mt-2">Fetching teams and players...</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Match Sync Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                    Match Synchronization
                  </h2>
                  <p className="text-slate-600">Sync match schedules and results</p>
                </div>
                <div className="text-4xl">🏆</div>
              </div>

              {/* Match Sync Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 text-sm font-medium">Total Matches</p>
                      <p className="text-2xl font-bold text-orange-800">{stats.totalMatches}</p>
                    </div>
                    <div className="text-orange-500 text-xl">⚽</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-600 text-sm font-medium">Completed</p>
                      <p className="text-2xl font-bold text-emerald-800">
                        {stats.completedMatches}
                      </p>
                    </div>
                    <div className="text-emerald-500 text-xl">✅</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-600 text-sm font-medium">Upcoming</p>
                      <p className="text-2xl font-bold text-yellow-800">{stats.upcomingMatches}</p>
                    </div>
                    <div className="text-yellow-500 text-xl">📅</div>
                  </div>
                </div>
              </div>

              {/* League Selection for Matches */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select League <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedLeagueForMatches}
                    onChange={(e) => setSelectedLeagueForMatches(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-slate-800"
                    disabled={loadingLeagues}
                  >
                    <option value="">
                      {loadingLeagues ? 'Loading leagues...' : 'Choose a league to sync matches'}
                    </option>
                    {leagues.map((league) => (
                      <option key={league.id} value={league.id}>
                        {league.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Match Sync Controls */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Sync Match Data</h3>
                    <p className="text-slate-600 text-sm">
                      Update match schedules, results, and statistics for selected league
                    </p>
                  </div>

                  <button
                    onClick={handleMatchSync}
                    disabled={matchSyncStatus === 'syncing'}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      matchSyncStatus === 'syncing'
                        ? 'bg-orange-400 text-white cursor-not-allowed'
                        : matchSyncStatus === 'success'
                        ? 'bg-green-500 text-white'
                        : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {matchSyncStatus === 'syncing' && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    )}
                    {matchSyncStatus === 'success' && <span>✓</span>}
                    {matchSyncStatus === 'idle' && <span>🔄</span>}

                    {matchSyncStatus === 'syncing'
                      ? 'Syncing...'
                      : matchSyncStatus === 'success'
                      ? 'Sync Complete!'
                      : 'Start Sync'}
                  </button>
                </div>

                {/* Progress indicator */}
                {matchSyncStatus === 'syncing' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <div className="bg-orange-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2.5, ease: 'easeInOut' }}
                        className="bg-orange-600 h-2 rounded-full"
                      />
                    </div>
                    <p className="text-sm text-slate-600 mt-2">Fetching match data...</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-4">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-800 font-medium">Database Online</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-800 font-medium">API Services Active</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
