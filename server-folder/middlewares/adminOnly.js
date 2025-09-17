const { UnauthorizedError } = require('../helpers/customErrors');

/**
 * Middleware to check if user has admin role
 * Requires authentication middleware to run first to populate req.user
 */
const adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (req.user.role !== 'admin') {
      throw new UnauthorizedError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = adminOnly;
