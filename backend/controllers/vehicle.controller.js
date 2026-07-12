const vehicleRepo = require('../repositories/vehicle.repository');
const activityRepo = require('../repositories/activity.repository');
const HttpError = require('../utils/httpError');

async function createVehicle(req, res) {
  const { registration_number } = req.body;
  if (await vehicleRepo.registrationExists(registration_number)) {
    throw new HttpError(409, 'Registration number already exists');
  }
  const vehicle = await vehicleRepo.create(req.body);
  await activityRepo.log({ user_id: req.user.id, user_name: req.user.name, action: 'Registered', entity: 'Vehicle', detail: `${vehicle.registration_number} — ${vehicle.name}` });
  res.status(201).json({ vehicle });
}

async function listVehicles(req, res) {
  const { status, type, region, search } = req.query;
  res.json({ vehicles: await vehicleRepo.list({ status, type, region, search }) });
}

async function getVehicle(req, res) {
  const vehicle = await vehicleRepo.findById(req.params.id);
  if (!vehicle) throw new HttpError(404, 'Vehicle not found');
  res.json({ vehicle });
}

async function updateVehicle(req, res) {
  const existing = await vehicleRepo.findById(req.params.id);
  if (!existing) throw new HttpError(404, 'Vehicle not found');
  if (req.body.registration_number && req.body.registration_number !== existing.registration_number) {
    if (await vehicleRepo.registrationExists(req.body.registration_number, req.params.id)) {
      throw new HttpError(409, 'Registration number already exists');
    }
  }
  const vehicle = await vehicleRepo.update(req.params.id, req.body);
  await activityRepo.log({ user_id: req.user.id, user_name: req.user.name, action: 'Updated', entity: 'Vehicle', detail: vehicle.registration_number });
  res.json({ vehicle });
}

async function deleteVehicle(req, res) {
  const existing = await vehicleRepo.findById(req.params.id);
  const ok = await vehicleRepo.remove(req.params.id);
  if (!ok) throw new HttpError(404, 'Vehicle not found');
  await activityRepo.log({ user_id: req.user.id, user_name: req.user.name, action: 'Deleted', entity: 'Vehicle', detail: existing?.registration_number });
  res.json({ message: 'Vehicle deleted' });
}

module.exports = { createVehicle, listVehicles, getVehicle, updateVehicle, deleteVehicle };
