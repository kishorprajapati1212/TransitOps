const { body, query } = require('express-validator');

const create = [
  body('vehicle_id').isUUID().withMessage('vehicle_id must be a valid UUID'),
  body('liters').isFloat({ gt: 0 }).withMessage('liters must be > 0'),
  body('cost').isFloat({ min: 0 }).withMessage('cost must be >= 0'),
  body('trip_id').optional({ checkFalsy: true }).isUUID(),
  body('log_date').optional({ checkFalsy: true }).isISO8601().withMessage('log_date must be a valid date'),
];

const listQuery = [
  query('vehicle_id').optional({ checkFalsy: true }).isUUID(),
  query('trip_id').optional({ checkFalsy: true }).isUUID(),
  query('from').optional({ checkFalsy: true }).isISO8601(),
  query('to').optional({ checkFalsy: true }).isISO8601(),
];

module.exports = { create, listQuery };
