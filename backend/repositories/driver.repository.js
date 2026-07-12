const { query } = require('../config/db');
const { ALLOWED_STATUS } = require('../validation/driver.validation');

const COLUMNS =
  'id, name, license_number, license_category, license_expiry_date, contact_number, safety_score, status, created_at, updated_at';

async function licenseExists(licenseNumber, exceptId) {
  const res = await query(
    'SELECT 1 FROM drivers WHERE license_number = $1 AND ($2::uuid IS NULL OR id <> $2)',
    [licenseNumber, exceptId || null]
  );
  return res.rowCount > 0;
}

async function findById(id) {
  const res = await query(`SELECT ${COLUMNS} FROM drivers WHERE id = $1`, [id]);
  return res.rows[0];
}

async function list({ status, search } = {}) {
  const where = [];
  const params = [];
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(name ILIKE $${params.length} OR license_number ILIKE $${params.length})`);
  }
  const sql = `SELECT ${COLUMNS} FROM drivers ${
    where.length ? 'WHERE ' + where.join(' AND ') : ''
  } ORDER BY created_at DESC`;
  const res = await query(sql, params);
  return res.rows;
}

async function create(data) {
  const res = await query(
    `INSERT INTO drivers
       (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING ${COLUMNS}`,
    [
      data.name,
      data.license_number,
      data.license_category,
      data.license_expiry_date,
      data.contact_number || null,
      data.safety_score ?? 0,
      data.status || 'off_duty',
    ]
  );
  return res.rows[0];
}

async function update(id, data) {
  const map = {
    name: data.name,
    license_number: data.license_number,
    license_category: data.license_category,
    license_expiry_date: data.license_expiry_date,
    contact_number: data.contact_number,
    safety_score: data.safety_score,
    status: data.status,
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
    `UPDATE drivers SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING ${COLUMNS}`,
    params
  );
  return res.rows[0];
}

async function remove(id) {
  const res = await query('DELETE FROM drivers WHERE id = $1 RETURNING id', [id]);
  return res.rowCount > 0;
}

module.exports = { licenseExists, findById, list, create, update, remove, ALLOWED_STATUS };
