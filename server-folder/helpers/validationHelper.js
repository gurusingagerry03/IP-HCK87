/**
 * Validation Helper Utilities
 */
class ValidationHelper {
  /**
   * Validate required fields
   */
  static validateRequired(fields, data) {
    const errors = [];

    for (const field of fields) {
      if (!data[field] || data[field].toString().trim() === '') {
        errors.push({
          field,
          message: `${field} is required`,
        });
      }
    }

    return errors;
  }

  /**
   * Validate email format
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate numeric values
   */
  static validateNumeric(value, field, min = null, max = null) {
    const errors = [];
    const num = Number(value);

    if (isNaN(num)) {
      errors.push({
        field,
        message: `${field} must be a number`,
      });
      return errors;
    }

    if (min !== null && num < min) {
      errors.push({
        field,
        message: `${field} must be at least ${min}`,
      });
    }

    if (max !== null && num > max) {
      errors.push({
        field,
        message: `${field} must not exceed ${max}`,
      });
    }

    return errors;
  }

  /**
   * Validate string length
   */
  static validateLength(value, field, min = null, max = null) {
    const errors = [];

    if (typeof value !== 'string') {
      errors.push({
        field,
        message: `${field} must be a string`,
      });
      return errors;
    }

    if (min !== null && value.length < min) {
      errors.push({
        field,
        message: `${field} must be at least ${min} characters`,
      });
    }

    if (max !== null && value.length > max) {
      errors.push({
        field,
        message: `${field} must not exceed ${max} characters`,
      });
    }

    return errors;
  }

  /**
   * Validate date format
   */
  static validateDate(date, field) {
    const errors = [];
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      errors.push({
        field,
        message: `${field} must be a valid date`,
      });
    }

    return errors;
  }

  /**
   * Validate array fields
   */
  static validateArray(value, field, minItems = null, maxItems = null) {
    const errors = [];

    if (!Array.isArray(value)) {
      errors.push({
        field,
        message: `${field} must be an array`,
      });
      return errors;
    }

    if (minItems !== null && value.length < minItems) {
      errors.push({
        field,
        message: `${field} must contain at least ${minItems} items`,
      });
    }

    if (maxItems !== null && value.length > maxItems) {
      errors.push({
        field,
        message: `${field} must not exceed ${maxItems} items`,
      });
    }

    return errors;
  }

  /**
   * Validate UUID format
   */
  static validateUUID(value, field) {
    const errors = [];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(value)) {
      errors.push({
        field,
        message: `${field} must be a valid UUID`,
      });
    }

    return errors;
  }

  /**
   * Combine validation errors
   */
  static combineErrors(...errorArrays) {
    return errorArrays.reduce((combined, errors) => {
      return combined.concat(errors);
    }, []);
  }
}

module.exports = ValidationHelper;
