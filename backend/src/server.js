const app = require('./app');
const env = require('./config/env');
const { pool } = require('./config/db');
const { startScheduler } = require('./services/scheduler');

const server = app.listen(env.port, () =>
  console.log(`Hotel CRM API running on :${env.port} [${env.nodeEnv}]`));

if (env.nodeEnv !== 'test') startScheduler();

const shutdown = async (sig) => {
  console.log(`${sig} received, shutting down...`);
  server.close(async () => { await pool.end(); process.exit(0); });
};
['SIGINT', 'SIGTERM'].forEach((s) => process.on(s, () => shutdown(s)));

module.exports = server;
