const { query } = require('../config/db');

const COLUMNS = 'id, vehicle_id, trip_id, liters, cost, log_date, created_at';

async function findById(id) {
  const res = await query(`SELECT ${COLUMNS} FROM fuel_logs WHERE id = $1`, [id]);
  return res.rows[0];
}

async function list({ vehicle_id, trip_id, from, to } = {}) {
  const where = [];
  const params = [];
  if (vehicle_id) {
    params.push(vehicle_id);
    where.push(`f.vehicle_id = $${params.length}`);
  }
  if (trip_id) {
    params.push(trip_id);
    where.push(`f.trip_id = $${params.length}`);
  }
  if (from) {
    params.push(from);
    where.push(`f.log_date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    where.push(`f.log_date <= $${params.length}`);
  }
  const sql = `
    SELECT f.id, f.vehicle_id, f.trip_id, f.liters, f.cost, f.log_date, f.created_at,
           v.registration_number AS vehicle_registration
    FROM fuel_logs f
    LEFT JOIN vehicles v ON v.id = f.vehicle_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY f.log_date DESC`;
  const res = await query(sql, params);
  return res.rows;
}

async function create({ vehicle_id, trip_id, liters, cost, log_date }) {
  const cols = ['vehicle_id', 'trip_id', 'liters', 'cost'];
  const vals = [vehicle_id, trip_id || null, liters, cost];
  if (log_date) {
    cols.push('log_date');
    vals.push(log_date);
  }
  const placeholders = cols.map((_, i) => '$' + (i + 1)).join(', ');
  const res = await query(
    `INSERT INTO fuel_logs (${cols.join(', ')}) VALUES (${placeholders}) RETURNING ${COLUMNS}`,
    vals
  );
  return res.rows[0];
}

async function remove(id) {
  const res = await query('DELETE FROM fuel_logs WHERE id = $1 RETURNING id', [id]);
  return res.rowCount > 0;
}

module.exports = { findById, list, create, remove };
