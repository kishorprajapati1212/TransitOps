const { body } = require('express-validator');

const changeRole = [
  body('role')
    .isIn(['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'])
    .withMessage('role must be one of: fleet_manager, driver, safety_officer, financial_analyst'),
];

module.exports = { changeRole };
