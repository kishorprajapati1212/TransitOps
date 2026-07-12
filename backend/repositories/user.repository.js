const { query } = require('../config/db');

const COLUMNS = 'id, name, email, role, created_at, updated_at';

async function findByEmail(email) {
  const res = await query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
}

async function findById(id) {
  const res = await query(`SELECT ${COLUMNS} FROM users WHERE id = $1`, [id]);
  return res.rows[0];
}

async function emailExists(email, exceptId) {
  const res = await query(
    'SELECT 1 FROM users WHERE email = $1 AND ($2::uuid IS NULL OR id <> $2)',
    [email, exceptId || null]
  );
  return res.rowCount > 0;
}

async function create({ name, email, password_hash, role }) {
  const res = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNS}`,
    [name, email, password_hash, role || 'driver']
  );
  return res.rows[0];
}

async function list() {
  const res = await query(`SELECT ${COLUMNS} FROM users ORDER BY created_at DESC`);
  return res.rows;
}

async function updateRole(id, role) {
  const res = await query(
    `UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1 RETURNING ${COLUMNS}`,
    [id, role]
  );
  return res.rows[0];
}

async function remove(id) {
  const res = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  return res.rowCount > 0;
}

module.exports = { findByEmail, findById, emailExists, create, list, updateRole, remove };
