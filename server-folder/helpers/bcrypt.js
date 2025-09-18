const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 10;

module.exports = {
  hashPassword: async (password) => {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  },

  comparePasswords: async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
  },
};
