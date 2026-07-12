const router = require('express').Router();
const ctrl = require('../controllers/maintenance.controller');
const v = require('../validation/maintenance.validation');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', v.listQuery, validate, asyncHandler(ctrl.listMaintenance));
router.get('/:id', asyncHandler(ctrl.getMaintenance));

// Maintenance workflow is owned by the Fleet Manager.
router.post('/', authorize('fleet_manager'), v.create, validate, asyncHandler(ctrl.createMaintenance));
router.patch('/:id', authorize('fleet_manager'), v.update, validate, asyncHandler(ctrl.updateMaintenance));
router.post('/:id/close', authorize('fleet_manager'), asyncHandler(ctrl.closeMaintenance));
router.delete('/:id', authorize('fleet_manager'), asyncHandler(ctrl.deleteMaintenance));

module.exports = router;
