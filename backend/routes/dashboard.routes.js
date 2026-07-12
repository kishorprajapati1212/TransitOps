const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const authenticate = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(ctrl.getDashboard));

module.exports = router;
