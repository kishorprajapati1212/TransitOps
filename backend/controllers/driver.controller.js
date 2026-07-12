const driverRepo = require('../repositories/driver.repository');
const HttpError = require('../utils/httpError');

async function createDriver(req, res) {
  const { license_number } = req.body;
  if (await driverRepo.licenseExists(license_number)) {
    throw new HttpError(409, 'License number already exists');
  }
  const driver = await driverRepo.create(req.body);
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
  res.json({ driver });
}

async function deleteDriver(req, res) {
  const ok = await driverRepo.remove(req.params.id);
  if (!ok) throw new HttpError(404, 'Driver not found');
  res.json({ message: 'Driver deleted' });
}

module.exports = { createDriver, listDrivers, getDriver, updateDriver, deleteDriver };
