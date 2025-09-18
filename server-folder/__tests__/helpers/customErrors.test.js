const {
  CustomError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} = require('../../helpers/customErrors');

describe('Custom Errors Tests', () => {
  describe('CustomError', () => {
    it('should create a basic custom error with default status code', () => {
      const message = 'Something went wrong';
      const error = new CustomError(message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CustomError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });

    it('should create a custom error with specific status code', () => {
      const message = 'Custom error message';
      const statusCode = 418;
      const error = new CustomError(message, statusCode);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(statusCode);
      expect(error.isOperational).toBe(true);
    });

    it('should capture stack trace', () => {
      const error = new CustomError('Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Test error');
    });

    it('should handle empty message', () => {
      const error = new CustomError('');

      expect(error.message).toBe('');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should handle null message', () => {
      const error = new CustomError(null);

      expect(error.message).toBe('null');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with default message', () => {
      const error = new ValidationError();

      expect(error).toBeInstanceOf(CustomError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('BadRequest');
      expect(error.fields).toEqual([]);
      expect(error.isOperational).toBe(true);
    });

    it('should create validation error with custom message', () => {
      const message = 'Email is required';
      const error = new ValidationError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('BadRequest');
    });

    it('should create validation error with fields', () => {
      const message = 'Multiple validation errors';
      const fields = ['email', 'password', 'name'];
      const error = new ValidationError(message, fields);

      expect(error.message).toBe(message);
      expect(error.fields).toEqual(fields);
      expect(error.statusCode).toBe(400);
    });

    it('should handle empty fields array', () => {
      const error = new ValidationError('Test message', []);

      expect(error.fields).toEqual([]);
    });

    it('should handle single field', () => {
      const error = new ValidationError('Email validation failed', ['email']);

      expect(error.fields).toEqual(['email']);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with default message', () => {
      const error = new NotFoundError();

      expect(error).toBeInstanceOf(CustomError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFound');
      expect(error.resource).toBe(null);
      expect(error.isOperational).toBe(true);
    });

    it('should create not found error with custom message', () => {
      const message = 'User not found';
      const error = new NotFoundError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFound');
    });

    it('should create not found error with resource info', () => {
      const message = 'Team not found';
      const resource = 'teams/123';
      const error = new NotFoundError(message, resource);

      expect(error.message).toBe(message);
      expect(error.resource).toBe(resource);
      expect(error.statusCode).toBe(404);
    });

    it('should handle object as resource', () => {
      const resource = { type: 'user', id: 123 };
      const error = new NotFoundError('User not found', resource);

      expect(error.resource).toEqual(resource);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with default message', () => {
      const error = new UnauthorizedError();

      expect(error).toBeInstanceOf(CustomError);
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('Unauthorized');
      expect(error.isOperational).toBe(true);
    });

    it('should create unauthorized error with custom message', () => {
      const message = 'Invalid credentials';
      const error = new UnauthorizedError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('Unauthorized');
    });

    it('should create unauthorized error for token expiry', () => {
      const message = 'Token has expired';
      const error = new UnauthorizedError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('should create forbidden error with default message', () => {
      const error = new ForbiddenError();

      expect(error).toBeInstanceOf(CustomError);
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('Forbidden');
      expect(error.isOperational).toBe(true);
    });

    it('should create forbidden error with custom message', () => {
      const message = 'Insufficient permissions';
      const error = new ForbiddenError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('Forbidden');
    });

    it('should create forbidden error for admin access', () => {
      const message = 'Admin access required';
      const error = new ForbiddenError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(403);
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error with default message', () => {
      const error = new ConflictError();

      expect(error).toBeInstanceOf(CustomError);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('Resource conflict');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('Conflict');
      expect(error.field).toBe(null);
      expect(error.isOperational).toBe(true);
    });

    it('should create conflict error with custom message', () => {
      const message = 'Email already exists';
      const error = new ConflictError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('Conflict');
    });

    it('should create conflict error with field info', () => {
      const message = 'Username already taken';
      const field = 'username';
      const error = new ConflictError(message, field);

      expect(error.message).toBe(message);
      expect(error.field).toBe(field);
      expect(error.statusCode).toBe(409);
    });

    it('should handle object as field', () => {
      const field = { name: 'email', value: 'test@example.com' };
      const error = new ConflictError('Email conflict', field);

      expect(error.field).toEqual(field);
    });
  });

  describe('BadRequestError', () => {
    it('should create bad request error with default message', () => {
      const error = new BadRequestError();

      expect(error).toBeInstanceOf(CustomError);
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Invalid request');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('BadRequest');
      expect(error.details).toBe(null);
      expect(error.isOperational).toBe(true);
    });

    it('should create bad request error with custom message', () => {
      const message = 'Invalid input format';
      const error = new BadRequestError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('BadRequest');
    });

    it('should create bad request error with details', () => {
      const message = 'Validation failed';
      const details = { field: 'email', reason: 'invalid format' };
      const error = new BadRequestError(message, details);

      expect(error.message).toBe(message);
      expect(error.details).toEqual(details);
      expect(error.statusCode).toBe(400);
    });

    it('should handle string details', () => {
      const details = 'Missing required parameter: id';
      const error = new BadRequestError('Bad request', details);

      expect(error.details).toBe(details);
    });

    it('should handle array details', () => {
      const details = ['email is required', 'password too short'];
      const error = new BadRequestError('Multiple errors', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('Error Inheritance Chain', () => {
    it('should maintain proper inheritance for all error types', () => {
      const errors = [
        new ValidationError(),
        new NotFoundError(),
        new UnauthorizedError(),
        new ForbiddenError(),
        new ConflictError(),
        new BadRequestError(),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(CustomError);
        expect(error.isOperational).toBe(true);
        expect(error.statusCode).toBeDefined();
        expect(error.name).toBeDefined();
      });
    });

    it('should have unique status codes for different error types', () => {
      const statusCodes = [
        new ValidationError().statusCode,
        new NotFoundError().statusCode,
        new UnauthorizedError().statusCode,
        new ForbiddenError().statusCode,
        new ConflictError().statusCode,
        new BadRequestError().statusCode,
      ];

      // Check specific status codes
      expect(statusCodes).toContain(400); // ValidationError and BadRequestError
      expect(statusCodes).toContain(401); // UnauthorizedError
      expect(statusCodes).toContain(403); // ForbiddenError
      expect(statusCodes).toContain(404); // NotFoundError
      expect(statusCodes).toContain(409); // ConflictError
    });

    it('should throw and catch custom errors properly', () => {
      const testError = () => {
        throw new NotFoundError('Test not found error');
      };

      expect(testError).toThrow(NotFoundError);
      expect(testError).toThrow(CustomError);
      expect(testError).toThrow('Test not found error');

      try {
        testError();
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect(error.statusCode).toBe(404);
        expect(error.isOperational).toBe(true);
      }
    });
  });
});
