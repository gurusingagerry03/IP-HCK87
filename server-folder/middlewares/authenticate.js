// create middleware for authenticating users use helpers/jwt.js
const { verifyToken } = require('../helpers/jwt');
const { UnauthorizedError } = require('../helpers/customErrors');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided or invalid format', {
        providedValue: authHeader,
        expectedFormat: 'Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    // check apakah hasil decode ada di database
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new UnauthorizedError('User not found', {
        userId: decoded.id,
      });
    }
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
// --- IGNORE ---
