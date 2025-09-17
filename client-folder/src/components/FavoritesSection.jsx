import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router';

export function FavoriteSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      setIsLoggedIn(!!token);
    };

    checkAuth();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const HeartSVG = () => (
    <motion.svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      className="text-accent"
      initial={{ scale: 0.8, rotate: -10 }}
      animate={{
        scale: isInView ? [0.8, 1.1, 1] : 0.8,
        rotate: isInView ? [-10, 5, 0] : -10,
      }}
      transition={{
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.3,
      }}
    >
      <motion.path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill="currentColor"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isInView ? 1 : 0 }}
        transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.5 }}
      />
      <motion.circle
        cx="12"
        cy="12"
        r="2"
        fill="white"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: isInView ? [0, 1.5, 1] : 0,
          opacity: isInView ? [0, 0.8, 1] : 0,
        }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.8 }}
      />
    </motion.svg>
  );

  const StarsSVG = () => (
    <motion.svg
      width="80"
      height="80"
      viewBox="0 0 24 24"
      fill="none"
      className="text-accent"
      initial={{ scale: 0.8, rotate: 15 }}
      animate={{
        scale: isInView ? [0.8, 1.05, 1] : 0.8,
        rotate: isInView ? [15, -5, 0] : 15,
      }}
      transition={{
        duration: 1.4,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.2,
      }}
    >
      {/* Main star */}
      <motion.path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="currentColor"
        initial={{ pathLength: 0, fillOpacity: 0 }}
        animate={{
          pathLength: isInView ? 1 : 0,
          fillOpacity: isInView ? 0.9 : 0,
        }}
        transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.4 }}
      />
      {/* Small decorative stars */}
      <motion.circle
        cx="6"
        cy="6"
        r="1.5"
        fill="currentColor"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: isInView ? [0, 1.2, 1] : 0,
          opacity: isInView ? [0, 0.7, 0.8] : 0,
        }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.9 }}
      />
      <motion.circle
        cx="18"
        cy="6"
        r="1"
        fill="currentColor"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: isInView ? [0, 1.3, 1] : 0,
          opacity: isInView ? [0, 0.6, 0.7] : 0,
        }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 1.1 }}
      />
    </motion.svg>
  );

  return (
    <motion.section
      ref={ref}
      className="relative min-h-[100svh] snap-start overflow-hidden flex items-center"
      initial="hidden"
      animate={isInView ? 'show' : 'hidden'}
      variants={containerVariants}
    >
      <div className="mx-auto max-w-[1800px] 2xl:max-w-[1700px] px-4 sm:px-6 lg:px-10 2xl:px-14 w-full">
        {!isLoggedIn ? (
          // State A: Belum Login
          <motion.div variants={containerVariants} className="text-center">
            <motion.div variants={itemVariants} className="flex justify-center mb-8">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <HeartSVG />

                {/* Floating particles around heart */}
                <motion.div
                  className="absolute -top-2 -right-2 w-2 h-2 bg-accent rounded-full"
                  animate={{
                    y: isInView ? [0, -8, 0] : 0,
                    opacity: isInView ? [0.5, 1, 0.5] : 0,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1,
                  }}
                />
                <motion.div
                  className="absolute -bottom-1 -left-3 w-1.5 h-1.5 bg-accent/70 rounded-full"
                  animate={{
                    y: isInView ? [0, -12, 0] : 0,
                    opacity: isInView ? [0.3, 0.8, 0.3] : 0,
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1.3,
                  }}
                />
              </motion.div>
            </motion.div>
            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-6xl font-extrabold leading-[1.1] text-white mb-4"
            >
              Save Your
            </motion.h2>
            <motion.h3
              variants={itemVariants}
              className="text-4xl md:text-6xl font-extrabold leading-[1.1] bg-[linear-gradient(90deg,#FFE29F_0%,#FFA600_30%,#FF6A3D_65%,#C2441E_100%)] bg-clip-text text-transparent mb-6"
              style={{ WebkitTextStroke: '0.5px rgba(0,0,0,0.15)' }}
            >
              Favorite Teams
            </motion.h3>
            <motion.div className="flex justify-center mb-8">
              <motion.span
                className="h-1.5 w-32 rounded-full overflow-hidden relative"
                style={{
                  background:
                    'linear-gradient(90deg,#FFE29F 0%,#FFA600 30%,#FF6A3D 65%,#C2441E 100%)',
                }}
                // langsung tampil, tanpa animasi masuk
              >
                <motion.div
                  className="absolute inset-y-0 left-0 w-12"
                  style={{
                    background:
                      'linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent)',
                  }}
                  animate={{
                    x: ['-3rem', '10rem'], // tetap ada animasi berjalan
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                    repeatType: 'mirror',
                    delay: 1.5,
                  }}
                />
              </motion.span>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10"
            >
              Keep track of your favorite football clubs and never miss their latest updates. Create
              your personal collection today!
            </motion.p>
            <motion.div variants={itemVariants} className="flex items-center gap-4 justify-center">
              <Link to="/login">
                <motion.div
                  className="px-8 py-4 rounded-2xl bg-[#FF6A3D] text-black font-semibold text-lg ring-1 ring-white/10 hover:brightness-110 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group cursor-pointer"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <span className="relative z-10">Login to Continue</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                </motion.div>
              </Link>

              <Link to="/register">
                <motion.div
                  className="px-8 py-4 rounded-2xl bg-white/10 text-white font-semibold text-lg ring-1 ring-white/15 hover:bg-white/15 backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  Create Account
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          // State B: Sudah Login
          <motion.div variants={containerVariants} className="text-center">
            <motion.div variants={itemVariants} className="flex justify-center mb-8">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <StarsSVG />
              </motion.div>
            </motion.div>

            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-6xl font-extrabold leading-[1.1] text-white mb-4"
            >
              Your Favorite
            </motion.h2>

            <motion.h3
              variants={itemVariants}
              className="text-4xl md:text-6xl font-extrabold leading-[1.1] bg-[linear-gradient(90deg,#FFE29F_0%,#FFA600_30%,#FF6A3D_65%,#C2441E_100%)] bg-clip-text text-transparent mb-6"
              style={{ WebkitTextStroke: '0.5px rgba(0,0,0,0.15)' }}
            >
              Teams Collection
            </motion.h3>

            <motion.div variants={itemVariants} className="flex justify-center mb-8">
              <motion.span
                className="h-1.5 w-36 rounded-full overflow-hidden relative"
                style={{
                  background:
                    'linear-gradient(90deg,#FFE29F 0%,#FFA600 30%,#FF6A3D 65%,#C2441E 100%)',
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isInView ? [0, 1.15, 1] : 0 }}
                transition={{
                  duration: 1.6,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
              />
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10"
            >
              Build your collection of favorite teams and never miss their latest updates!
            </motion.p>

            <motion.div variants={itemVariants} className="flex items-center gap-4 justify-center">
              <Link to="/favorites">
                <motion.div
                  className="px-8 py-4 rounded-2xl bg-[#FF6A3D] text-black font-semibold text-lg ring-1 ring-white/10 hover:brightness-110 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group cursor-pointer"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <span className="relative z-10">View All Favorites</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                </motion.div>
              </Link>

              <Link to="/clubs">
                <motion.div
                  className="px-8 py-4 rounded-2xl bg-white/10 text-white font-semibold text-lg ring-1 ring-white/15 hover:bg-white/15 backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  Explore More Teams
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
