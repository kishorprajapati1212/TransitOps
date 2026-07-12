/**
 * Operational error with an HTTP status code.
 * Throw this from controllers / repositories and let the error handler format it.
 */
class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = HttpError;
