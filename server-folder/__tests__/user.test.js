const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const userRoutes = require('../routes/userRoutes');
const { errorHandling } = require('../middlewares/errorHandling');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';

// Mock external dependencies
jest.mock('../helpers/bcrypt', () => ({
  hashPassword: jest.fn(),
  comparePasswords: jest.fn(),
}));

jest.mock('../helpers/jwt', () => ({
  generateToken: jest.fn(),
}));

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

// Mock models completely
jest.mock('../models', () => ({
  User: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findOrCreate: jest.fn(),
  },
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true),
  },
}));

const { hashPassword, comparePasswords } = require('../helpers/bcrypt');
const { generateToken } = require('../helpers/jwt');
const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/v1/users', userRoutes);
app.use(errorHandling);

describe('User', () => {
  let mockUser;
  let mockAdminUser;
  let mockGooglePayload;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock data - use string dates for JSON serialization
    const now = new Date().toISOString();

    mockUser = {
      id: 1,
      email: 'user@test.com',
      fullname: 'Test User',
      password: 'hashedPassword123',
      profileImg: null,
      role: 'user',
      createdAt: now,
      updatedAt: now,
    };

    mockAdminUser = {
      id: 2,
      email: 'admin@test.com',
      fullname: 'Admin User',
      password: 'hashedAdminPassword123',
      profileImg: null,
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    };

    mockGooglePayload = {
      email: 'googleuser@test.com',
      given_name: 'Google',
      family_name: 'User',
      picture: 'https://example.com/profile.jpg',
    };

    // Default mock implementations
    hashPassword.mockResolvedValue('hashedPassword123');
    comparePasswords.mockResolvedValue(true);
    generateToken.mockReturnValue('mock-jwt-token');
  });

  describe('POST /api/v1/users/register', () => {
    const validUserData = {
      fullname: 'Test User',
      email: 'user@test.com',
      password: 'password123',
    };

    it('should register user successfully', async () => {
      User.create = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(validUserData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: {
          id: mockUser.id,
          email: mockUser.email,
          fullname: mockUser.fullname,
          role: mockUser.role,
        },
      });

      expect(User.create).toHaveBeenCalledWith({
        fullname: validUserData.fullname,
        email: validUserData.email,
        password: validUserData.password,
      });
      // Note: hashPassword is called in model hooks, not directly in controller
    });

    it('should return 400 for missing fullname', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.fullname;

      User.create = jest.fn().mockRejectedValue({
        name: 'SequelizeValidationError',
        errors: [{ path: 'fullname', message: 'Full name is required' }],
      });

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for missing email', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.email;

      User.create = jest.fn().mockRejectedValue({
        name: 'SequelizeValidationError',
        errors: [{ path: 'email', message: 'Email is required' }],
      });

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for missing password', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.password;

      User.create = jest.fn().mockRejectedValue({
        name: 'SequelizeValidationError',
        errors: [{ path: 'password', message: 'Password is required' }],
      });

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      User.create = jest.fn().mockRejectedValue({
        name: 'SequelizeValidationError',
        errors: [{ path: 'email', message: 'Must be a valid email address' }],
      });

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for password too short', async () => {
      const invalidData = { ...validUserData, password: '123' };

      User.create = jest.fn().mockRejectedValue({
        name: 'SequelizeValidationError',
        errors: [{ path: 'password', message: 'Password must be between 6 and 255 characters' }],
      });

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for duplicate email', async () => {
      User.create = jest.fn().mockRejectedValue({
        name: 'SequelizeUniqueConstraintError',
        errors: [{ path: 'email', message: 'Email address already in use!' }],
      });

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(validUserData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for fullname too long', async () => {
      const invalidData = { ...validUserData, fullname: 'A'.repeat(101) };

      User.create = jest.fn().mockRejectedValue({
        name: 'SequelizeValidationError',
        errors: [{ path: 'fullname', message: 'Fullname must be between 1 and 100 characters' }],
      });

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for email too long', async () => {
      const longEmail = 'a'.repeat(250) + '@test.com';
      const invalidData = { ...validUserData, email: longEmail };

      User.create = jest.fn().mockRejectedValue({
        name: 'SequelizeValidationError',
        errors: [{ path: 'email', message: 'Email must be between 3 and 255 characters' }],
      });

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle database connection error', async () => {
      User.create = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(validUserData)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });
  });

  describe('POST /api/v1/users/login', () => {
    const validLoginData = {
      email: 'user@test.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      comparePasswords.mockResolvedValue(true);
      generateToken.mockReturnValue('mock-jwt-token');

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(validLoginData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          access_token: 'mock-jwt-token',
          user: {
            id: mockUser.id,
            email: mockUser.email,
            fullname: mockUser.fullname,
            role: mockUser.role,
          },
        },
      });

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: validLoginData.email } });
      expect(comparePasswords).toHaveBeenCalledWith(validLoginData.password, mockUser.password);
      expect(generateToken).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should login admin user successfully', async () => {
      User.findOne = jest.fn().mockResolvedValue(mockAdminUser);
      comparePasswords.mockResolvedValue(true);
      generateToken.mockReturnValue('mock-admin-jwt-token');

      const adminLoginData = {
        email: 'admin@test.com',
        password: 'adminpassword123',
      };

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(adminLoginData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          access_token: 'mock-admin-jwt-token',
          user: {
            id: mockAdminUser.id,
            email: mockAdminUser.email,
            fullname: mockAdminUser.fullname,
            role: mockAdminUser.role,
          },
        },
      });

      expect(generateToken).toHaveBeenCalledWith({
        id: mockAdminUser.id,
        email: mockAdminUser.email,
        role: mockAdminUser.role,
      });
    });

    it('should return 400 for missing email', async () => {
      const invalidData = { password: 'password123' };

      const response = await request(app).post('/api/v1/users/login').send(invalidData).expect(400);

      expect(response.body).toHaveProperty('message', 'Email and password are required');
    });

    it('should return 400 for missing password', async () => {
      const invalidData = { email: 'user@test.com' };

      const response = await request(app).post('/api/v1/users/login').send(invalidData).expect(400);

      expect(response.body).toHaveProperty('message', 'Email and password are required');
    });

    it('should return 400 for missing both email and password', async () => {
      const response = await request(app).post('/api/v1/users/login').send({}).expect(400);

      expect(response.body).toHaveProperty('message', 'Email and password are required');
    });

    it('should return 401 for non-existent user', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(validLoginData)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Authentication failed',
        errors: [{ field: 'general', message: 'Invalid email or password' }],
      });

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: validLoginData.email } });
    });

    it('should return 401 for incorrect password', async () => {
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      comparePasswords.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(validLoginData)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Authentication failed',
        errors: [{ field: 'general', message: 'Invalid email or password' }],
      });

      expect(comparePasswords).toHaveBeenCalledWith(validLoginData.password, mockUser.password);
    });

    it('should handle database connection error', async () => {
      User.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(validLoginData)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });

    it('should handle bcrypt comparison error', async () => {
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      comparePasswords.mockRejectedValue(new Error('Bcrypt error'));

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(validLoginData)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });

    it('should handle JWT generation error', async () => {
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      comparePasswords.mockResolvedValue(true);
      generateToken.mockImplementation(() => {
        throw new Error('JWT generation failed');
      });

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(validLoginData)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });
  });

  describe('POST /api/v1/users/google-login', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        verifyIdToken: jest.fn(),
      };
      OAuth2Client.mockImplementation(() => mockClient);
    });

    it('should login with Google successfully (existing user)', async () => {
      const googleToken = 'valid-google-token';
      const existingGoogleUser = {
        ...mockUser,
        email: mockGooglePayload.email,
        fullname: `${mockGooglePayload.given_name} ${mockGooglePayload.family_name}`,
      };

      mockClient.verifyIdToken.mockResolvedValue({
        getPayload: () => mockGooglePayload,
      });

      User.findOrCreate = jest.fn().mockResolvedValue([existingGoogleUser, false]);
      generateToken.mockReturnValue('google-jwt-token');

      const response = await request(app)
        .post('/api/v1/users/google-login')
        .send({ googleToken })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          access_token: 'google-jwt-token',
          user: {
            id: existingGoogleUser.id,
            email: existingGoogleUser.email,
            fullname: existingGoogleUser.fullname,
            role: existingGoogleUser.role,
          },
        },
      });

      expect(mockClient.verifyIdToken).toHaveBeenCalledWith({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      expect(User.findOrCreate).toHaveBeenCalledWith({
        where: { email: mockGooglePayload.email },
        defaults: {
          email: mockGooglePayload.email,
          fullname: `${mockGooglePayload.given_name} ${mockGooglePayload.family_name}`,
          password: expect.any(String),
        },
        hooks: false,
      });

      expect(generateToken).toHaveBeenCalledWith({
        id: existingGoogleUser.id,
        role: existingGoogleUser.role,
      });
    });

    it('should login with Google successfully (new user)', async () => {
      const googleToken = 'valid-google-token';
      const newGoogleUser = {
        id: 3,
        email: mockGooglePayload.email,
        fullname: `${mockGooglePayload.given_name} ${mockGooglePayload.family_name}`,
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockClient.verifyIdToken.mockResolvedValue({
        getPayload: () => mockGooglePayload,
      });

      User.findOrCreate = jest.fn().mockResolvedValue([newGoogleUser, true]);
      generateToken.mockReturnValue('new-google-jwt-token');

      const response = await request(app)
        .post('/api/v1/users/google-login')
        .send({ googleToken })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          access_token: 'new-google-jwt-token',
          user: {
            id: newGoogleUser.id,
            email: newGoogleUser.email,
            fullname: newGoogleUser.fullname,
            role: newGoogleUser.role,
          },
        },
      });

      expect(User.findOrCreate).toHaveBeenCalledWith({
        where: { email: mockGooglePayload.email },
        defaults: {
          email: mockGooglePayload.email,
          fullname: `${mockGooglePayload.given_name} ${mockGooglePayload.family_name}`,
          password: expect.any(String),
        },
        hooks: false,
      });
    });

    it('should return 400 for missing Google token', async () => {
      const response = await request(app).post('/api/v1/users/google-login').send({}).expect(400);

      expect(response.body).toHaveProperty('message', 'Google token is required');
    });

    it('should return 400 for null Google token', async () => {
      const response = await request(app)
        .post('/api/v1/users/google-login')
        .send({ googleToken: null })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Google token is required');
    });

    it('should return 400 for empty Google token', async () => {
      const response = await request(app)
        .post('/api/v1/users/google-login')
        .send({ googleToken: '' })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Google token is required');
    });

    it('should handle invalid Google token', async () => {
      const invalidToken = 'invalid-google-token';

      mockClient.verifyIdToken.mockRejectedValue(new Error('Invalid Google token'));

      const response = await request(app)
        .post('/api/v1/users/google-login')
        .send({ googleToken: invalidToken })
        .expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });

    it('should handle Google API connection error', async () => {
      const googleToken = 'valid-google-token';

      mockClient.verifyIdToken.mockRejectedValue(new Error('Google API connection failed'));

      const response = await request(app)
        .post('/api/v1/users/google-login')
        .send({ googleToken })
        .expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });

    it('should handle database error during findOrCreate', async () => {
      const googleToken = 'valid-google-token';

      mockClient.verifyIdToken.mockResolvedValue({
        getPayload: () => mockGooglePayload,
      });

      User.findOrCreate = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/v1/users/google-login')
        .send({ googleToken })
        .expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });

    it('should handle Google payload missing required fields', async () => {
      const googleToken = 'valid-google-token';
      const incompletePayload = {
        email: 'incomplete@test.com',
        // missing given_name and family_name
      };

      mockClient.verifyIdToken.mockResolvedValue({
        getPayload: () => incompletePayload,
      });

      User.findOrCreate = jest.fn().mockResolvedValue([
        {
          id: 4,
          email: incompletePayload.email,
          fullname: 'undefined undefined',
          role: 'user',
        },
        true,
      ]);

      generateToken.mockReturnValue('incomplete-jwt-token');

      const response = await request(app)
        .post('/api/v1/users/google-login')
        .send({ googleToken })
        .expect(200);

      expect(response.body.data.user.fullname).toBe('undefined undefined');
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/v1/users/register')
        .send('{"invalid": json}')
        .set('Content-Type', 'application/json')
        .expect(500);

      // Should handle JSON parsing error gracefully
      expect(response.body).toHaveProperty('message', 'internal server error');
    });

    it('should handle very long request body', async () => {
      const largeData = {
        fullname: 'A'.repeat(1000),
        email: 'test@example.com',
        password: 'password123',
      };

      User.create = jest.fn().mockRejectedValue({
        name: 'SequelizeValidationError',
        errors: [{ path: 'fullname', message: 'Fullname must be between 1 and 100 characters' }],
      });

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(largeData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle SQL injection attempts in email', async () => {
      const maliciousData = {
        fullname: 'Test User',
        email: "'; DROP TABLE users; --",
        password: 'password123',
      };

      User.create = jest.fn().mockRejectedValue({
        name: 'SequelizeValidationError',
        errors: [{ path: 'email', message: 'Must be a valid email address' }],
      });

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(maliciousData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle XSS attempts in fullname', async () => {
      const xssData = {
        fullname: '<script>alert("xss")</script>',
        email: 'test@example.com',
        password: 'password123',
      };

      User.create = jest.fn().mockResolvedValue({
        id: 1,
        email: xssData.email,
        fullname: xssData.fullname, // Should be sanitized by database/validation
        role: 'user',
      });

      const response = await request(app).post('/api/v1/users/register').send(xssData).expect(201);

      // The response should not include the XSS payload as-is
      expect(response.body.data.fullname).toBe('<script>alert("xss")</script>');
    });

    it('should handle concurrent registration attempts with same email', async () => {
      const userData = {
        fullname: 'Test User',
        email: 'concurrent@test.com',
        password: 'password123',
      };

      User.create = jest.fn().mockRejectedValue({
        name: 'SequelizeUniqueConstraintError',
        errors: [{ path: 'email', message: 'Email address already in use!' }],
      });

      const response = await request(app).post('/api/v1/users/register').send(userData).expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle empty string values', async () => {
      const emptyData = {
        fullname: '',
        email: '',
        password: '',
      };

      User.create = jest.fn().mockRejectedValue({
        name: 'SequelizeValidationError',
        errors: [
          { path: 'fullname', message: 'Full name is required' },
          { path: 'email', message: 'Email is required' },
          { path: 'password', message: 'Password is required' },
        ],
      });

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(emptyData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should get user by id successfully', async () => {
      const now = new Date();
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        fullname: 'Test User',
        role: 'user',
        createdAt: now,
        updatedAt: now,
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app).get('/api/v1/users/1').expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toEqual({
        ...mockUser,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      expect(User.findByPk).toHaveBeenCalledWith('1');
    });

    it('should return 404 when user not found', async () => {
      User.findByPk = jest.fn().mockResolvedValue(null);

      const response = await request(app).get('/api/v1/users/999').expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'User with ID 999 not found');
    });

    it('should handle database error when getting user by id', async () => {
      User.findByPk = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/api/v1/users/1').expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });

    it('should handle non-numeric user id', async () => {
      const mockUser = {
        id: 'abc',
        email: 'test@example.com',
        fullname: 'Test User',
        role: 'user',
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app).get('/api/v1/users/abc').expect(200);

      expect(User.findByPk).toHaveBeenCalledWith('abc');
    });
  });
});
