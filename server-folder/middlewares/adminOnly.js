const { UnauthorizedError } = require('../helpers/customErrors');

/**
 * Middleware to check if user has admin role
 * Requires authentication middleware to run first to populate req.user
 */
const adminOnly = (req, res, next) => {
  try {
    // Check if user exists (should be set by authentication middleware)
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      throw new UnauthorizedError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = adminOnly;
