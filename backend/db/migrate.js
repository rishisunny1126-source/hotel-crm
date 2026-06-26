/* Simple SQL migration runner: applies db/migrations/*.sql in order, tracked in _migrations table */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())`);
    for (const f of files) {
      const done = await client.query('SELECT 1 FROM _migrations WHERE name=$1', [f]);
      if (done.rowCount) { console.log('skip', f); continue; }
      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations(name) VALUES($1)', [f]);
      await client.query('COMMIT');
      console.log('applied', f);
    }
  } catch (e) {
    await client.query('ROLLBACK'); console.error('Migration failed:', e.message); process.exit(1);
  } finally {
    client.release(); await pool.end();
  }
}
run();
