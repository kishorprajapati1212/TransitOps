const { body } = require('express-validator');

const ROLES = ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'];

const changeRole = [
  body('role').isIn(ROLES).withMessage(`role must be one of: ${ROLES.join(', ')}`),
];

const createUser = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(ROLES).withMessage(`role must be one of: ${ROLES.join(', ')}`),
  body('driver_id').optional({ checkFalsy: true }).isUUID().withMessage('driver_id must be a valid UUID'),
];

module.exports = { changeRole, createUser };
