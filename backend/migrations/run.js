require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

/**
 * Lightweight migration runner.
 *  - Creates a `migrations` tracking table.
 *  - Applies schema.sql (the canonical schema) and records it.
 *  - Applies any additional numbered *.sql files in order, skipping ones already applied.
 *
 * Re-running is safe: all DDL uses IF NOT EXISTS / upsert tracking.
 */
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(120) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // 1) Canonical schema (source of truth)
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSql);
    await client.query(
      'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      ['001_initial_schema']
    );
    console.log('Applied: 001_initial_schema (schema.sql)');

    // 2) Additional numbered migration files (excluding schema.sql), in order.
    //    If a numbered file is byte-identical to schema.sql we skip re-executing it
    //    (it is already applied) but still record it as applied.
    const files = fs
      .readdirSync(__dirname)
      .filter((f) => /^(\d+)_.*\.sql$/.test(f) && f !== 'schema.sql')
      .sort();

    for (const file of files) {
      const already = await client.query('SELECT 1 FROM migrations WHERE name = $1', [file]);
      if (already.rowCount > 0) {
        console.log(`Skip (already applied): ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      if (sql.trim() === schemaSql.trim()) {
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
          [file]
        );
        console.log(`Recorded (identical to schema): ${file}`);
        continue;
      }
      await client.query(sql);
      await client.query(
        'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [file]
      );
      console.log(`Applied: ${file}`);
    }

    console.log('Migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
