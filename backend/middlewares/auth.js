const { verifyToken } = require('../utils/jwt');
const HttpError = require('../utils/httpError');

/**
 * Authenticates a request via Bearer JWT and attaches req.user.
 */
module.exports = function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Authentication required. Provide a Bearer token.');
    }
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
      name: payload.name,
    };
    next();
  } catch (err) {
    if (err instanceof HttpError) return next(err);
    return next(new HttpError(401, 'Invalid or expired token.'));
  }
};
