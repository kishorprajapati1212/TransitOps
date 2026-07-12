const HttpError = require('../utils/httpError');

/** 404 handler for unmatched routes. */
module.exports = function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};
