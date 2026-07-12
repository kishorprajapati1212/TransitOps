const router = require('express').Router();
const ctrl = require('../controllers/expense.controller');
const v = require('../validation/expense.validation');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', v.listQuery, validate, asyncHandler(ctrl.listExpenses));
router.get('/:id', asyncHandler(ctrl.getExpense));

// Expense tracking is a Fleet Manager / Financial Analyst operation.
router.post('/', authorize('fleet_manager', 'financial_analyst'), v.create, validate, asyncHandler(ctrl.createExpense));
router.delete('/:id', authorize('fleet_manager', 'financial_analyst'), asyncHandler(ctrl.deleteExpense));

module.exports = router;
