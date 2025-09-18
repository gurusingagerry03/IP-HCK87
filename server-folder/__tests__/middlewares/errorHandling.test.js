const request = require('supertest');
const express = require('express');
const { errorHandling } = require('../../middlewares/errorHandling');

// Test environment
process.env.NODE_ENV = 'test';

describe('Error Handling Middleware', () => {
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
  });

  describe('Sequelize Error Handling', () => {
    it('should handle SequelizeUniqueConstraintError', async () => {
      app.get('/test-unique-error', (req, res, next) => {
        const error = new Error('Unique constraint failed');
        error.name = 'SequelizeUniqueConstraintError';
        error.errors = [{ path: 'email', message: 'Email address already in use!' }];
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-unique-error').expect(400);

      expect(response.body).toEqual({
        message: 'Validation error',
        errors: [{ field: 'email', message: 'Email address already in use!' }],
      });
    });

    it('should handle SequelizeValidationError', async () => {
      app.get('/test-validation-error', (req, res, next) => {
        const error = new Error('Validation failed');
        error.name = 'SequelizeValidationError';
        error.errors = [
          { path: 'email', message: 'Email is required' },
          { path: 'password', message: 'Password too short' },
        ];
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-validation-error').expect(400);

      expect(response.body).toEqual({
        message: 'Validation error',
        errors: [
          { field: 'email', message: 'Email is required' },
          { field: 'password', message: 'Password too short' },
        ],
      });
    });
  });

  describe('JSON Web Token Error Handling', () => {
    it('should handle JsonWebTokenError', async () => {
      app.get('/test-jwt-error', (req, res, next) => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-jwt-error').expect(401);

      expect(response.body).toEqual({
        message: 'invalid token',
      });
    });

    it('should handle TokenExpiredError', async () => {
      app.get('/test-token-expired', (req, res, next) => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-token-expired').expect(401);

      expect(response.body).toEqual({
        message: 'invalid token',
      });
    });
  });

  describe('Custom Error Handling', () => {
    it('should handle ForbiddenAccess', async () => {
      app.get('/test-forbidden-access', (req, res, next) => {
        const error = new Error('Access forbidden');
        error.name = 'ForbiddenAccess';
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-forbidden-access').expect(403);

      expect(response.body).toEqual({
        message: 'Forbidden Access',
        success: false,
      });
    });

    it('should handle NotFound', async () => {
      app.get('/test-not-found', (req, res, next) => {
        const error = new Error('Resource not found');
        error.name = 'NotFound';
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-not-found').expect(404);

      expect(response.body).toEqual({
        message: 'Resource not found',
        success: false,
      });
    });

    it('should handle BadRequest', async () => {
      app.get('/test-bad-request', (req, res, next) => {
        const error = new Error('Test bad request');
        error.name = 'BadRequest';
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-bad-request').expect(400);

      expect(response.body).toEqual({
        message: 'Test bad request',
      });
    });

    it('should handle Unauthorized', async () => {
      app.get('/test-unauthorized', (req, res, next) => {
        const error = new Error('Unauthorized access');
        error.name = 'Unauthorized';
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-unauthorized').expect(401);

      expect(response.body).toEqual({
        message: 'Unauthorized access',
      });
    });

    it('should handle Unauthorized without message (default)', async () => {
      app.get('/test-unauthorized-default', (req, res, next) => {
        const error = new Error();
        error.name = 'Unauthorized';
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-unauthorized-default').expect(401);

      expect(response.body).toEqual({
        message: 'Authentication required',
      });
    });

    it('should handle Forbidden', async () => {
      app.get('/test-forbidden', (req, res, next) => {
        const error = new Error('Access denied');
        error.name = 'Forbidden';
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-forbidden').expect(403);

      expect(response.body).toEqual({
        message: 'Access denied',
        success: false,
      });
    });

    it('should handle Forbidden without message (default)', async () => {
      app.get('/test-forbidden-default', (req, res, next) => {
        const error = new Error();
        error.name = 'Forbidden';
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-forbidden-default').expect(403);

      expect(response.body).toEqual({
        message: 'Access denied',
        success: false,
      });
    });

    it('should handle Conflict', async () => {
      app.get('/test-conflict', (req, res, next) => {
        const error = new Error('Resource conflict');
        error.name = 'Conflict';
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-conflict').expect(409);

      expect(response.body).toEqual({
        message: 'Resource conflict',
      });
    });

    it('should handle Conflict without message (default)', async () => {
      app.get('/test-conflict-default', (req, res, next) => {
        const error = new Error();
        error.name = 'Conflict';
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-conflict-default').expect(409);

      expect(response.body).toEqual({
        message: 'Resource conflict',
      });
    });

    it('should handle InvalidCredentialsError', async () => {
      app.get('/test-invalid-credentials', (req, res, next) => {
        const error = new Error('Credentials invalid');
        error.name = 'InvalidCredentialsError';
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-invalid-credentials').expect(401);

      expect(response.body).toEqual({
        message: 'Invalid email or password',
      });
    });
  });

  describe('Generic Error Handling', () => {
    it('should handle generic errors with default 500 status', async () => {
      app.get('/test-generic-error', (req, res, next) => {
        const error = new Error('Something went wrong');
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-generic-error').expect(500);

      expect(response.body).toEqual({
        message: 'internal server error',
      });
    });

    it('should handle unknown error names', async () => {
      app.get('/test-unknown-error', (req, res, next) => {
        const error = new Error('Unknown error');
        error.name = 'UnknownErrorType';
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-unknown-error').expect(500);

      expect(response.body).toEqual({
        message: 'internal server error',
      });
    });

    it('should handle errors without name property', async () => {
      app.get('/test-error-no-name', (req, res, next) => {
        const error = new Error('Error without name');
        delete error.name;
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-error-no-name').expect(500);

      expect(response.body).toEqual({
        message: 'internal server error',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle SequelizeValidationError with empty errors array', async () => {
      app.get('/test-empty-validation', (req, res, next) => {
        const error = new Error('Empty validation error');
        error.name = 'SequelizeValidationError';
        error.errors = [];
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-empty-validation').expect(400);

      expect(response.body).toEqual({
        message: 'Validation error',
        errors: [],
      });
    });

    it('should handle SequelizeUniqueConstraintError with empty errors array', async () => {
      app.get('/test-empty-unique', (req, res, next) => {
        const error = new Error('Empty unique constraint error');
        error.name = 'SequelizeUniqueConstraintError';
        error.errors = [];
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-empty-unique').expect(400);

      expect(response.body).toEqual({
        message: 'Validation error',
        errors: [],
      });
    });

    it('should handle errors with undefined message', async () => {
      app.get('/test-undefined-message', (req, res, next) => {
        const error = new Error();
        error.name = 'BadRequest';
        error.message = undefined;
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-undefined-message').expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle errors with null message', async () => {
      app.get('/test-null-message', (req, res, next) => {
        const error = new Error();
        error.name = 'NotFound';
        error.message = null;
        next(error);
      });
      app.use(errorHandling);

      const response = await request(app).get('/test-null-message').expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });
});
