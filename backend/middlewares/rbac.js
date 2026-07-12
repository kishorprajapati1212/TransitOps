const HttpError = require('../utils/httpError');

/**
 * Role-Based Access Control guard.
 * Usage: authorize('fleet_manager', 'driver')
 * Call AFTER authenticate(). If no roles are passed, any authenticated user is allowed.
 */
module.exports = function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, 'Authentication required.'));
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return next(
        new HttpError(403, `Access denied. Required role: ${allowedRoles.join(' or ')}.`)
      );
    }
    next();
  };
};
