const { query, transaction } = require('../config/db');
const HttpError = require('../utils/httpError');

const COLUMNS =
  'id, trip_code, source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status, final_odometer, fuel_consumed, revenue, dispatched_at, completed_at, created_by, created_at, updated_at';

function genTripCode() {
  return 'TRP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

async function findByCode(code) {
  const res = await query(`SELECT ${COLUMNS} FROM trips WHERE trip_code = $1`, [code]);
  return res.rows[0];
}

async function findById(id) {
  const res = await query(`SELECT ${COLUMNS} FROM trips WHERE id = $1`, [id]);
  return res.rows[0];
}

async function create(data) {
  // Retry a few times in case the generated trip_code collides (unique constraint).
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await query(
        `INSERT INTO trips
           (trip_code, source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'draft',$8)
         RETURNING ${COLUMNS}`,
        [
          genTripCode(),
          data.source,
          data.destination,
          data.vehicle_id,
          data.driver_id,
          data.cargo_weight,
          data.planned_distance,
          data.created_by || null,
        ]
      );
      return res.rows[0];
    } catch (err) {
      if (err.code === '23505') continue; // unique violation on trip_code -> retry
      throw err;
    }
  }
  throw new HttpError(500, 'Unable to generate a unique trip code');
}

async function update(id, data) {
  const map = {
    source: data.source,
    destination: data.destination,
    vehicle_id: data.vehicle_id,
    driver_id: data.driver_id,
    cargo_weight: data.cargo_weight,
    planned_distance: data.planned_distance,
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
    `UPDATE trips SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING ${COLUMNS}`,
    params
  );
  return res.rows[0];
}

async function list({ status, vehicle_id, driver_id, search, created_by } = {}) {
  const where = [];
  const params = [];
  if (status) {
    params.push(status);
    where.push(`t.status = $${params.length}`);
  }
  if (vehicle_id) {
    params.push(vehicle_id);
    where.push(`t.vehicle_id = $${params.length}`);
  }
  if (driver_id) {
    params.push(driver_id);
    where.push(`t.driver_id = $${params.length}`);
  }
  if (created_by) {
    params.push(created_by);
    where.push(`t.created_by = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(
      `(t.trip_code ILIKE $${params.length} OR t.source ILIKE $${params.length} OR t.destination ILIKE $${params.length})`
    );
  }
  // Columns must be qualified with the `t` alias because the join pulls in
  // `vehicles` and `drivers`, both of which also expose an `id` column.
  // An unqualified `id` makes the query ambiguous -> 500 (column reference "id" is ambiguous).
  const LIST_COLUMNS =
    't.id, t.trip_code, t.source, t.destination, t.vehicle_id, t.driver_id, ' +
    't.cargo_weight, t.planned_distance, t.status, t.final_odometer, t.fuel_consumed, ' +
    't.revenue, t.dispatched_at, t.completed_at, t.created_by, t.created_at, t.updated_at';

  const sql = `SELECT ${LIST_COLUMNS},
       v.registration_number AS vehicle_registration,
       d.name AS driver_name
     FROM trips t
     LEFT JOIN vehicles v ON v.id = t.vehicle_id
     LEFT JOIN drivers d ON d.id = t.driver_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY t.created_at DESC`;
  const res = await query(sql, params);
  return res.rows;
}

/* ---------------- Transactional state transitions ---------------- */

async function dispatch(tripId) {
  return transaction(async (client) => {
    const t = (await client.query(`SELECT ${COLUMNS} FROM trips WHERE id = $1 FOR UPDATE`, [tripId])).rows[0];
    if (!t) throw new HttpError(404, 'Trip not found');
    if (t.status !== 'draft') throw new HttpError(400, 'Only draft trips can be dispatched');

    await client.query(`UPDATE vehicles SET status = 'on_trip', updated_at = NOW() WHERE id = $1`, [t.vehicle_id]);
    await client.query(`UPDATE drivers SET status = 'on_trip', updated_at = NOW() WHERE id = $1`, [t.driver_id]);
    const res = await client.query(
      `UPDATE trips SET status = 'dispatched', dispatched_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING ${COLUMNS}`,
      [tripId]
    );
    return res.rows[0];
  });
}

async function complete(tripId, { final_odometer, fuel_consumed, revenue }) {
  return transaction(async (client) => {
    const t = (await client.query(`SELECT ${COLUMNS} FROM trips WHERE id = $1 FOR UPDATE`, [tripId])).rows[0];
    if (!t) throw new HttpError(404, 'Trip not found');
    if (t.status !== 'dispatched') throw new HttpError(400, 'Only dispatched trips can be completed');

    await client.query(`UPDATE vehicles SET status = 'available', odometer = $2, updated_at = NOW() WHERE id = $1`, [
      t.vehicle_id,
      final_odometer,
    ]);
    await client.query(`UPDATE drivers SET status = 'available', updated_at = NOW() WHERE id = $1`, [t.driver_id]);
    const res = await client.query(
      `UPDATE trips
         SET status = 'completed', completed_at = NOW(), final_odometer = $2,
             fuel_consumed = $3, revenue = COALESCE($4, revenue), updated_at = NOW()
       WHERE id = $1 RETURNING ${COLUMNS}`,
      [tripId, final_odometer, fuel_consumed ?? null, revenue ?? null]
    );
    return res.rows[0];
  });
}

async function cancel(tripId) {
  return transaction(async (client) => {
    const t = (await client.query(`SELECT ${COLUMNS} FROM trips WHERE id = $1 FOR UPDATE`, [tripId])).rows[0];
    if (!t) throw new HttpError(404, 'Trip not found');
    if (!['draft', 'dispatched'].includes(t.status)) {
      throw new HttpError(400, 'Only draft or dispatched trips can be cancelled');
    }
    if (t.status === 'dispatched') {
      // Restore vehicle & driver only if they are still assigned to this trip and on trip.
      await client.query(
        `UPDATE vehicles SET status = 'available', updated_at = NOW() WHERE id = $1 AND status = 'on_trip'`,
        [t.vehicle_id]
      );
      await client.query(
        `UPDATE drivers SET status = 'available', updated_at = NOW() WHERE id = $1 AND status = 'on_trip'`,
        [t.driver_id]
      );
    }
    const res = await client.query(
      `UPDATE trips SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING ${COLUMNS}`,
      [tripId]
    );
    return res.rows[0];
  });
}

module.exports = { findByCode, findById, create, update, list, dispatch, complete, cancel };
