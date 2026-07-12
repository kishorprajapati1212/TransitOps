const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

// Analytics are available to the operational/oversight roles.
router.use(authorize('fleet_manager', 'financial_analyst', 'safety_officer'));

router.get('/', asyncHandler(ctrl.overview));
router.get('/vehicles', asyncHandler(ctrl.vehicleReport));
router.get('/expiring-licenses', asyncHandler(ctrl.expiringLicenses));
router.get('/export.csv', asyncHandler(ctrl.exportCsv));

module.exports = router;
