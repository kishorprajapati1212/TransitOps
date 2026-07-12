const userRepo = require('../repositories/user.repository');
const driverRepo = require('../repositories/driver.repository');
const { hashPassword } = require('../utils/password');
const HttpError = require('../utils/httpError');

async function listUsers(req, res) {
  const users = await userRepo.list();
  // For each user with role=driver, include their linked driver_id
  const enriched = await Promise.all(users.map(async (u) => {
    if (u.role === 'driver') {
      const driver = await driverRepo.findByUserId(u.id);
      return { ...u, driver_id: driver?.id || null, driver_name: driver?.name || null };
    }
    return { ...u, driver_id: null, driver_name: null };
  }));
  res.json({ users: enriched });
}

async function getUser(req, res) {
  const user = await userRepo.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  res.json({ user });
}

/**
 * Create a new user (Fleet Manager only).
 * If role is 'driver' and driver_id is provided, link them.
 */
async function createUser(req, res) {
  const { name, email, password, role, driver_id } = req.body;

  if (await userRepo.emailExists(email)) {
    throw new HttpError(409, 'Email is already registered');
  }

  const password_hash = await hashPassword(password);
  const user = await userRepo.create({ name, email, password_hash, role: role || 'driver' });

  // If role is driver and a driver_id is specified, link them
  if (role === 'driver' && driver_id) {
    const driver = await driverRepo.findById(driver_id);
    if (driver && !driver.user_id) {
      await driverRepo.update(driver_id, { user_id: user.id });
    }
  }

  res.status(201).json({ user });
}

async function changeRole(req, res) {
  const user = await userRepo.updateRole(req.params.id, req.body.role);
  if (!user) throw new HttpError(404, 'User not found');
  res.json({ user });
}

async function removeUser(req, res) {
  // Unlink any driver records first
  const drivers = await driverRepo.list();
  for (const d of drivers) {
    if (d.user_id === req.params.id) {
      await driverRepo.update(d.id, { user_id: null });
    }
  }

  const ok = await userRepo.remove(req.params.id);
  if (!ok) throw new HttpError(404, 'User not found');
  res.json({ message: 'User deleted' });
}

/**
 * Link a user account to a driver record.
 */
async function linkDriver(req, res) {
  const { driver_id } = req.body;
  const userId = req.params.id;

  const user = await userRepo.findById(userId);
  if (!user) throw new HttpError(404, 'User not found');
  if (user.role !== 'driver') throw new HttpError(400, 'Only driver-role users can be linked to driver records');

  if (driver_id) {
    const driver = await driverRepo.findById(driver_id);
    if (!driver) throw new HttpError(404, 'Driver record not found');
    // Unlink any previously linked user from this driver
    if (driver.user_id && driver.user_id !== userId) {
      throw new HttpError(400, 'This driver record is already linked to another user');
    }
    // Unlink this user from any other driver
    const existingLink = await driverRepo.findByUserId(userId);
    if (existingLink && existingLink.id !== driver_id) {
      await driverRepo.update(existingLink.id, { user_id: null });
    }
    await driverRepo.update(driver_id, { user_id: userId });
  } else {
    // Unlink
    const existing = await driverRepo.findByUserId(userId);
    if (existing) {
      await driverRepo.update(existing.id, { user_id: null });
    }
  }

  res.json({ message: 'Driver linked successfully' });
}

module.exports = { listUsers, getUser, createUser, changeRole, removeUser, linkDriver };
