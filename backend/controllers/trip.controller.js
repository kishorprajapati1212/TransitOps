const tripRepo = require('../repositories/trip.repository');
const vehicleRepo = require('../repositories/vehicle.repository');
const driverRepo = require('../repositories/driver.repository');
const activityRepo = require('../repositories/activity.repository');
const { isLicenseExpired } = require('../utils/license');
const HttpError = require('../utils/httpError');

async function assertAssignable({ vehicle, driver, cargoWeight }) {
  if (!vehicle || !['available'].includes(vehicle.status)) {
    throw new HttpError(400, `Vehicle is '${vehicle ? vehicle.status : 'unknown'}' and cannot be assigned to a trip`);
  }
  if (!driver) throw new HttpError(404, 'Driver not found');
  if (driver.status === 'suspended') throw new HttpError(400, 'Driver is suspended and cannot be assigned');
  if (isLicenseExpired(driver.license_expiry_date)) throw new HttpError(400, 'Driver license is expired');
  if (driver.status === 'on_trip') throw new HttpError(400, 'Driver is already on a trip');
  if (Number(cargoWeight) > Number(vehicle.max_load_capacity)) {
    throw new HttpError(400, `Cargo weight ${cargoWeight}kg exceeds vehicle capacity ${vehicle.max_load_capacity}kg`);
  }
}

function assertTripAccess(req, trip) {
  if (req.user.role === 'fleet_manager') return;
  if (trip.created_by && trip.created_by === req.user.id) return;
  throw new HttpError(403, 'You can only modify trips you created');
}

async function createTrip(req, res) {
  const { vehicle_id, driver_id, cargo_weight } = req.body;
  const vehicle = await vehicleRepo.findById(vehicle_id);
  const driver = await driverRepo.findById(driver_id);
  await assertAssignable({ vehicle, driver, cargoWeight: cargo_weight });

  const trip = await tripRepo.create({ ...req.body, created_by: req.user.id });
  await activityRepo.log({ user_id: req.user.id, user_name: req.user.name, action: 'Created', entity: 'Trip', detail: `${trip.trip_code} — ${req.body.source} → ${req.body.destination}` });
  res.status(201).json({ trip });
}

async function listTrips(req, res) {
  const { status, vehicle_id, driver_id, search } = req.query;
  const filters = { status, vehicle_id, driver_id, search };
  if (req.user.role === 'driver') filters.created_by = req.user.id;
  res.json({ trips: await tripRepo.list(filters) });
}

async function getTrip(req, res) {
  const trip = await tripRepo.findById(req.params.id);
  if (!trip) throw new HttpError(404, 'Trip not found');
  if (req.user.role === 'driver' && trip.created_by !== req.user.id) throw new HttpError(403, 'Access denied');
  res.json({ trip });
}

async function updateTrip(req, res) {
  const trip = await tripRepo.findById(req.params.id);
  if (!trip) throw new HttpError(404, 'Trip not found');
  if (trip.status !== 'draft') throw new HttpError(400, 'Only draft trips can be edited');
  assertTripAccess(req, trip);

  const vehicle = await vehicleRepo.findById(req.body.vehicle_id || trip.vehicle_id);
  const driver = await driverRepo.findById(req.body.driver_id || trip.driver_id);
  await assertAssignable({ vehicle, driver, cargoWeight: req.body.cargo_weight !== undefined ? req.body.cargo_weight : trip.cargo_weight });

  const updated = await tripRepo.update(trip.id, req.body);
  await activityRepo.log({ user_id: req.user.id, user_name: req.user.name, action: 'Updated', entity: 'Trip', detail: trip.trip_code });
  res.json({ trip: updated });
}

async function dispatchTrip(req, res) {
  const trip = await tripRepo.findById(req.params.id);
  if (!trip) throw new HttpError(404, 'Trip not found');
  if (trip.status !== 'draft') throw new HttpError(400, 'Only draft trips can be dispatched');
  assertTripAccess(req, trip);

  const vehicle = await vehicleRepo.findById(trip.vehicle_id);
  const driver = await driverRepo.findById(trip.driver_id);
  await assertAssignable({ vehicle, driver, cargoWeight: trip.cargo_weight });

  const updated = await tripRepo.dispatch(trip.id);
  await activityRepo.log({ user_id: req.user.id, user_name: req.user.name, action: 'Dispatched', entity: 'Trip', detail: `${trip.trip_code} — vehicle & driver now On Trip` });
  res.json({ trip: updated });
}

async function completeTrip(req, res) {
  const trip = await tripRepo.findById(req.params.id);
  if (!trip) throw new HttpError(404, 'Trip not found');
  if (trip.status !== 'dispatched') throw new HttpError(400, 'Only dispatched trips can be completed');
  assertTripAccess(req, trip);

  const updated = await tripRepo.complete(trip.id, req.body);
  await activityRepo.log({ user_id: req.user.id, user_name: req.user.name, action: 'Completed', entity: 'Trip', detail: `${trip.trip_code} — vehicle & driver now Available` });
  res.json({ trip: updated });
}

async function cancelTrip(req, res) {
  const trip = await tripRepo.findById(req.params.id);
  if (!trip) throw new HttpError(404, 'Trip not found');
  if (!['draft', 'dispatched'].includes(trip.status)) throw new HttpError(400, 'Only draft or dispatched trips can be cancelled');
  assertTripAccess(req, trip);

  const updated = await tripRepo.cancel(trip.id);
  await activityRepo.log({ user_id: req.user.id, user_name: req.user.name, action: 'Cancelled', entity: 'Trip', detail: trip.trip_code });
  res.json({ trip: updated });
}

module.exports = { createTrip, listTrips, getTrip, updateTrip, dispatchTrip, completeTrip, cancelTrip };
