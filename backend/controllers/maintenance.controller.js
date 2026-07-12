const maintenanceRepo = require('../repositories/maintenance.repository');
const vehicleRepo = require('../repositories/vehicle.repository');
const HttpError = require('../utils/httpError');

async function createMaintenance(req, res) {
  const { vehicle_id } = req.body;
  const vehicle = await vehicleRepo.findById(vehicle_id);
  if (!vehicle) throw new HttpError(404, 'Vehicle not found');

  const record = await maintenanceRepo.create(req.body);
  // BR: creating an active maintenance record sets the vehicle to In Shop.
  res.status(201).json({ maintenance: record });
}

async function listMaintenance(req, res) {
  const { vehicle_id, status } = req.query;
  res.json({ maintenance: await maintenanceRepo.list({ vehicle_id, status }) });
}

async function getMaintenance(req, res) {
  const record = await maintenanceRepo.findById(req.params.id);
  if (!record) throw new HttpError(404, 'Maintenance record not found');
  res.json({ maintenance: record });
}

async function updateMaintenance(req, res) {
  const existing = await maintenanceRepo.findById(req.params.id);
  if (!existing) throw new HttpError(404, 'Maintenance record not found');
  const record = await maintenanceRepo.update(req.params.id, req.body);
  res.json({ maintenance: record });
}

async function closeMaintenance(req, res) {
  const record = await maintenanceRepo.close(req.params.id);
  // BR: closing maintenance restores the vehicle to Available (unless retired).
  res.json({ maintenance: record });
}

async function deleteMaintenance(req, res) {
  const ok = await maintenanceRepo.remove(req.params.id);
  if (!ok) throw new HttpError(404, 'Maintenance record not found');
  res.json({ message: 'Maintenance record deleted' });
}

module.exports = {
  createMaintenance,
  listMaintenance,
  getMaintenance,
  updateMaintenance,
  closeMaintenance,
  deleteMaintenance,
};
