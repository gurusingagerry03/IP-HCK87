const { User } = require('../models');
const { hashPassword, comparePasswords } = require('../helpers/bcrypt');
const { generateToken } = require('../helpers/jwt');
const {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
  ConflictError,
} = require('../helpers/customErrors');

/**
 * User Controller - Handles user-related HTTP requests
 */
class UserController {
  /**
   * Get user by ID with detailed information
   * @route GET /api/users/:id
   */
  static async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      // Enhanced validation
      if (!id || isNaN(id) || parseInt(id) <= 0) {
        throw new BadRequestError('User ID must be a positive number', {
          providedValue: id,
          expectedFormat: 'positive integer',
        });
      }

      const user = await User.findByPk(parseInt(id), {
        attributes: ['id', 'fullname', 'email', 'profileImg', 'createdAt', 'updatedAt'],
      });

      if (!user) {
        throw new NotFoundError(`User with ID ${id} not found`, {
          resource: 'User',
          searchedId: id,
        });
      }

      // Calculate account age
      const accountAge = Math.floor(
        (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
      );

      res.status(200).json({
        success: true,
        data: {
          ...user.toJSON(),
          meta: {
            accountAgeInDays: accountAge,
            lastModified: user.updatedAt,
          },
        },
        message: `User details for ${user.fullname} retrieved successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register a new user
   * @route POST /api/users/register
   */
  static async register(req, res, next) {
    try {
      const { fullname, email, password } = req.body;

      const newUser = await User.create({
        fullname: fullname?.trim(),
        email: email?.trim(),
        password: password,
      });

      const token = generateToken({
        id: newUser.id,
        email: newUser.email,
        fullname: newUser.fullname,
      });

      res.status(201).json({
        success: true,
        data: {
          access_token: token,
          user: {
            id: newUser.id,
            fullname: newUser.fullname,
            email: newUser.email,
            createdAt: newUser.createdAt,
          },
        },
        message: `Welcome ${newUser.fullname}! Your account has been created successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user with enhanced security and information
   * @route POST /api/users/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Input validation
      if (!email?.trim() || !password) {
        throw new BadRequestError('Both email and password are required for login', {
          missingFields: [...(!email?.trim() ? ['email'] : []), ...(!password ? ['password'] : [])],
        });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new BadRequestError('Please provide a valid email address format');
      }

      const user = await User.findOne({
        where: { email: email.trim().toLowerCase() },
        attributes: ['id', 'fullname', 'email', 'password', 'createdAt', 'updatedAt'],
      });

      if (!user) {
        throw new UnauthorizedError(
          'Invalid email or password. Please check your credentials and try again'
        );
      }

      const isPasswordValid = await comparePasswords(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedError(
          'Invalid email or password. Please check your credentials and try again'
        );
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        fullname: user.fullname,
      });

      // Update last login (you might want to add this field to your User model)
      const loginTime = new Date();

      res.status(200).json({
        success: true,
        data: {
          access_token: token,
          user: {
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            lastLogin: loginTime,
          },
          session: {
            loginTime: loginTime,
            tokenExpiresIn: '24h', // Adjust based on your JWT config
          },
        },
        message: `Welcome back, ${user.fullname}! Login successful`,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
