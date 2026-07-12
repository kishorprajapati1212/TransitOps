require('dotenv').config();

const { Pool } = require('pg');

/**
 * Single PostgreSQL connection pool shared across the app.
 * Works with Neon (pooled URI) out of the box.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech')
      ? { rejectUnauthorized: false }
      : undefined,
  max: Number(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  // Unexpected errors on idle clients should not crash the process silently.
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Run a single parameterized query.
 * @param {string} text
 * @param {Array} params
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (process.env.SQL_LOG === 'true') {
    console.log(`[SQL] ${text} | ${Date.now() - start}ms | rows=${res.rowCount}`);
  }
  return res;
}

/**
 * Run a set of operations inside a single transaction.
 * The callback receives a dedicated client and must return the result.
 * Automatically commits on success and rolls back on error.
 * @param {(client) => Promise<any>} callback
 */
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Verify the database is reachable (used at server boot). */
async function testConnection() {
  const res = await pool.query('SELECT NOW() AS now');
  return res.rows[0];
}

module.exports = { pool, query, transaction, testConnection };
