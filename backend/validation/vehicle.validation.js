const { body, query } = require('express-validator');

const ALLOWED_STATUS = ['available', 'on_trip', 'in_shop', 'retired'];

const create = [
  body('registration_number').trim().notEmpty().withMessage('Registration number is required').isLength({ max: 40 }),
  body('name').trim().notEmpty().withMessage('Vehicle name/model is required').isLength({ max: 120 }),
  body('type').trim().notEmpty().withMessage('Vehicle type is required').isLength({ max: 40 }),
  body('max_load_capacity').isFloat({ min: 0 }).withMessage('max_load_capacity must be a number >= 0'),
  body('odometer').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('odometer must be >= 0'),
  body('acquisition_cost').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('acquisition_cost must be >= 0'),
  body('status').optional({ checkFalsy: true }).isIn(ALLOWED_STATUS).withMessage(`status must be one of: ${ALLOWED_STATUS.join(', ')}`),
  body('region').optional({ checkFalsy: true }).isLength({ max: 60 }).withMessage('region too long'),
];

const update = [
  body('name').optional({ checkFalsy: true }).trim().notEmpty().isLength({ max: 120 }),
  body('type').optional({ checkFalsy: true }).trim().notEmpty().isLength({ max: 40 }),
  body('max_load_capacity').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('odometer').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('acquisition_cost').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('status').optional({ checkFalsy: true }).isIn(ALLOWED_STATUS),
  body('region').optional({ checkFalsy: true }).isLength({ max: 60 }),
];

const listQuery = [
  query('status').optional({ checkFalsy: true }).isIn(ALLOWED_STATUS),
  query('type').optional({ checkFalsy: true }).isString(),
  query('region').optional({ checkFalsy: true }).isString(),
  query('search').optional({ checkFalsy: true }).isString(),
];

module.exports = { create, update, listQuery, ALLOWED_STATUS };
