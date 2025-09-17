const { User } = require('../models');
const { comparePasswords, hashPassword } = require('../helpers/bcrypt');
const { generateToken } = require('../helpers/jwt');
const { OAuth2Client } = require('google-auth-library');
const { BadRequestError, UnauthorizedError } = require('../helpers/customErrors');

class userController {
  static async googleLogin(req, res, next) {
    try {
      const { googleToken } = req.body;
      if (!googleToken) {
        throw { name: 'BadRequest', message: 'Google token is required' };
      }
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      // CEK USER SUDAH ADA ATAU BELUM
      const [user, created] = await User.findOrCreate({
        where: { email: payload.email },
        defaults: {
          email: payload.email,
          fullname: `${payload.given_name} ${payload.family_name}`,
          password: Math.random().toString(36).slice(-8),
        },
        hooks: false,
      });
      console.log(user, '<<< user google');

      return res.status(200).json({
        success: true,
        data: {
          access_token: generateToken({ id: user.id, role: user.role }),
          user: {
            id: user.id,
            email: user.email,
            fullname: user.fullname,
            role: user.role,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async register(req, res, next) {
    try {
      const { fullname, email, password } = req.body;

      const user = await User.create({
        fullname,
        email,
        password,
      });

      return res.status(201).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new BadRequestError('Email and password are required');
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed',
          errors: [{ field: 'general', message: 'Invalid email or password' }],
        });
      }

      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed',
          errors: [{ field: 'general', message: 'Invalid email or password' }],
        });
      }

      const access_token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return res.status(200).json({
        success: true,
        data: {
          access_token,
          user: {
            id: user.id,
            email: user.email,
            fullname: user.fullname,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  //get user by id
  static async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id); // Fetch user by primary key (id)

      if (!user) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = userController;
