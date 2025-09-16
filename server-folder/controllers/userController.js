const { User } = require('../models');
const { comparePasswords, hashPassword } = require('../helpers/bcrypt');
const { generateToken } = require('../helpers/jwt');

class userController {
  static async register(req, res, next) {
    try {
      const { fullname, email, password } = req.body;

      if (!email?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Email required',
        });
      }

      if (!password?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Password required',
        });
      }

      const hashedPassword = await hashPassword(password);
      const user = await User.create({
        fullname,
        email,
        password: hashedPassword,
      });

      return res.status(201).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email required',
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password required',
        });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const access_token = generateToken({
        id: user.id,
        email: user.email,
      });

      return res.status(200).json({
        success: true,
        data: { access_token },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = userController;
