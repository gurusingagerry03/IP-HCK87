import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
  });

  // Load user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setFormData({
          fullname: parsedUser.fullname || '',
          email: parsedUser.email || '',
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update user data in localStorage
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullname: user?.fullname || '',
      email: user?.email || '',
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

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
          {/* Status Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20"
            >
              <p className="text-green-400 text-sm">{success}</p>
            </motion.div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSave} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl border text-white placeholder-white/50 transition-all duration-300 ${
                  isEditing
                    ? 'bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent'
                    : 'bg-white/5 border-white/10 cursor-not-allowed'
                }`}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl border text-white placeholder-white/50 transition-all duration-300 ${
                  isEditing
                    ? 'bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent'
                    : 'bg-white/5 border-white/10 cursor-not-allowed'
                }`}
              />
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
              {!isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-orange-500 text-white font-semibold rounded-xl hover:from-orange-500 hover:to-accent transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>✏️</span>
                    <span>Edit Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Back to Home
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-xl hover:from-green-500 hover:to-green-400 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </form>

          {/* Danger Zone */}
          <div className="mt-8 pt-6 border-t border-red-500/20">
            <h3 className="text-red-400 font-semibold mb-4">Danger Zone</h3>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to logout?')) {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('user_data');
                  navigate('/login');
                }
              }}
              className="px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              🚪 Logout
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
