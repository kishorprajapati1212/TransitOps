const router = require('express').Router();
const { register, login, me } = require('../controllers/auth.controller');
const { register: vRegister, login: vLogin } = require('../validation/auth.validation');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');

router.post('/register', vRegister, validate, asyncHandler(register));
router.post('/login', vLogin, validate, asyncHandler(login));
router.get('/me', authenticate, asyncHandler(me));

module.exports = router;
