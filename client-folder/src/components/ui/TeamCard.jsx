import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';

export default function TeamCard({
  team,
  isFavorite = false,
  isAddingFavorite = false,
  onFavoriteToggle,
  showFavoriteButton = true,
  animationDelay = 0,
  className = ''
}) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    if (onFavoriteToggle && !isAddingFavorite) {
      onFavoriteToggle(team);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      className={`group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:from-white/15 hover:to-white/10 hover:border-accent/30 transition-all duration-500 ${className}`}
    >
      {/* Team Logo */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 border border-white/30 flex items-center justify-center overflow-hidden">
          {team.logoUrl && !imageError ? (
            <img
              src={team.logoUrl}
              alt={`${team.name} logo`}
              className="w-16 h-16 object-contain"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              ⚽
            </div>
          )}
        </div>
      </div>

      {/* Favorite Button */}
      {showFavoriteButton && (
        <div className="flex justify-center mb-6">
          <button
            onClick={handleFavoriteClick}
            disabled={isAddingFavorite}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              isFavorite
                ? 'bg-red-500 border-red-500 text-white'
                : 'bg-white/10 border-white/20 text-white/60 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400'
            }`}
          >
            {isAddingFavorite ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            )}
            <span className="font-medium text-sm">
              {isAddingFavorite
                ? 'Adding...'
                : isFavorite
                ? 'Favorited'
                : 'Add to Favorites'}
            </span>
          </button>
        </div>
      )}

      {/* Team Name */}
      <h3 className="text-white font-bold text-2xl mb-2 text-center group-hover:text-accent transition-colors duration-300">
        {team.name}
      </h3>

      {/* Country Badge */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-accent/20 to-orange-500/20 border border-accent/30">
          <span className="text-accent font-medium text-sm">{team.country}</span>
        </div>
      </div>

      {/* Team Details */}
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

      {/* View Details Link */}
      <Link
        to={`/teams/${team.id}`}
        className="block w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-accent to-orange-500 text-white font-semibold hover:from-orange-500 hover:to-accent transition-all duration-300 text-center"
      >
        View Details
      </Link>
    </motion.div>
  );
}