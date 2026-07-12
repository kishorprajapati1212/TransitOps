const HttpError = require('../utils/httpError');

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  // Known operational errors
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }

  // PostgreSQL constraint violations
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists or conflicts with a unique constraint.', detail: err.detail });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced resource does not exist.', detail: err.detail });
  }
  if (err.code === '23502') {
    return res.status(400).json({ error: 'A required field is missing.', detail: err.detail });
  }
  if (err.code === '22P02' || err.code === '22007') {
    return res.status(400).json({ error: 'Invalid input type provided.', detail: err.message });
  }

  // Unknown / unexpected
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
};
