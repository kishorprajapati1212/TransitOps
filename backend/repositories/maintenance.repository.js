const { query, transaction } = require('../config/db');
const HttpError = require('../utils/httpError');

const COLUMNS =
  'id, vehicle_id, type, description, cost, status, performed_at, closed_at, created_at, updated_at';

async function findById(id) {
  const res = await query(`SELECT ${COLUMNS} FROM maintenance_logs WHERE id = $1`, [id]);
  return res.rows[0];
}

async function list({ vehicle_id, status } = {}) {
  const where = [];
  const params = [];
  if (vehicle_id) {
    params.push(vehicle_id);
    where.push(`m.vehicle_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`m.status = $${params.length}`);
  }
  const sql = `
    SELECT m.id, m.vehicle_id, m.type, m.description, m.cost, m.status,
           m.performed_at, m.closed_at, m.created_at, m.updated_at,
           v.registration_number AS vehicle_registration, v.name AS vehicle_name
    FROM maintenance_logs m
    LEFT JOIN vehicles v ON v.id = m.vehicle_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY m.performed_at DESC`;
  const res = await query(sql, params);
  return res.rows;
}

async function create({ vehicle_id, type, description, cost, performed_at }) {
  return transaction(async (client) => {
    const veh = (await client.query('SELECT id, status FROM vehicles WHERE id = $1 FOR UPDATE', [vehicle_id])).rows[0];
    if (!veh) throw new HttpError(404, 'Vehicle not found');

    const res = await client.query(
      `INSERT INTO maintenance_logs (vehicle_id, type, description, cost, status, performed_at)
       VALUES ($1,$2,$3,$4,'open',$5)
       RETURNING ${COLUMNS}`,
      [vehicle_id, type, description || null, cost ?? 0, performed_at || new Date().toISOString()]
    );

    await client.query(`UPDATE vehicles SET status = 'in_shop', updated_at = NOW() WHERE id = $1`, [vehicle_id]);
    return res.rows[0];
  });
}

async function update(id, { type, description, cost }) {
  const fields = [];
  const params = [];
  if (type !== undefined) {
    params.push(type);
    fields.push(`type = $${params.length}`);
  }
  if (description !== undefined) {
    params.push(description);
    fields.push(`description = $${params.length}`);
  }
  if (cost !== undefined) {
    params.push(cost);
    fields.push(`cost = $${params.length}`);
  }
  if (!fields.length) return findById(id);
  params.push(id);
  const res = await query(
    `UPDATE maintenance_logs SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING ${COLUMNS}`,
    params
  );
  return res.rows[0];
}

async function close(id) {
  return transaction(async (client) => {
    const m = (await client.query(`SELECT ${COLUMNS} FROM maintenance_logs WHERE id = $1 FOR UPDATE`, [id])).rows[0];
    if (!m) throw new HttpError(404, 'Maintenance record not found');
    if (m.status === 'closed') throw new HttpError(400, 'Maintenance record is already closed');

    await client.query(
      `UPDATE maintenance_logs SET status = 'closed', closed_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );
    await client.query(
      `UPDATE vehicles SET status = 'available', updated_at = NOW() WHERE id = $1 AND status <> 'retired'`,
      [m.vehicle_id]
    );
    const res = await client.query(`SELECT ${COLUMNS} FROM maintenance_logs WHERE id = $1`, [id]);
    return res.rows[0];
  });
}

async function remove(id) {
  const res = await query('DELETE FROM maintenance_logs WHERE id = $1 RETURNING id', [id]);
  return res.rowCount > 0;
}

module.exports = { findById, list, create, update, close, remove };
