const router = require('express').Router();
const ctrl = require('../controllers/fuel.controller');
const v = require('../validation/fuel.validation');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', v.listQuery, validate, asyncHandler(ctrl.listFuelLogs));
router.get('/:id', asyncHandler(ctrl.getFuelLog));

// Fuel logging is a Fleet Manager / Financial Analyst operation.
router.post('/', authorize('fleet_manager', 'financial_analyst'), v.create, validate, asyncHandler(ctrl.createFuelLog));
router.delete('/:id', authorize('fleet_manager', 'financial_analyst'), asyncHandler(ctrl.deleteFuelLog));

module.exports = router;
