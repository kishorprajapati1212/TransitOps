const router = require('express').Router();
const ctrl = require('../controllers/vehicle.controller');
const v = require('../validation/vehicle.validation');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', v.listQuery, validate, asyncHandler(ctrl.listVehicles));
router.get('/:id', asyncHandler(ctrl.getVehicle));

// Writes are restricted to the Fleet Manager.
router.post('/', authorize('fleet_manager'), v.create, validate, asyncHandler(ctrl.createVehicle));
router.patch('/:id', authorize('fleet_manager'), v.update, validate, asyncHandler(ctrl.updateVehicle));
router.delete('/:id', authorize('fleet_manager'), asyncHandler(ctrl.deleteVehicle));

module.exports = router;
