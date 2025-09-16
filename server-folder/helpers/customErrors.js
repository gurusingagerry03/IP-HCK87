/**
 * Custom Error Classes for Better Error Handling
 */

class CustomError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends CustomError {
  constructor(message = 'Validation failed', fields = []) {
    super(message, 400);
    this.name = 'BadRequest';
    this.fields = fields;
  }
}

class NotFoundError extends CustomError {
  constructor(message = 'Resource not found', resource = null) {
    super(message, 404);
    this.name = 'NotFound';
    this.resource = resource;
  }
}

class UnauthorizedError extends CustomError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.name = 'Unauthorized';
  }
}

class ForbiddenError extends CustomError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'Forbidden';
  }
}

class ConflictError extends CustomError {
  constructor(message = 'Resource conflict', field = null) {
    super(message, 409);
    this.name = 'BadRequest';
    this.field = field;
  }
}

class BadRequestError extends CustomError {
  constructor(message = 'Invalid request', details = null) {
    super(message, 400);
    this.name = 'BadRequest';
    this.details = details;
  }
}

module.exports = {
  CustomError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
};
