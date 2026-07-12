const { validationResult } = require('express-validator');

/**
 * Runs AFTER the express-validator chains attached to a route.
 * Returns 400 with field-level details when validation fails.
 */
module.exports = function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({
        field: e.path || e.param,
        message: e.msg,
        value: e.value,
      })),
    });
  }
  next();
};
