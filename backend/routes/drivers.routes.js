const router = require('express').Router();
const ctrl = require('../controllers/driver.controller');
const v = require('../validation/driver.validation');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

// Reads are available to any authenticated user (Safety Officer monitors compliance).
router.get('/', v.listQuery, validate, asyncHandler(ctrl.listDrivers));
router.get('/:id', asyncHandler(ctrl.getDriver));

// Writes are restricted to the Fleet Manager.
router.post('/', authorize('fleet_manager'), v.create, validate, asyncHandler(ctrl.createDriver));
router.patch('/:id', authorize('fleet_manager'), v.update, validate, asyncHandler(ctrl.updateDriver));
router.delete('/:id', authorize('fleet_manager'), asyncHandler(ctrl.deleteDriver));

module.exports = router;
