const { query } = require('../config/db');

async function log({ user_id, user_name, action, entity, detail }) {
  await query(
    `INSERT INTO activity_logs (user_id, user_name, action, entity, detail) VALUES ($1,$2,$3,$4,$5)`,
    [user_id || null, user_name || 'System', action, entity, detail || null]
  );
}

async function recent(limit = 20) {
  const res = await query(
    `SELECT id, user_name, action, entity, detail, created_at FROM activity_logs ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows;
}

module.exports = { log, recent };
