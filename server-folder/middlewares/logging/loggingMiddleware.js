/**
 * Request Logging Middleware
 */
class LoggingMiddleware {
  /**
   * Log HTTP requests with timing
   */
  static logRequests() {
    return (req, res, next) => {
      const start = Date.now();
      const timestamp = new Date().toISOString();

      // Log request start
      console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - Started`);

      // Log request body for POST/PUT/PATCH requests (exclude sensitive data)
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        const sanitizedBody = { ...req.body };
        // Remove sensitive fields
        delete sanitizedBody.password;
        delete sanitizedBody.passwordHash;
        console.log(`[${timestamp}] Request Body:`, JSON.stringify(sanitizedBody, null, 2));
      }

      // Override res.json to log response
      const originalJson = res.json;
      res.json = function (data) {
        const duration = Date.now() - start;
        const endTimestamp = new Date().toISOString();

        console.log(
          `[${endTimestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
        );

        // Log error responses
        if (res.statusCode >= 400) {
          console.error(`[${endTimestamp}] Error Response:`, JSON.stringify(data, null, 2));
        }

        return originalJson.call(this, data);
      };

      next();
    };
  }

  /**
   * Log only errors
   */
  static logErrors() {
    return (req, res, next) => {
      const originalJson = res.json;
      res.json = function (data) {
        if (res.statusCode >= 400) {
          const timestamp = new Date().toISOString();
          console.error(
            `[${timestamp}] ERROR ${req.method} ${req.originalUrl} - ${res.statusCode}`
          );
          console.error('Error Details:', JSON.stringify(data, null, 2));
        }

        return originalJson.call(this, data);
      };

      next();
    };
  }
}

module.exports = LoggingMiddleware;
