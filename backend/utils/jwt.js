const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'dev-transitops-secret-change-me';
const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Sign a token. Payload convention:
 * { sub: userId, role, email, name }
 */
const signToken = (payload) =>
  jwt.sign(payload, secret, { expiresIn });

const verifyToken = (token) => jwt.verify(token, secret);

module.exports = { signToken, verifyToken, secret, expiresIn };
