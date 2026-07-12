const userRepo = require('../repositories/user.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const HttpError = require('../utils/httpError');

async function register(req, res) {
  const { name, email, password } = req.body;
  if (await userRepo.emailExists(email)) {
    throw new HttpError(409, 'Email is already registered');
  }
  const password_hash = await hashPassword(password);
  // Self-registration is always a least-privilege 'driver' (see validation note).
  const user = await userRepo.create({ name, email, password_hash, role: 'driver' });
  const token = signToken({ sub: user.id, role: user.role, email: user.email, name: user.name });
  res.status(201).json({ token, user });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await userRepo.findByEmail(email);
  if (!user) throw new HttpError(401, 'Invalid credentials');
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) throw new HttpError(401, 'Invalid credentials');

  const token = signToken({ sub: user.id, role: user.role, email: user.email, name: user.name });
  const { password_hash, ...safe } = user;
  res.json({ token, user: safe });
}

async function me(req, res) {
  const user = await userRepo.findById(req.user.id);
  if (!user) throw new HttpError(404, 'User not found');
  res.json({ user });
}

module.exports = { register, login, me };
