const { body, query } = require('express-validator');

const create = [
  body('category').trim().notEmpty().withMessage('category is required').isLength({ max: 40 }),
  body('amount').isFloat({ min: 0 }).withMessage('amount must be >= 0'),
  body('vehicle_id').optional({ checkFalsy: true }).isUUID(),
  body('trip_id').optional({ checkFalsy: true }).isUUID(),
  body('description').optional({ checkFalsy: true }).isString(),
  body('expense_date').optional({ checkFalsy: true }).isISO8601().withMessage('expense_date must be a valid date'),
];

const listQuery = [
  query('category').optional({ checkFalsy: true }).isString(),
  query('vehicle_id').optional({ checkFalsy: true }).isUUID(),
  query('from').optional({ checkFalsy: true }).isISO8601(),
  query('to').optional({ checkFalsy: true }).isISO8601(),
];

module.exports = { create, listQuery };
