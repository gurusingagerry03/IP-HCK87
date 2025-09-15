function errorHandling(err, req, res, next) {
  console.error('Error:', err);

  switch (err.name) {
    case 'SequelizeValidationError':
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: err.errors.map((error) => ({
          field: error.path,
          message: error.message,
          value: error.value,
        })),
      });
      break;

    case 'SequelizeUniqueConstraintError':
      res.status(409).json({
        success: false,
        message: 'Duplicate entry error',
        errors: err.errors.map((error) => ({
          field: error.path,
          message: error.message,
          value: error.value,
        })),
      });
      break;

    case 'SequelizeForeignKeyConstraintError':
      res.status(400).json({
        success: false,
        message: 'Foreign key constraint error',
        error: 'Referenced record does not exist',
      });
      break;

    case 'SequelizeDatabaseError':
      res.status(500).json({
        success: false,
        message: 'Database error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Database operation failed',
      });
      break;

    case 'NotFound':
      res.status(404).json({
        success: false,
        message: err.msg || 'Resource not found',
      });
      break;

    case 'BadRequest':
      res.status(400).json({
        success: false,
        message: err.msg || 'Bad request',
      });
      break;

    case 'Unauthorized':
      res.status(401).json({
        success: false,
        message: err.msg || 'Unauthorized access',
      });
      break;

    case 'Forbidden':
      res.status(403).json({
        success: false,
        message: err.msg || 'Forbidden access',
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
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      });
      break;
  }
}

module.exports = { errorHandling };
