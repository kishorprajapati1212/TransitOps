const driverRepo = require('../repositories/driver.repository');
const activityRepo = require('../repositories/activity.repository');
const HttpError = require('../utils/httpError');

async function createDriver(req, res) {
  const { license_number } = req.body;
  if (await driverRepo.licenseExists(license_number)) {
    throw new HttpError(409, 'License number already exists');
  }
  const driver = await driverRepo.create(req.body);
  await activityRepo.log({ user_id: req.user.id, user_name: req.user.name, action: 'Added', entity: 'Driver', detail: `${driver.name} (${driver.license_number})` });
  res.status(201).json({ driver });
}

async function listDrivers(req, res) {
  const { status, search } = req.query;
  res.json({ drivers: await driverRepo.list({ status, search }) });
}

async function getDriver(req, res) {
  const driver = await driverRepo.findById(req.params.id);
  if (!driver) throw new HttpError(404, 'Driver not found');
  res.json({ driver });
}

async function updateDriver(req, res) {
  const existing = await driverRepo.findById(req.params.id);
  if (!existing) throw new HttpError(404, 'Driver not found');

  if (req.body.license_number && req.body.license_number !== existing.license_number) {
    if (await driverRepo.licenseExists(req.body.license_number, req.params.id)) {
      throw new HttpError(409, 'License number already exists');
    }
  }
  const driver = await driverRepo.update(req.params.id, req.body);
  await activityRepo.log({ user_id: req.user.id, user_name: req.user.name, action: 'Updated', entity: 'Driver', detail: driver.name });
  res.json({ driver });
}

/**
 * Safety Officer compliance action — can only update status and safety_score.
 * Cannot change name, license, contact, or other profile fields.
 */
async function updateCompliance(req, res) {
  const existing = await driverRepo.findById(req.params.id);
  if (!existing) throw new HttpError(404, 'Driver not found');

  const { status, safety_score } = req.body;
  if (!status && safety_score === undefined) {
    throw new HttpError(400, 'Provide status or safety_score to update');
  }

  // Only allow compliance-related fields
  const update = {};
  if (status) update.status = status;
  if (safety_score !== undefined) update.safety_score = safety_score;

  const driver = await driverRepo.update(req.params.id, update);

  const details = [];
  if (status) details.push(`status → ${status}`);
  if (safety_score !== undefined) details.push(`safety score → ${safety_score}`);
  await activityRepo.log({ user_id: req.user.id, user_name: req.user.name, action: 'Compliance', entity: 'Driver', detail: `${driver.name}: ${details.join(', ')}` });

  res.json({ driver });
}

async function deleteDriver(req, res) {
  const existing = await driverRepo.findById(req.params.id);
  const ok = await driverRepo.remove(req.params.id);
  if (!ok) throw new HttpError(404, 'Driver not found');
  await activityRepo.log({ user_id: req.user.id, user_name: req.user.name, action: 'Deleted', entity: 'Driver', detail: existing?.name });
  res.json({ message: 'Driver deleted' });
}

module.exports = { createDriver, listDrivers, getDriver, updateDriver, updateCompliance, deleteDriver };
