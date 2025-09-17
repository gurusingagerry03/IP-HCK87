import { motion } from 'framer-motion';
import { Link } from 'react-router';

export function HomeSection() {
  const hero =
    'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?q=80&w=1920&auto=format&fit=crop';

  const fastContainer = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.08 },
    },
  };
  const fastItem = {
    hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative isolate h-[100svh] snap-start overflow-hidden bg-field"
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #0b0b0b 0%, #0d0e0f 28%, #101113 55%, #121315 100%)',
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(140% 70% at 50% 115%, rgba(255,255,255,0.035), transparent 65%)',
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Konten utama di atas overlay */}
      <div className="relative z-10 mx-auto max-w-[1800px] 2xl:max-w-[1700px] px-4 sm:px-6 lg:px-10 2xl:px-14 h-full flex items-center">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(520px,680px)_minmax(720px,1fr)]">
          {/* Left: Headings */}
          <motion.div
            variants={fastContainer}
            initial="hidden"
            animate="show"
            className="self-center text-center lg:text-left lg:-mt-2"
          >
            <motion.h1
              variants={fastItem}
              className="text-5xl md:text-7xl font-extrabold leading-[1.05] text-white"
            >
              The Ultimate
            </motion.h1>

            <motion.h2
              variants={fastItem}
              className="text-5xl md:text-7xl font-extrabold leading-[1.05] bg-[linear-gradient(90deg,#FFE29F_0%,#FFA600_30%,#FF6A3D_65%,#C2441E_100%)] bg-clip-text text-transparent"
              style={{ WebkitTextStroke: '0.5px rgba(0,0,0,0.15)' }}
            >
              Ninety Minutes
            </motion.h2>

            <motion.div variants={fastItem} className="mt-5 flex justify-center lg:justify-start">
              <motion.span
                className="h-1.5 w-28 rounded-full overflow-hidden relative origin-center lg:origin-left"
                style={{
                  background:
                    'linear-gradient(90deg,#FFE29F 0%,#FFA600 30%,#FF6A3D 65%,#C2441E 100%)',
                }}
                initial={{ opacity: 1, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: [1, 1.3, 1] }}
                transition={{
                  duration: 2.2,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatType: 'mirror',
                }}
              >
                <motion.i
                  className="absolute inset-y-0 left-0 w-10"
                  style={{
                    background:
                      'linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent)',
                  }}
                  animate={{ x: ['-2rem', '8rem'] }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    ease: 'linear',
                    repeatType: 'mirror',
                  }}
                />
              </motion.span>
            </motion.div>

            <motion.p
              variants={fastItem}
              className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl mx-auto lg:mx-0"
            >
              Discover leagues, explore clubs, and dive deep into the world of football with our
              comprehensive platform.
            </motion.p>

            <motion.div
              variants={fastItem}
              className="mt-8 flex items-center gap-3 justify-center lg:justify-start"
            >
              <Link
                to="/leagues"
                className="px-5 py-3 rounded-2xl bg-[#FF6A3D] text-black font-semibold ring-1 ring-white/10 hover:brightness-110 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Explore Leagues
              </Link>
              <Link
                to="/favorites"
                className="px-5 py-3 rounded-2xl bg-white/10 text-white font-semibold ring-1 ring-white/15 hover:bg-white/15 backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Favorites
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Image */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9, rotate: -2, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative self-center lg:justify-self-end"
          >
            <motion.div
              animate={{ y: [0, -6, 0], scale: [1, 1.005, 1] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <div className="pointer-events-none absolute -inset-12 -z-10" />
              <motion.img
                src={hero}
                alt="Stadium"
                className="w-full max-h-[60vh] aspect-[16/9] object-cover rounded-[32px] ring-1"
                loading="eager"
              />
              <motion.div
                className="absolute inset-0 rounded-[32px] pointer-events-none"
                animate={{ opacity: [0.05, 0.15, 0.05] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background:
                    'radial-gradient(60% 50% at 30% 20%, rgba(255,255,255,.03), transparent 60%)',
                }}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll hint (pastikan di atas overlay) */}
      <motion.div
        className="absolute z-20 bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm tracking-wide"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="mx-auto h-10 w-6 rounded-full ring-1 ring-white/20 flex items-start justify-center"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="mt-1 block h-2 w-1 rounded-full bg-white/60" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
