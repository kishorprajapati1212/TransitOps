const tripRepo = require('../repositories/trip.repository');
const vehicleRepo = require('../repositories/vehicle.repository');
const driverRepo = require('../repositories/driver.repository');
const { isLicenseExpired } = require('../utils/license');
const HttpError = require('../utils/httpError');

/**
 * Central business-rule guard used by create & update.
 * Returns nothing; throws HttpError when a rule is violated.
 */
async function assertAssignable({ vehicle, driver, cargoWeight }) {
  // BR: Retired or In Shop vehicles must never appear in dispatch selection.
  if (!vehicle || !['available'].includes(vehicle.status)) {
    throw new HttpError(400, `Vehicle is '${vehicle ? vehicle.status : 'unknown'}' and cannot be assigned to a trip`);
  }
  if (!driver) throw new HttpError(404, 'Driver not found');
  // BR: Drivers with expired licenses or Suspended status cannot be assigned.
  if (driver.status === 'suspended') throw new HttpError(400, 'Driver is suspended and cannot be assigned');
  if (isLicenseExpired(driver.license_expiry_date)) throw new HttpError(400, 'Driver license is expired');
  // BR: A driver or vehicle already On Trip cannot be assigned to another trip.
  if (driver.status === 'on_trip') throw new HttpError(400, 'Driver is already on a trip');
  // BR: Cargo weight must not exceed vehicle max load capacity.
  if (Number(cargoWeight) > Number(vehicle.max_load_capacity)) {
    throw new HttpError(
      400,
      `Cargo weight ${cargoWeight}kg exceeds vehicle capacity ${vehicle.max_load_capacity}kg`
    );
  }
}

async function createTrip(req, res) {
  const { vehicle_id, driver_id, cargo_weight } = req.body;
  const vehicle = await vehicleRepo.findById(vehicle_id);
  const driver = await driverRepo.findById(driver_id);
  await assertAssignable({ vehicle, driver, cargoWeight: cargo_weight });

  const trip = await tripRepo.create({ ...req.body, created_by: req.user.id });
  res.status(201).json({ trip });
}

async function listTrips(req, res) {
  const { status, vehicle_id, driver_id, search } = req.query;
  res.json({ trips: await tripRepo.list({ status, vehicle_id, driver_id, search }) });
}

async function getTrip(req, res) {
  const trip = await tripRepo.findById(req.params.id);
  if (!trip) throw new HttpError(404, 'Trip not found');
  res.json({ trip });
}

async function updateTrip(req, res) {
  const trip = await tripRepo.findById(req.params.id);
  if (!trip) throw new HttpError(404, 'Trip not found');
  if (trip.status !== 'draft') throw new HttpError(400, 'Only draft trips can be edited');

  const vehicleId = req.body.vehicle_id || trip.vehicle_id;
  const driverId = req.body.driver_id || trip.driver_id;
  const cargoWeight = req.body.cargo_weight !== undefined ? req.body.cargo_weight : trip.cargo_weight;

  const vehicle = await vehicleRepo.findById(vehicleId);
  const driver = await driverRepo.findById(driverId);
  await assertAssignable({ vehicle, driver, cargoWeight });

  const updated = await tripRepo.update(trip.id, req.body);
  res.json({ trip: updated });
}

async function dispatchTrip(req, res) {
  const trip = await tripRepo.findById(req.params.id);
  if (!trip) throw new HttpError(404, 'Trip not found');
  if (trip.status !== 'draft') throw new HttpError(400, 'Only draft trips can be dispatched');

  const vehicle = await vehicleRepo.findById(trip.vehicle_id);
  const driver = await driverRepo.findById(trip.driver_id);
  await assertAssignable({ vehicle, driver, cargoWeight: trip.cargo_weight });

  const updated = await tripRepo.dispatch(trip.id);
  // BR: Dispatching automatically changes vehicle & driver status to On Trip.
  res.json({ trip: updated });
}

async function completeTrip(req, res) {
  const trip = await tripRepo.findById(req.params.id);
  if (!trip) throw new HttpError(404, 'Trip not found');
  if (trip.status !== 'dispatched') throw new HttpError(400, 'Only dispatched trips can be completed');

  const { final_odometer, fuel_consumed, revenue } = req.body;
  const updated = await tripRepo.complete(trip.id, { final_odometer, fuel_consumed, revenue });
  // BR: Completing a trip restores vehicle & driver to Available.
  res.json({ trip: updated });
}

async function cancelTrip(req, res) {
  const trip = await tripRepo.findById(req.params.id);
  if (!trip) throw new HttpError(404, 'Trip not found');
  if (!['draft', 'dispatched'].includes(trip.status)) {
    throw new HttpError(400, 'Only draft or dispatched trips can be cancelled');
  }
  const updated = await tripRepo.cancel(trip.id);
  // BR: Cancelling a dispatched trip restores vehicle & driver to Available.
  res.json({ trip: updated });
}

module.exports = {
  createTrip,
  listTrips,
  getTrip,
  updateTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
};
