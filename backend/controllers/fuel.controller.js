const fuelRepo = require('../repositories/fuel.repository');
const vehicleRepo = require('../repositories/vehicle.repository');
const HttpError = require('../utils/httpError');

async function createFuelLog(req, res) {
  const { vehicle_id } = req.body;
  const vehicle = await vehicleRepo.findById(vehicle_id);
  if (!vehicle) throw new HttpError(404, 'Vehicle not found');

  const log = await fuelRepo.create(req.body);
  res.status(201).json({ fuelLog: log });
}

async function listFuelLogs(req, res) {
  const { vehicle_id, trip_id, from, to } = req.query;
  res.json({ fuelLogs: await fuelRepo.list({ vehicle_id, trip_id, from, to }) });
}

async function getFuelLog(req, res) {
  const log = await fuelRepo.findById(req.params.id);
  if (!log) throw new HttpError(404, 'Fuel log not found');
  res.json({ fuelLog: log });
}

async function deleteFuelLog(req, res) {
  const ok = await fuelRepo.remove(req.params.id);
  if (!ok) throw new HttpError(404, 'Fuel log not found');
  res.json({ message: 'Fuel log deleted' });
}

module.exports = { createFuelLog, listFuelLogs, getFuelLog, deleteFuelLog };
