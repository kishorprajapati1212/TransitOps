const { body, query } = require('express-validator');

const ALLOWED_STATUS = ['available', 'on_trip', 'off_duty', 'suspended'];

const create = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('license_number').trim().notEmpty().withMessage('License number is required').isLength({ max: 60 }),
  body('license_category').trim().notEmpty().withMessage('License category is required').isLength({ max: 20 }),
  body('license_expiry_date').isISO8601().withMessage('license_expiry_date must be a valid date (YYYY-MM-DD)'),
  body('contact_number').optional({ checkFalsy: true }).matches(/^\d{10}$/).withMessage('contact_number must be exactly 10 digits'),
  body('safety_score').optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('safety_score must be between 0 and 100'),
  body('status').optional({ checkFalsy: true }).isIn(ALLOWED_STATUS).withMessage(`status must be one of: ${ALLOWED_STATUS.join(', ')}`),
];

const update = [
  body('name').optional({ checkFalsy: true }).trim().notEmpty().isLength({ max: 120 }),
  body('license_number').optional({ checkFalsy: true }).trim().notEmpty().isLength({ max: 60 }),
  body('license_category').optional({ checkFalsy: true }).trim().notEmpty().isLength({ max: 20 }),
  body('license_expiry_date').optional({ checkFalsy: true }).isISO8601(),
  body('contact_number').optional({ checkFalsy: true }).matches(/^\d{10}$/).withMessage('contact_number must be exactly 10 digits'),
  body('safety_score').optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }),
  body('status').optional({ checkFalsy: true }).isIn(ALLOWED_STATUS),
];

const listQuery = [
  query('status').optional({ checkFalsy: true }).isIn(ALLOWED_STATUS),
  query('search').optional({ checkFalsy: true }).isString(),
];

module.exports = { create, update, listQuery, ALLOWED_STATUS };
