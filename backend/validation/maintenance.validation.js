const { body, query } = require('express-validator');

const create = [
  body('vehicle_id').isUUID().withMessage('vehicle_id must be a valid UUID'),
  body('type').trim().notEmpty().withMessage('Maintenance type is required').isLength({ max: 80 }),
  body('description').optional({ checkFalsy: true }).isString(),
  body('cost').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('cost must be >= 0'),
  body('performed_at').optional({ checkFalsy: true }).isISO8601().withMessage('performed_at must be a valid date'),
];

const update = [
  body('type').optional({ checkFalsy: true }).trim().notEmpty().isLength({ max: 80 }),
  body('description').optional({ checkFalsy: true }).isString(),
  body('cost').optional({ checkFalsy: true }).isFloat({ min: 0 }),
];

const listQuery = [
  query('vehicle_id').optional({ checkFalsy: true }).isUUID(),
  query('status').optional({ checkFalsy: true }).isIn(['open', 'closed']),
];

module.exports = { create, update, listQuery };
