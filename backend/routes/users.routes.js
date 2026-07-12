const router = require('express').Router();
const ctrl = require('../controllers/users.controller');
const { changeRole } = require('../validation/users.validation');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);
router.use(authorize('fleet_manager'));

router.get('/', asyncHandler(ctrl.listUsers));
router.get('/:id', asyncHandler(ctrl.getUser));
router.patch('/:id/role', changeRole, validate, asyncHandler(ctrl.changeRole));
router.delete('/:id', asyncHandler(ctrl.removeUser));

module.exports = router;
