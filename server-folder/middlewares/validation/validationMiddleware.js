/**
 * Validation Middleware for Request Parameters
 */
class ValidationMiddleware {
  /**
   * Validate numeric ID parameters
   */
  static validateNumericId(paramName = 'id') {
    return (req, res, next) => {
      const id = req.params[paramName];

      if (!id || isNaN(id) || parseInt(id) <= 0) {
        return res.status(400).json({
          success: false,
          message: `Valid ${paramName} is required and must be a positive number`,
        });
      }

      // Convert to integer
      req.params[paramName] = parseInt(id);
      next();
    };
  }

  /**
   * Validate required body fields
   */
  static validateRequiredFields(requiredFields) {
    return (req, res, next) => {
      const missingFields = [];

      for (const field of requiredFields) {
        if (!req.body[field] || (typeof req.body[field] === 'string' && !req.body[field].trim())) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          missingFields,
        });
      }

      next();
    };
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination() {
    return (req, res, next) => {
      if (req.query.page) {
        const { page } = req.query;

        if (page.number && (isNaN(page.number) || parseInt(page.number) < 1)) {
          return res.status(400).json({
            success: false,
            message: 'Page number must be a positive integer',
          });
        }

        if (
          page.size &&
          (isNaN(page.size) || parseInt(page.size) < 1 || parseInt(page.size) > 100)
        ) {
          return res.status(400).json({
            success: false,
            message: 'Page size must be between 1 and 100',
          });
        }
      }

      next();
    };
  }

  /**
   * Sanitize string inputs
   */
  static sanitizeStrings(fields) {
    return (req, res, next) => {
      for (const field of fields) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = req.body[field].trim();
        }
      }
      next();
    };
  }
}

module.exports = ValidationMiddleware;
