const router = require('express').Router();
const activityRepo = require('../repositories/activity.repository');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);
router.use(authorize('fleet_manager'));

router.get('/', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  res.json({ logs: await activityRepo.recent(limit) });
}));

module.exports = router;
