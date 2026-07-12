/**
 * Wraps an async Express handler so rejected promises are forwarded to next(err).
 * Keeps controllers clean (they can simply `throw`).
 */
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
