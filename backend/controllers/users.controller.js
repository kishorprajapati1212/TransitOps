const userRepo = require('../repositories/user.repository');
const HttpError = require('../utils/httpError');

async function listUsers(req, res) {
  res.json({ users: await userRepo.list() });
}

async function getUser(req, res) {
  const user = await userRepo.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  res.json({ user });
}

async function changeRole(req, res) {
  const user = await userRepo.updateRole(req.params.id, req.body.role);
  if (!user) throw new HttpError(404, 'User not found');
  res.json({ user });
}

async function removeUser(req, res) {
  const ok = await userRepo.remove(req.params.id);
  if (!ok) throw new HttpError(404, 'User not found');
  res.json({ message: 'User deleted' });
}

module.exports = { listUsers, getUser, changeRole, removeUser };
