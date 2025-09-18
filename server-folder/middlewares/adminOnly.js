const { UnauthorizedError, ForbiddenError } = require('../helpers/customErrors');

/**
 * Middleware to check if user has admin role
 * Requires authentication middleware to run first to populate req.user
 */
const adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      throw new ForbiddenError('Access denied. Admin role required.');
    }
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Access denied. Admin role required.');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = adminOnly;
