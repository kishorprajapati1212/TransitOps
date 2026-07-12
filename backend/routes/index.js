const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./users.routes'));
router.use('/vehicles', require('./vehicles.routes'));
router.use('/drivers', require('./drivers.routes'));
router.use('/trips', require('./trips.routes'));
router.use('/maintenance', require('./maintenance.routes'));
router.use('/fuel', require('./fuel.routes'));
router.use('/expenses', require('./expenses.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/reports', require('./reports.routes'));
router.use('/activity', require('./activity.routes'));

module.exports = router;
