/* Manual run of the follow-up email job:  npm run reminders */
require('dotenv').config();
const { pool } = require('../src/config/db');
const { dispatchDueReminders } = require('../src/services/reminders');
(async () => {
  try { const r = await dispatchDueReminders(); console.log(`Dispatched ${r.reminded} follow-up email(s).`); }
  catch (e) { console.error('Reminder job failed:', e.message); process.exitCode = 1; }
  finally { await pool.end(); }
})();
