const { query } = require('../config/db');

const COLUMNS = 'id, vehicle_id, trip_id, category, description, amount, expense_date, created_at';

async function findById(id) {
  const res = await query(`SELECT ${COLUMNS} FROM expenses WHERE id = $1`, [id]);
  return res.rows[0];
}

async function list({ category, vehicle_id, trip_id, from, to } = {}) {
  const where = [];
  const params = [];
  if (category) {
    params.push(category);
    where.push(`category = $${params.length}`);
  }
  if (vehicle_id) {
    params.push(vehicle_id);
    where.push(`e.vehicle_id = $${params.length}`);
  }
  if (trip_id) {
    params.push(trip_id);
    where.push(`e.trip_id = $${params.length}`);
  }
  if (from) {
    params.push(from);
    where.push(`e.expense_date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    where.push(`e.expense_date <= $${params.length}`);
  }
  const sql = `
    SELECT e.id, e.vehicle_id, e.trip_id, e.category, e.description, e.amount, e.expense_date, e.created_at,
           v.registration_number AS vehicle_registration
    FROM expenses e
    LEFT JOIN vehicles v ON v.id = e.vehicle_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY e.expense_date DESC`;
  const res = await query(sql, params);
  return res.rows;
}

async function create({ category, amount, vehicle_id, trip_id, description, expense_date }) {
  const cols = ['category', 'amount', 'vehicle_id', 'trip_id', 'description'];
  const vals = [category, amount, vehicle_id || null, trip_id || null, description || null];
  if (expense_date) {
    cols.push('expense_date');
    vals.push(expense_date);
  }
  const placeholders = cols.map((_, i) => '$' + (i + 1)).join(', ');
  const res = await query(
    `INSERT INTO expenses (${cols.join(', ')}) VALUES (${placeholders}) RETURNING ${COLUMNS}`,
    vals
  );
  return res.rows[0];
}

async function remove(id) {
  const res = await query('DELETE FROM expenses WHERE id = $1 RETURNING id', [id]);
  return res.rowCount > 0;
}

module.exports = { findById, list, create, remove };
