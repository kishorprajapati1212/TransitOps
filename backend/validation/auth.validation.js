const { body } = require('express-validator');

const ROLES = ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'];

const register = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  // NOTE: role is intentionally NOT accepted here. Self-registration always creates a
  // least-privilege 'driver'. Other roles are provisioned by the seeder or the
  // fleet_manager-only /users endpoint — never via public registration.
];

const login = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { register, login, ROLES };
