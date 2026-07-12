const router = require('express').Router();
const ctrl = require('../controllers/trip.controller');
const v = require('../validation/trip.validation');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', v.listQuery, validate, asyncHandler(ctrl.listTrips));
router.get('/:id', asyncHandler(ctrl.getTrip));

// Drivers create/dispatch trips; Fleet Manager can too.
router.post('/', authorize('fleet_manager', 'driver'), v.create, validate, asyncHandler(ctrl.createTrip));
router.patch('/:id', authorize('fleet_manager', 'driver'), v.update, validate, asyncHandler(ctrl.updateTrip));
router.post('/:id/dispatch', authorize('fleet_manager', 'driver'), asyncHandler(ctrl.dispatchTrip));
router.post('/:id/complete', authorize('fleet_manager', 'driver'), v.complete, validate, asyncHandler(ctrl.completeTrip));
router.post('/:id/cancel', authorize('fleet_manager', 'driver'), asyncHandler(ctrl.cancelTrip));

module.exports = router;
