import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { getUser, clearAuthAndRedirect } from '../helpers/auth.jsx';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Load user data from auth helper
  useEffect(() => {
    const userData = getUser();
    if (userData) {
      setUser(userData);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fade = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div variants={fade} initial="hidden" animate="show" className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-accent to-orange-500 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">
              {user?.fullname?.charAt(0)?.toUpperCase() || '👤'}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-white/60">Manage your account information</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          variants={fade}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
        >
          {/* Profile Information */}
          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Full Name</label>
              <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-white">{user?.fullname || 'N/A'}</p>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Email Address</label>
              <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-white">{user?.email || 'N/A'}</p>
              </div>
            </div>

            {/* Account Info */}
            <div className="pt-4 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Member Since
                  </label>
                  <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-white">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Account ID</label>
                  <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-white">#{user?.id || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-orange-500 text-white font-semibold rounded-xl hover:from-orange-500 hover:to-accent transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>←</span>
                <span>Back to Home</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  clearAuthAndRedirect(navigate, '/login');
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
