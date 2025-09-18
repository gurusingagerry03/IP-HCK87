import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import http from '../helpers/http';
import { getToken, isLoggedIn } from '../helpers/auth.jsx';
import { useFavorites } from '../store/hooks';

export default function ClubDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const { favorites, refetch: refetchFavorites } = useFavorites();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);
  const [isTabsSticky, setIsTabsSticky] = useState(false);

  // Default images to use when team doesn't have imgUrls
  const defaultImages = [
    'https://storage.googleapis.com/data.ayo.co.id/photos/77445/SEO%20HDI%204/86.%20Faktor-faktor%20yang%20Mempengaruhi%20Kondisi%20Ideal%20Lapangan%20Sepakbola.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1Q6TQbr-7AWK4EiLK9Tqg_9zEAMAzj_ti0g&s',
    'https://www.beritaibukota.com/wp-content/uploads/2022/03/stadion-zaha-3.jpg',
  ];

  // Use team's imgUrls if available, otherwise use default images
  const heroImages = (() => {
    if (club?.imgUrls) {
      try {
        const parsedImgUrls = typeof club.imgUrls === 'string' ? JSON.parse(club.imgUrls) : club.imgUrls;
        if (Array.isArray(parsedImgUrls) && parsedImgUrls.length > 0) {
          return parsedImgUrls.map(img => img.url);
        }
      } catch (error) {
        toast.error('Error parsing team images');
      }
    }
    return defaultImages;
  })();

  const [slide, setSlide] = useState(0);

  // Default avatar for players when thumbUrl is not available or errors
  const defaultAvatar =
    'https://thumbs.dreamstime.com/b/default-avatar-profile-icon-gray-placeholder-vector-illustration-378729418.jpg';

  // Fetch club data and players
  useEffect(() => {
    const fetchClubData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch club details and players in parallel
        await http.patch(`/teams/generate-descriptions/${id}`);
        const [clubResponse, playersResponse] = await Promise.all([
          http.get(`/teams/${id}`),
          http.get(`/players/team/${id}`),
        ]);

        setClub(clubResponse.data.data || clubResponse.data);
        setPlayers(playersResponse.data.data || playersResponse.data || []);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message || 'Failed to load club data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClubData();
    }
  }, [id]);

  // Favorites are automatically fetched by useFavorites() hook when user is logged in

  // Check if current club is in favorites whenever favorites change
  useEffect(() => {
    if (favorites && id) {
      const currentClubIsFavorited = favorites.some((fav) => fav.Team?.id === parseInt(id));
      setIsFavorited(currentClubIsFavorited);
    }
  }, [favorites, id]);

  // Carousel autoplay
  useEffect(() => {
    const interval = setInterval(() => {
      setSlide((s) => (s + 1) % heroImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Handle scroll for sticky tabs
  useEffect(() => {
    const handleScroll = () => {
      const tabsElement = document.getElementById('tabs-section');
      if (tabsElement) {
        const rect = tabsElement.getBoundingClientRect();
        setIsTabsSticky(rect.top <= 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Carousel controls
  const goPrev = () => setSlide((s) => (s - 1 + heroImages.length) % heroImages.length);
  const goNext = () => setSlide((s) => (s + 1) % heroImages.length);

  // Transform API data to display format
  const getDisplayClub = () => {
    if (!club) return null;

    return {
      id: club.id,
      name: club.name,
      location: `${club.stadiumCity}, ${club.country}`,
      logo: club.logoUrl ? '🏛️' : '⚽',
      stadium: {
        name: club.stadiumName,
        capacity: club.stadiumCapacity?.toLocaleString() || 'N/A',
      },
      founded: club.foundedYear,
      coach: club.coach,
      history: club.description,
      stadiumDetails: `${club.stadiumName} is located at ${
        club.venueAddress || club.stadiumCity + ', ' + club.country
      }. With a capacity of ${club.stadiumCapacity?.toLocaleString()} spectators, it serves as the home ground for ${
        club.name
      }. The stadium provides an excellent atmosphere for matches and represents the heart of the club's connection with its supporters.`,
      squad: players.map((player) => ({
        id: player.id,
        name: player.fullName,
        position: player.primaryPosition,
        age: player.age,
        number: player.shirtNumber || 'N/A',
        thumbUrl: player.thumbUrl,
      })),
    };
  };

  const displayClub = getDisplayClub();

  const formatNumber = (num) => {
    if (!num) return 'N/A';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleImageError = (e) => {
    e.target.src = defaultAvatar;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [id]);

  // Handle add to favorites
  const handleAddToFavorites = async () => {
    if (!isLoggedIn()) {
      toast.error('Please login to add favorites');
      return;
    }
    const token = getToken();

    try {
      setIsAddingFavorite(true);

      if (isFavorited) {
        // Remove from favorites
        const favoriteToRemove = favorites.find((fav) => fav.Team?.id === parseInt(id));
        if (favoriteToRemove) {
          await http({
            method: 'delete',
            url: `/favorites/${favoriteToRemove.id}`,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          // Refetch favorites to get updated data
          refetchFavorites();
          toast.success('Team removed from favorites!');
        }
      } else {
        // Add to favorites
        await http({
          method: 'post',
          url: `/favorites/${id}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Refetch favorites to get updated data
        refetchFavorites();
        toast.success('Team added to favorites!');
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.message ||
        'Failed to update favorites';
      toast.error(errorMessage);
    } finally {
      setIsAddingFavorite(false);
    }
  };

  // ---- Position helpers ----
  const getPositionGroup = (pos = '') => {
    const p = String(pos).toLowerCase();
    if (/gk|goal/.test(p)) return 'Goalkeeper';
    if (/def|back|cb|lb|rb|centre|center/.test(p)) return 'Defender';
    if (/mid/.test(p)) return 'Midfielder';
    if (/wing|forw|strik|attac|fw/.test(p)) return 'Forward';
    return 'Other';
  };

  const positionOrder = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Other'];
  const positionRank = (pos) => {
    const grp = getPositionGroup(pos);
    const idx = positionOrder.indexOf(grp);
    return idx === -1 ? positionOrder.length : idx;
  };

  const sortedSquad = (displayClub?.squad || []).slice().sort((a, b) => {
    // 1) by position group (GK < DF < MF < FW < Other)
    const ra = positionRank(a.position);
    const rb = positionRank(b.position);
    if (ra !== rb) return ra - rb;

    // 2) inside same group, by jersey number if present, else by name
    const na = parseInt(a.number, 10);
    const nb = parseInt(b.number, 10);
    if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
    return String(a.name).localeCompare(String(b.name));
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen">
        {/* Back Button Skeleton */}
        <div className="p-4">
          <div className="w-20 h-10 bg-white/10 rounded-xl animate-pulse"></div>
        </div>

        {/* Hero Skeleton */}
        <div className="h-96 md:h-[40rem] lg:h-[48rem] bg-white/5 animate-pulse"></div>

        {/* Content Skeleton */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 max-w-md mx-4"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-4">Club Not Found</h2>
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
              className="px-6 py-3 bg-gradient-to-r from-accent to-orange-500 text-white font-semibold rounded-xl hover:from-orange-500 hover:to-accent transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 rounded-xl text-white transition-all duration-300 hover:scale-105"
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
        </motion.button>
      </div>

      {/* HERO CAROUSEL */}
      <motion.section
        className="relative min-h-[100svh] overflow-hidden group"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="h-full flex"
            style={{ width: `calc(100vw * ${heroImages.length})` }}
            animate={{ x: `-${slide * 100}vw` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {heroImages.map((src, i) => (
              <div
                key={i}
                className="h-full w-screen shrink-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
          </motion.div>
        </div>

        <div className="absolute inset-0 bg-black/35 pointer-events-none" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 md:h-36 lg:h-44 backdrop-blur-[2px] bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

        {/* Navigation Controls */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 sm:px-6 z-10 pointer-events-none">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Previous slide"
            className="h-11 w-11 md:h-12 md:w-12 rounded-full flex items-center justify-center text-white bg-white/15 hover:bg-white/25 border border-white/25 backdrop-blur-md transition pointer-events-auto"
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next slide"
            className="h-11 w-11 md:h-12 md:w-12 rounded-full flex items-center justify-center text-white bg-white/15 hover:bg-white/25 border border-white/25 backdrop-blur-md transition pointer-events-auto"
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        {/* Club Info Overlay */}
        {/* Centered Logo & Info Overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col items-center gap-4 md:gap-5">
            {/* Logo box di tengah */}
            <div className="relative">
              <div className="absolute inset-0 blur-2xl opacity-40 bg-black rounded-2xl"></div>
              <div className="relative w-28 h-28 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/25 flex items-center justify-center overflow-hidden">
                {club?.logoUrl ? (
                  <img
                    src={club.logoUrl}
                    alt={`${displayClub?.name} logo`}
                    className="w-3/4 h-3/4 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span
                  className="text-5xl md:text-6xl"
                  style={{ display: club?.logoUrl ? 'none' : 'flex' }}
                >
                  {displayClub?.logo}
                </span>
              </div>
            </div>

            {/* Nama & lokasi di bawah logo (tetap center) */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white text-center">
              {displayClub?.name}
            </h1>
            <p className="text-base md:text-lg text-white/80 flex items-center gap-2">
              <span>📍</span>
              {displayClub?.location}
            </p>
          </div>
        </div>
      </motion.section>

      {/* CLUB INFO CARDS */}
      <section className="px-4 sm:px-6 lg:px-10 2xl:px-14 py-8 md:py-12">
        <motion.div
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="flex justify-end mb-8" variants={itemVariants}>
            <button
              onClick={handleAddToFavorites}
              disabled={isAddingFavorite}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                isFavorited
                  ? 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                  : 'bg-transparent border-white/20 text-white hover:border-accent hover:bg-accent/10'
              }`}
            >
              {isAddingFavorite ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={isFavorited ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              )}
              {isAddingFavorite
                ? 'Adding...'
                : isFavorited
                ? 'Remove from Favorites'
                : 'Add to Favorites'}
            </button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              variants={itemVariants}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:ring-2 hover:ring-accent/20 transition-all duration-300 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏛️</span>
                </div>
                <div>
                  <p className="text-white/60 text-sm font-medium">Founded</p>
                  <p className="text-white text-xl font-bold">{displayClub?.founded || 'N/A'}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:ring-2 hover:ring-accent/20 transition-all duration-300 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏟️</span>
                </div>
                <div>
                  <p className="text-white/60 text-sm font-medium">Stadium</p>
                  <p className="text-white text-lg font-bold">{displayClub?.stadium.name}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:ring-2 hover:ring-accent/20 transition-all duration-300 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <p className="text-white/60 text-sm font-medium">Capacity</p>
                  <p className="text-white text-xl font-bold">
                    {formatNumber(club?.stadiumCapacity)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:ring-2 hover:ring-accent/20 transition-all duration-300 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚽</span>
                </div>
                <div>
                  <p className="text-white/60 text-sm font-medium">Coach</p>
                  <p className="text-white text-lg font-bold">{displayClub?.coach || 'N/A'}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* TABS NAVIGATION */}
      <section
        id="tabs-section"
        className={`px-4 sm:px-6 lg:px-10 2xl:px-14 py-6 ${
          isTabsSticky
            ? 'sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10'
            : ''
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-2 flex gap-2">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 relative ${
                  activeTab === 'info'
                    ? 'bg-accent text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                Info
              </button>
              <button
                onClick={() => setActiveTab('squad')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 relative ${
                  activeTab === 'squad'
                    ? 'bg-accent text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                Squad ({players.length})
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TAB CONTENT */}
      <section className="px-4 sm:px-6 lg:px-10 2xl:px-14 pb-16">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'info' ? (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-white mb-8">Club Details</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-accent">📖</span>
                    Club Information
                  </h3>
                  <p className="text-white/70 leading-relaxed">{displayClub?.history}</p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-accent">🏟️</span>
                    Stadium Details
                  </h3>
                  <p className="text-white/70 leading-relaxed">{displayClub?.stadiumDetails}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="squad"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-white mb-8">Current Squad</h2>

              {players.length > 0 ? (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5 sticky top-0">
                        <tr>
                          <th className="text-left py-4 px-6 text-white/60 font-medium">#</th>
                          <th className="text-left py-4 px-6 text-white/60 font-medium">Player</th>
                          <th className="text-left py-4 px-6 text-white/60 font-medium">
                            Position
                          </th>
                          <th className="text-left py-4 px-6 text-white/60 font-medium">Age</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSquad.map((player, index) => (
                          <tr
                            key={player.id}
                            className={`border-t border-white/5 hover:bg-white/5 transition-colors duration-200 ${
                              index % 2 === 1 ? 'bg-white/[0.02]' : ''
                            }`}
                          >
                            <td className="py-4 px-6">
                              <span className="text-accent font-bold text-lg">{player.number}</span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <img
                                  src={player.thumbUrl || defaultAvatar}
                                  alt={player.name}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
                                  onError={handleImageError}
                                />
                                <span className="text-white font-medium">{player.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-white/70">{player.position}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-white/70">{player.age || 'N/A'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-white text-xl font-bold mb-2">No Squad Data Available</h3>
                  <p className="text-white/60">Squad information is not available for this team.</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
