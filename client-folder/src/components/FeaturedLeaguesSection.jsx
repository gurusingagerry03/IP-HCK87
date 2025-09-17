import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import http from '../helpers/http';

export function FeaturedLeaguesSection() {
  const [leagues, setLeagues] = useState([]);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const getLeagues = async () => {
    try {
      const response = await http.get('/leagues');
      setLeagues(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  };

  useEffect(() => {
    getLeagues();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.section
      ref={ref}
      className="relative min-h-[100svh] snap-start bg-[#111111] py-20 overflow-hidden"
      initial="hidden"
      animate={isInView ? 'show' : 'hidden'}
      variants={containerVariants}
    >
      <div className="mx-auto max-w-[1800px] 2xl:max-w-[1700px] px-4 sm:px-6 lg:px-10 2xl:px-14">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-3 mb-6"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <motion.div
              className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-2xl"
              animate={{ rotate: isInView ? [0, 10, -10, 0] : 0 }}
              transition={{ duration: 2, ease: 'easeInOut', delay: 0.5 }}
            >
              ⚽
            </motion.div>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-6xl font-extrabold leading-[1.1] text-white mb-4"
          >
            Featured
          </motion.h2>

          <motion.h3
            variants={itemVariants}
            className="text-4xl md:text-6xl font-extrabold leading-[1.1] bg-[linear-gradient(90deg,#FFE29F_0%,#FFA600_30%,#FF6A3D_65%,#C2441E_100%)] bg-clip-text text-transparent mb-6"
            style={{ WebkitTextStroke: '0.5px rgba(0,0,0,0.15)' }}
          >
            Leagues
          </motion.h3>

          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <motion.span
              className="h-1.5 w-28 rounded-full overflow-hidden relative"
              style={{
                background:
                  'linear-gradient(90deg,#FFE29F 0%,#FFA600 30%,#FF6A3D 65%,#C2441E 100%)',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: isInView ? [0, 1.2, 1] : 0 }}
              transition={{
                duration: 1.5,
                ease: 'easeInOut',
                delay: 0.8,
              }}
            />
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto"
          >
            Discover the world's most prestigious football leagues and competitions. From Premier
            League to Champions League, explore where legends are made.
          </motion.p>
        </motion.div>

        {/* Leagues Grid */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {leagues.map((league, index) => (
            <motion.div
              key={league.id}
              variants={cardVariants}
              className="group relative bg-card/30 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-accent/30 transition-all duration-300 overflow-hidden"
              whileHover={{
                y: -8,
                scale: 1.02,
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              custom={index}
            >
              {/* Background Gradient on Hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br from-yellow-500 to-red-600 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}
              />

              {/* Content - WRAP DENGAN LINK */}
              <Link to={`/leagues/${league.id}`} className="relative z-10 block">
                {/* League Logo & Flag */}
                <motion.div
                  className="flex items-center gap-4 mb-6"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <div className="w-16 h-16">
                    <img
                      src={league.logoUrl}
                      alt={league.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors duration-300">
                      {league.name}
                    </h3>
                    <p className="text-white/60 text-sm">{league.country}</p>
                  </div>
                </motion.div>

                {/* Description */}
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  {league.description ||
                    `${league.name} is one of the premier football competitions featuring top clubs from ${league.country}.`}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-accent font-semibold">
                        {league.Teams?.length || 20}
                      </span>
                      <span className="text-white/50 ml-1">teams</span>
                    </div>
                    <div>
                      <span className="text-accent font-semibold">1999</span>
                      <span className="text-white/50 ml-1">est.</span>
                    </div>
                  </div>

                  <motion.div
                    className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-accent/50 group-hover:bg-accent/10 transition-all duration-300"
                    whileHover={{ rotate: 90 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <span className="text-white/60 group-hover:text-accent transition-colors duration-300">
                      →
                    </span>
                  </motion.div>
                </div>
              </Link>

              {/* Hover shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA - UBAH KE LINK */}
        <motion.div variants={itemVariants} className="text-center mt-16">
          <Link
            to="/clubs"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-accent text-black font-semibold text-lg hover:brightness-110 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
          >
            <span className="relative z-10">Explore All Clubs</span>
            <motion.span
              className="relative z-10"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              →
            </motion.span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
