const { query } = require('../config/db');
const { ALLOWED_STATUS } = require('../validation/vehicle.validation');

const COLUMNS =
  'id, registration_number, name, type, max_load_capacity, odometer, acquisition_cost, status, region, created_at, updated_at';

async function registrationExists(reg, exceptId) {
  const res = await query(
    'SELECT 1 FROM vehicles WHERE registration_number = $1 AND ($2::uuid IS NULL OR id <> $2)',
    [reg, exceptId || null]
  );
  return res.rowCount > 0;
}

async function findById(id) {
  const res = await query(`SELECT ${COLUMNS} FROM vehicles WHERE id = $1`, [id]);
  return res.rows[0];
}

async function list({ status, type, region, search } = {}) {
  const where = [];
  const params = [];
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (type) {
    params.push(type);
    where.push(`type = $${params.length}`);
  }
  if (region) {
    params.push(region);
    where.push(`region = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(registration_number ILIKE $${params.length} OR name ILIKE $${params.length})`);
  }
  const sql = `SELECT ${COLUMNS} FROM vehicles ${
    where.length ? 'WHERE ' + where.join(' AND ') : ''
  } ORDER BY created_at DESC`;
  const res = await query(sql, params);
  return res.rows;
}

async function create(data) {
  const res = await query(
    `INSERT INTO vehicles
       (registration_number, name, type, max_load_capacity, odometer, acquisition_cost, status, region)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING ${COLUMNS}`,
    [
      data.registration_number,
      data.name,
      data.type,
      data.max_load_capacity,
      data.odometer ?? 0,
      data.acquisition_cost ?? 0,
      data.status || 'available',
      data.region || null,
    ]
  );
  return res.rows[0];
}

async function update(id, data) {
  const map = {
    name: data.name,
    type: data.type,
    max_load_capacity: data.max_load_capacity,
    odometer: data.odometer,
    acquisition_cost: data.acquisition_cost,
    status: data.status,
    region: data.region,
  };
  const fields = [];
  const params = [];
  for (const [key, value] of Object.entries(map)) {
    if (value !== undefined) {
      params.push(value);
      fields.push(`${key} = $${params.length}`);
    }
  }
  if (!fields.length) return findById(id);
  params.push(id);
  const res = await query(
    `UPDATE vehicles SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING ${COLUMNS}`,
    params
  );
  return res.rows[0];
}

async function setStatus(id, status) {
  const res = await query(
    `UPDATE vehicles SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING ${COLUMNS}`,
    [id, status]
  );
  return res.rows[0];
}

async function remove(id) {
  const res = await query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [id]);
  return res.rowCount > 0;
}

module.exports = { registrationExists, findById, list, create, update, setStatus, remove, ALLOWED_STATUS };
