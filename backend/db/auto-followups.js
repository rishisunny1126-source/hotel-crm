/* Manual run of the auto follow-up scheduler:  npm run auto-followups
   Schedules the next cadence follow-up for every open enquiry. Safe to re-run. */
require('dotenv').config();
const { pool } = require('../src/config/db');
const { sweepAutoFollowups } = require('../src/services/autoFollowup');
(async () => {
  try { const r = await sweepAutoFollowups(); console.log(`Scheduled ${r.scheduled} auto follow-up(s).`); }
  catch (e) { console.error('Auto follow-up sweep failed:', e.message); process.exitCode = 1; }
  finally { await pool.end(); }
})();
