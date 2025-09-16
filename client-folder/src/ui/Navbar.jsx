import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router';

const links = [
  { to: '/', label: 'Home' },
  { to: '/clubs', label: 'Clubs' },
  { to: '/favorites', label: 'Favorites', icon: '♡' },
  { to: '/chat', label: 'Chat AI', icon: '💬' },
];

const base =
  'px-6 py-3 rounded-2xl text-lg font-semibold tracking-wide transition-all duration-200';

const slideInLeftKeyframes = `
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Langsung ke atas (tanpa smooth) setiap route berubah
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const onNavigate = () => {
    window.scrollTo(0, 0); // langsung, no smooth
    setOpen(false);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: slideInLeftKeyframes }} />

      <nav className="sticky top-0 z-50 border-b border-white/[0.04] bg-field/60 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[1800px] 2xl:max-w-[1700px] px-4 sm:px-6 lg:px-10 2xl:px-14">
          <div className="h-20 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <NavLink to="/" onClick={onNavigate} className="flex items-center gap-2 group">
                <span className="grid place-items-center w-10 h-10 rounded-full bg-[--color-accent] text-[--color-field] text-lg font-bold transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12">
                  ⚽
                </span>
                <span className="text-2xl font-bold bg-[linear-gradient(180deg,#ffd7b0_10%,#ffb066_45%,#ff7a3d_90%)] bg-clip-text text-transparent">
                  FootballHub
                </span>
              </NavLink>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-3">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `${base} relative overflow-hidden group ${
                      isActive
                        ? 'bg-[linear-gradient(135deg,rgba(255,106,61,1),rgba(255,130,80,1))] text-[--color-field] shadow-[0_4px_14px_rgba(255,106,61,.25)] ring-1 ring-white/10 scale-[1.02]'
                        : 'text-white/70 hover:text-white hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="inline-flex items-center gap-1.5 relative z-10">
                        {l.icon && (
                          <span className="text-lg transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6">
                            {l.icon}
                          </span>
                        )}
                        <span>{l.label}</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                      {isActive && (
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-2xl blur-sm -z-10" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Login & Mobile Toggle */}
            <div className="flex items-center gap-3">
              <NavLink
                to="/login"
                onClick={onNavigate}
                className="hidden md:inline-flex px-6 py-3 rounded-2xl border border-[--color-accent]/60 text-[--color-accent] hover:bg-[--color-accent] hover:text-[--color-field] text-lg font-semibold tracking-wide transition-all duration-200 ml-auto hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_4px_20px_rgba(255,106,61,0.3)] relative overflow-hidden group"
              >
                <span className="relative z-10">Login</span>
                <div className="absolute inset-0 bg-[--color-accent] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </NavLink>

              <button
                onClick={() => setOpen(!open)}
                className="md:hidden p-3 rounded-xl hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-field] transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <span
                  className="block w-6 h-6 transition-transform duration-200"
                  style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
                >
                  {open ? '✕' : '☰'}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            className={`md:hidden overflow-hidden border-t border-white/[0.04] transition-all duration-300 ease-out ${
              open ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="py-3 space-y-2">
              {links.map((l, index) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-6 py-3 rounded-2xl text-lg font-semibold tracking-wide transition-all duration-200 ${
                      isActive
                        ? 'bg-[linear-gradient(135deg,rgba(255,106,61,1),rgba(255,130,80,1))] text-[--color-field] shadow-[0_4px_14px_rgba(255,106,61,.25)] ring-1 ring-white/10 scale-[1.01]'
                        : 'text-white/70 hover:text-white hover:bg-white/5 hover:translate-x-2 active:scale-[0.98]'
                    }`
                  }
                  style={{
                    animationDelay: open ? `${index * 50}ms` : '0ms',
                    animation: open ? 'slideInLeft 0.3s ease-out forwards' : 'none',
                  }}
                >
                  {l.icon && <span className="text-lg">{l.icon}</span>}
                  <span>{l.label}</span>
                </NavLink>
              ))}

              <div className="px-4 pt-2">
                <NavLink
                  to="/login"
                  onClick={onNavigate}
                  className="block w-full text-center px-6 py-3 rounded-2xl border border-[--color-accent]/60 text-[--color-accent] hover:bg-[--color-accent] hover:text-[--color-field] text-lg font-semibold tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Login
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
