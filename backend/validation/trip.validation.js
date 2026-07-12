const { body, query } = require('express-validator');

const TRIP_STATUS = ['draft', 'dispatched', 'completed', 'cancelled'];

const create = [
  body('source').trim().notEmpty().withMessage('Source is required').isLength({ max: 160 }),
  body('destination').trim().notEmpty().withMessage('Destination is required').isLength({ max: 160 }),
  body('vehicle_id').isUUID().withMessage('vehicle_id must be a valid UUID'),
  body('driver_id').isUUID().withMessage('driver_id must be a valid UUID'),
  body('cargo_weight').isFloat({ min: 0 }).withMessage('cargo_weight must be a number >= 0'),
  body('planned_distance').isFloat({ min: 0 }).withMessage('planned_distance must be a number >= 0'),
];

const update = [
  body('source').optional({ checkFalsy: true }).trim().notEmpty().isLength({ max: 160 }),
  body('destination').optional({ checkFalsy: true }).trim().notEmpty().isLength({ max: 160 }),
  body('vehicle_id').optional({ checkFalsy: true }).isUUID(),
  body('driver_id').optional({ checkFalsy: true }).isUUID(),
  body('cargo_weight').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('planned_distance').optional({ checkFalsy: true }).isFloat({ min: 0 }),
];

const complete = [
  body('final_odometer').isFloat({ min: 0 }).withMessage('final_odometer is required and must be >= 0'),
  body('fuel_consumed').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('fuel_consumed must be >= 0'),
  body('revenue').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('revenue must be >= 0'),
];

const listQuery = [
  query('status').optional({ checkFalsy: true }).isIn(TRIP_STATUS),
  query('vehicle_id').optional({ checkFalsy: true }).isUUID(),
  query('driver_id').optional({ checkFalsy: true }).isUUID(),
  query('search').optional({ checkFalsy: true }).isString(),
];

module.exports = { create, update, complete, listQuery, TRIP_STATUS };
