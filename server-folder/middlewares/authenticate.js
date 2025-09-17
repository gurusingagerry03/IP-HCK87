const { verifyToken } = require('../helpers/jwt');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization;
    console.log(bearerToken, '<< ini bearer token');

    if (!bearerToken) {
      throw { name: 'JsonWebTokenError' };
    }
    const [type, token] = bearerToken.split(' ');
    const data = verifyToken(token);
    const user = await User.findByPk(data.id);
    if (!user) {
      throw { name: 'JsonWebTokenError' };
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };
// --- IGNORE ---
