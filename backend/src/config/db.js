/* Neon serverless driver — connects to PostgreSQL over HTTPS/WebSocket (port 443),
   so it works even on networks that block the normal Postgres port 5432.
   API is drop-in compatible with node-postgres (pool.query, pool.connect, transactions). */
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config();

neonConfig.webSocketConstructor = ws;   // required in Node.js

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', (err) => console.error('Unexpected DB error', err));

const query = (text, params) => pool.query(text, params);
module.exports = { pool, query };
