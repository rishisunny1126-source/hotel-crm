const cron = require('node-cron');
const { dispatchDueReminders } = require('./reminders');
const { sweepAutoFollowups } = require('./autoFollowup');

// Runs every morning while the server is up:
//   1. Auto-schedule the next follow-up for every open lead (advances the cadence).
//   2. Email every guest whose follow-up is now due/overdue.
// Doing the sweep first means a follow-up that becomes due today still goes out
// in the same run.
function startScheduler() {
  const expr = process.env.REMINDER_CRON || '0 9 * * *';   // 09:00 every day
  if (!cron.validate(expr)) { console.warn('Invalid REMINDER_CRON, scheduler off'); return; }
  cron.schedule(expr, async () => {
    try {
      const s = await sweepAutoFollowups();
      console.log(`[auto-followup] ${new Date().toISOString()} — scheduled ${s.scheduled} new follow-up(s)`);
    } catch (e) { console.error('[auto-followup] sweep failed:', e.message); }
    try {
      const r = await dispatchDueReminders();
      console.log(`[reminders] ${new Date().toISOString()} — dispatched ${r.reminded} follow-up email(s)`);
    } catch (e) { console.error('[reminders] job failed:', e.message); }
  });
  console.log(`Follow-up scheduler active (cron: ${expr}) — auto-create + reminder emails`);
}
module.exports = { startScheduler };
