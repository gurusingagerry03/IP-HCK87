import { useNavigate } from 'react-router';

export default function MatchCard({
  match,
  onPredictionClick,
  onSummaryClick,
  formatDateTime,
  formatMatchScore,
  getStatusColor,
  getDisplayStatus,
  className = ''
}) {
  const navigate = useNavigate();

  const { dateStr, time } = formatDateTime ? formatDateTime(match.match_date, match.match_time) : { dateStr: '', time: '' };

  const handlePredictionClick = () => {
    if (onPredictionClick) {
      onPredictionClick(match);
    } else {
      navigate(`/matches/${match.id}/prediction`);
    }
  };

  const handleSummaryClick = () => {
    if (onSummaryClick) {
      onSummaryClick(match);
    } else {
      navigate(`/matches/${match.id}/summary`);
    }
  };

  const defaultGetStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'finished':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'live':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const defaultGetDisplayStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'finished':
        return 'Finished';
      case 'upcoming':
        return 'Upcoming';
      case 'live':
        return 'Live';
      default:
        return status || 'TBD';
    }
  };

  const defaultFormatMatchScore = (match) => {
    if (match.status === 'finished' && match.home_score !== null && match.away_score !== null) {
      return `${match.home_score} - ${match.away_score}`;
    }
    return 'vs';
  };

  const statusColorClass = getStatusColor ? getStatusColor(match.status) : defaultGetStatusColor(match.status);
  const displayStatus = getDisplayStatus ? getDisplayStatus(match.status) : defaultGetDisplayStatus(match.status);
  const scoreDisplay = formatMatchScore ? formatMatchScore(match) : defaultFormatMatchScore(match);

  return (
    <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Date, Time, and Status */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <p className="text-white font-medium">{dateStr}</p>
            {time && <p className="text-white/50 text-sm">{time} WIB</p>}
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColorClass} w-fit`}>
            {displayStatus}
          </span>
        </div>

        {/* Teams and Score */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-center gap-4">
            {/* Home Team */}
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

            {/* Score */}
            <div className="px-4 py-2 bg-white/10 rounded-lg min-w-[60px] text-center">
              <span className="text-white font-bold">
                {scoreDisplay}
              </span>
            </div>

            {/* Away Team */}
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

        {/* Venue and Action Button */}
        <div className="text-center md:text-right">
          <p className="text-white/70 text-sm mb-3">
            📍 {match.venue || 'TBD'}
          </p>
          {match.status === 'finished' ? (
            <button
              onClick={handleSummaryClick}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-medium rounded-xl hover:from-green-500 hover:to-green-400 transition-all duration-300 hover:scale-105"
            >
              📊 Summarize
            </button>
          ) : (
            <button
              onClick={handlePredictionClick}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all duration-300 hover:scale-105"
            >
              🔮 Prediction
            </button>
          )}
        </div>
      </div>
    </div>
  );
}