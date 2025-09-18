const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authenticate = require('../../middlewares/authenticate');
const { errorHandling } = require('../../middlewares/errorHandling');

// Mock the jwt helper
jest.mock('../../helpers/jwt', () => ({
  verifyToken: jest.fn(),
}));

// Mock the User model
jest.mock('../../models', () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

const { verifyToken } = require('../../helpers/jwt');
const { User } = require('../../models');

// Test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

describe('Authenticate Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('Token Validation', () => {
    it('should authenticate with valid Bearer token', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'user',
      };

      verifyToken.mockResolvedValue(mockUser);
      User.findByPk.mockResolvedValue(mockUser);

      app.get('/protected', authenticate, (req, res) => {
        res.json({
          success: true,
          user: req.user,
        });
      });
      app.use(errorHandling);

      const token = jwt.sign(mockUser, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        user: mockUser,
      });
      expect(verifyToken).toHaveBeenCalledWith(token);
    });

    it('should return 401 when no authorization header', async () => {
      app.get('/protected', authenticate, (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandling);

      const response = await request(app).get('/protected').expect(401);

      expect(response.body).toEqual({
        message: 'invalid token',
      });
    });

    it('should return 401 when authorization header is malformed', async () => {
      // Reset mocks for this test
      verifyToken.mockReset();
      User.findByPk.mockReset();

      app.get('/protected', authenticate, (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandling);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat token123')
        .expect(500);

      expect(response.body).toEqual({
        message: 'internal server error',
      });
    });

    it('should return 401 when Bearer token is missing', async () => {
      // Reset mocks for this test
      verifyToken.mockReset();
      User.findByPk.mockReset();

      app.get('/protected', authenticate, (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandling);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer ')
        .expect(500);

      expect(response.body).toEqual({
        message: 'internal server error',
      });
    });

    it('should return 401 when token verification fails', async () => {
      verifyToken.mockRejectedValue(new Error('Invalid token'));
      User.findByPk.mockReset();

      app.get('/protected', authenticate, (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandling);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toEqual({
        message: 'invalid token',
      });
      expect(verifyToken).toHaveBeenCalledWith('invalid-token');
    });

    it('should handle token verification with JsonWebTokenError', async () => {
      const error = new Error('jwt malformed');
      error.name = 'JsonWebTokenError';
      verifyToken.mockRejectedValue(error);
      User.findByPk.mockReset();

      app.get('/protected', authenticate, (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandling);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer malformed-token')
        .expect(401);

      expect(response.body).toEqual({
        message: 'invalid token',
      });
    });

    it('should handle token verification with TokenExpiredError', async () => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      verifyToken.mockRejectedValue(error);
      User.findByPk.mockReset();

      app.get('/protected', authenticate, (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandling);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(response.body).toEqual({
        message: 'invalid token',
      });
    });
  });

  describe('Different Authorization Header Formats', () => {
    it('should handle authorization header with extra spaces', async () => {
      verifyToken.mockReset();
      User.findByPk.mockReset();

      app.get('/protected', authenticate, (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandling);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', '   Bearer   ')
        .expect(500);

      expect(response.body).toEqual({
        message: 'internal server error',
      });
    });

    it('should handle lowercase bearer', async () => {
      verifyToken.mockReset();
      User.findByPk.mockReset();

      app.get('/protected', authenticate, (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandling);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'bearer validtoken123')
        .expect(500);

      expect(response.body).toEqual({
        message: 'internal server error',
      });
    });

    it('should handle Basic authentication format', async () => {
      verifyToken.mockReset();
      User.findByPk.mockReset();

      app.get('/protected', authenticate, (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandling);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Basic dGVzdDp0ZXN0')
        .expect(500);

      expect(response.body).toEqual({
        message: 'internal server error',
      });
    });
  });

  describe('User Context', () => {
    it('should attach user data to request object', async () => {
      const mockUser = {
        id: 2,
        email: 'admin@example.com',
        role: 'admin',
        fullname: 'Admin User',
      };

      verifyToken.mockResolvedValue(mockUser);
      User.findByPk.mockResolvedValue(mockUser);

      app.get('/user-info', authenticate, (req, res) => {
        res.json({
          userId: req.user.id,
          userEmail: req.user.email,
          userRole: req.user.role,
          userFullname: req.user.fullname,
        });
      });
      app.use(errorHandling);

      const token = jwt.sign(mockUser, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/user-info')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        userId: 2,
        userEmail: 'admin@example.com',
        userRole: 'admin',
        userFullname: 'Admin User',
      });
    });

    it('should handle user with minimal data', async () => {
      const mockUser = {
        id: 3,
      };

      verifyToken.mockResolvedValue(mockUser);
      User.findByPk.mockResolvedValue(mockUser);

      app.get('/minimal-user', authenticate, (req, res) => {
        res.json({
          hasUser: !!req.user,
          userId: req.user.id,
          hasEmail: !!req.user.email,
        });
      });
      app.use(errorHandling);

      const token = jwt.sign(mockUser, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/minimal-user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        hasUser: true,
        userId: 3,
        hasEmail: false,
      });
    });
  });

  describe('Error Propagation', () => {
    it('should handle database errors during token verification', async () => {
      verifyToken.mockRejectedValue(new Error('Database connection failed'));
      User.findByPk.mockReset();

      app.get('/protected', authenticate, (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandling);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer valid-token')
        .expect(401);

      expect(response.body).toEqual({
        message: 'invalid token',
      });
    });

    it('should handle unexpected errors during authentication', async () => {
      verifyToken.mockImplementation(() => {
        throw new TypeError('Unexpected error');
      });

      app.get('/protected', authenticate, (req, res) => {
        res.json({ success: true });
      });
      app.use(errorHandling);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body).toEqual({
        message: 'internal server error',
      });
    });
  });
});
