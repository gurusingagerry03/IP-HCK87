const errorHandling = (err, req, res, next) => {
  switch (err.name) {
    case 'SequelizeUniqueConstraintError':
    case 'SequelizeValidationError':
      res.status(400).json({ message: err.errors[0].message });
      break;
    case 'JsonWebTokenError':
      res.status(401).json({ message: 'invalid token' });
      break;
    case 'TokenExpiredError':
      res.status(401).json({ message: 'invalid token' });
      break;
    case 'ForbiddenAccess':
      res.status(403).json({ message: 'Forbidden Access' });
      break;
    case 'NotFound':
      res.status(404).json({ message: err.message });
      break;
    case 'BadRequest':
      res.status(400).json({ message: err.message });
      break;
    case 'Unauthorized':
      res.status(401).json({ message: err.message || 'Authentication required' });
      break;
    case 'Forbidden':
      res.status(403).json({ message: err.message || 'Access denied' });
      break;
    case 'Conflict':
      res.status(409).json({ message: err.message || 'Resource conflict' });
      break;
    case 'InvalidCredentialsError':
      res.status(401).json({ message: 'Invalid email or password' });
      break;
    default:
      res.status(500).json({ message: 'internal server error' });
      break;
  }
};

module.exports = { errorHandling };
