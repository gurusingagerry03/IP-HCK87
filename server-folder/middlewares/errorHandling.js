function errorHandling(err, req, res, next) {
  const timestamp = new Date().toISOString();
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  };

  console.error('Error Details:', {
    timestamp,
    error: err.name,
    message: err.message,
    request: requestInfo,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  switch (err.name) {
    case 'SequelizeValidationError':
      res.status(400).json({
        success: false,
        message: 'Data validation failed',
        error: 'VALIDATION_ERROR',
        details: {
          description: 'The provided data does not meet the required validation criteria',
          fields: err.errors.map((error) => ({
            field: error.path,
            message: error.message,
            value: error.value,
            validationType: error.validatorKey,
          })),
          timestamp,
          requestId: req.id || Date.now(),
        },
        ...(process.env.NODE_ENV === 'development' && { debug: { stack: err.stack } }),
      });
      break;

    case 'SequelizeUniqueConstraintError':
      const duplicateField = err.errors[0]?.path || 'field';
      res.status(409).json({
        success: false,
        message: `${
          duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1)
        } already exists`,
        error: 'DUPLICATE_ENTRY',
        details: {
          description:
            'The data you are trying to create or update conflicts with existing records',
          conflicts: err.errors.map((error) => ({
            field: error.path,
            message: error.message,
            value: error.value,
            constraint: error.type,
          })),
          suggestion: `Please use a different ${duplicateField} or update the existing record`,
          timestamp,
          requestId: req.id || Date.now(),
        },
        ...(process.env.NODE_ENV === 'development' && { debug: { stack: err.stack } }),
      });
      break;

    case 'SequelizeForeignKeyConstraintError':
      res.status(400).json({
        success: false,
        message: 'Related record not found',
        error: 'FOREIGN_KEY_CONSTRAINT',
        details: {
          description: 'The operation failed because a referenced record does not exist',
          constraint: err.parent?.constraint || 'unknown',
          suggestion: 'Please ensure all referenced records exist before performing this operation',
          timestamp,
          requestId: req.id || Date.now(),
        },
        ...(process.env.NODE_ENV === 'development' && { debug: { stack: err.stack } }),
      });
      break;

    case 'SequelizeDatabaseError':
      const isDevelopment = process.env.NODE_ENV === 'development';
      res.status(500).json({
        success: false,
        message: 'Database operation failed',
        error: 'DATABASE_ERROR',
        details: {
          description: 'An error occurred while communicating with the database',
          ...(isDevelopment && { databaseMessage: err.message }),
          suggestion: 'Please try again later. If the problem persists, contact support',
          timestamp,
          requestId: req.id || Date.now(),
        },
        ...(isDevelopment && { debug: { stack: err.stack } }),
      });
      break;

    case 'SequelizeConnectionError':
      res.status(503).json({
        success: false,
        message: 'Database connection unavailable',
        error: 'CONNECTION_ERROR',
        details: {
          description: 'Unable to establish connection to the database',
          suggestion: 'The service is temporarily unavailable. Please try again in a few moments',
          timestamp,
          requestId: req.id || Date.now(),
        },
        ...(process.env.NODE_ENV === 'development' && { debug: { stack: err.stack } }),
      });
      break;

    case 'NotFound':
      res.status(404).json({
        success: false,
        message: err.message || 'Resource not found',
        error: 'NOT_FOUND',
        details: {
          description: 'The requested resource could not be found',
          resource: req.originalUrl,
          suggestion: 'Please check the URL and try again',
          timestamp,
          requestId: req.id || Date.now(),
        },
      });
      break;

    case 'BadRequest':
      res.status(400).json({
        success: false,
        message: err.message || 'Invalid request',
        error: 'BAD_REQUEST',
        details: {
          description: 'The request contains invalid or missing data',
          suggestion: 'Please check your request parameters and try again',
          timestamp,
          requestId: req.id || Date.now(),
        },
      });
      break;

    case 'Unauthorized':
      res.status(401).json({
        success: false,
        message: err.message || 'Authentication required',
        error: 'UNAUTHORIZED',
        details: {
          description: 'Access to this resource requires authentication',
          suggestion: 'Please provide valid credentials and try again',
          timestamp,
          requestId: req.id || Date.now(),
        },
      });
      break;

    case 'Forbidden':
      res.status(403).json({
        success: false,
        message: err.message || 'Access denied',
        error: 'FORBIDDEN',
        details: {
          description: 'You do not have permission to access this resource',
          suggestion: 'Please contact an administrator if you believe this is an error',
          timestamp,
          requestId: req.id || Date.now(),
        },
      });
      break;

    case 'JsonWebTokenError':
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
        error: 'TOKEN_ERROR',
        details: {
          description: 'The provided authentication token is invalid or malformed',
          suggestion: 'Please log in again to get a new token',
          timestamp,
          requestId: req.id || Date.now(),
        },
      });
      break;

    case 'TokenExpiredError':
      res.status(401).json({
        success: false,
        message: 'Authentication token has expired',
        error: 'TOKEN_EXPIRED',
        details: {
          description: 'Your session has expired',
          suggestion: 'Please log in again to continue',
          timestamp,
          requestId: req.id || Date.now(),
        },
      });
      break;

    case 'BadGateway':
      res.status(502).json({
        success: false,
        message: err.message || 'External service unavailable',
        error: 'BAD_GATEWAY',
        details: {
          description: 'Unable to communicate with external service',
          suggestion: 'Please try again later or contact support if the issue persists',
          timestamp,
          requestId: req.id || Date.now(),
        },
        ...(process.env.NODE_ENV === 'development' && { debug: { stack: err.stack } }),
      });
      break;

    case 'Conflict':
      res.status(409).json({
        success: false,
        message: err.message || 'Resource conflict',
        error: 'CONFLICT',
        details: {
          description: 'The request conflicts with existing resources',
          suggestion: 'Please check existing resources and modify your request',
          timestamp,
          requestId: req.id || Date.now(),
        },
      });
      break;

    default:
      const statusCode = err.statusCode || 500;
      const message =
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message || 'Internal server error';

      res.status(statusCode).json({
        success: false,
        message,
        error: 'INTERNAL_ERROR',
        details: {
          description: 'An unexpected error occurred while processing your request',
          suggestion: 'Please try again later. If the problem persists, contact support',
          timestamp,
          requestId: req.id || Date.now(),
        },
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            stack: err.stack,
            originalError: err.name,
          },
        }),
      });
      break;
  }
}

module.exports = { errorHandling };
