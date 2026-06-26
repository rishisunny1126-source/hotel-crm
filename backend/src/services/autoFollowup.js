/*
 * Automatic follow-up engine.
 *
 * Instead of staff manually creating every follow-up, the system schedules them
 * on a cadence: by default 1, 3, then 7 days after the enquiry was created.
 * Each step is a normal row in `follow_ups` (so it shows on the Follow-Ups page
 * and the 9 AM reminder job emails the guest automatically) but flagged
 * `auto_generated = true` and numbered with `sequence_no`.
 *
 * The chain advances itself and stops automatically when the guest books
 * (enquiry -> confirmed) or the lead is marked cancelled/lost.
 *
 * Config (env):
 *   FOLLOWUP_CADENCE_DAYS   comma list of day-offsets from creation. Default "1,3,7".
 *   AUTO_FOLLOWUP           set to "off" to disable auto-creation entirely.
 */
const { query } = require('../config/db');

const OPEN_STATUSES = ['new', 'contacted', 'interested', 'follow_up_pending'];
const PRIORITY_BY_STEP = ['low', 'medium', 'high', 'urgent'];

function cadence() {
  return (process.env.FOLLOWUP_CADENCE_DAYS || '1,3,7')
    .split(',')
    .map((n) => parseInt(n.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 0);
}

function enabled() {
  return (process.env.AUTO_FOLLOWUP || 'on').toLowerCase() !== 'off';
}

/**
 * Ensure the given enquiry has its next auto follow-up scheduled.
 * Idempotent: does nothing if the enquiry is closed, already has a pending
 * auto follow-up, or has exhausted the cadence.
 * @returns the created follow-up row, or null if nothing was created.
 */
async function scheduleNextAutoFollowup(enquiryId) {
  if (!enabled()) return null;
  const steps = cadence();
  if (!steps.length) return null;

  const enq = await query(
    `SELECT id, status, created_at::date AS base_date, assigned_staff_id
     FROM enquiries WHERE id = $1`, [enquiryId]);
  if (!enq.rowCount) return null;
  const e = enq.rows[0];
  if (!OPEN_STATUSES.includes(e.status)) return null;

  // Look at existing auto follow-ups for this enquiry.
  const existing = await query(
    `SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE status = 'pending')::int AS pending
     FROM follow_ups
     WHERE enquiry_id = $1 AND auto_generated = true`, [enquiryId]);
  const { total, pending } = existing.rows[0];

  // Never stack two open auto follow-ups on the same lead.
  if (pending > 0) return null;

  const nextSeq = total + 1;            // 1-based step we are about to schedule
  if (nextSeq > steps.length) return null; // cadence exhausted — stop nudging

  const offset = steps[nextSeq - 1];
  const priority = PRIORITY_BY_STEP[Math.min(nextSeq - 1, PRIORITY_BY_STEP.length - 1)];
  const note = `Auto follow-up #${nextSeq} (${offset}d after enquiry)`;

  const ins = await query(
    `INSERT INTO follow_ups
       (enquiry_id, scheduled_date, notes, priority, status,
        assigned_staff_id, auto_generated, sequence_no)
     VALUES ($1, ($2::date + $3::int), $4, $5, 'pending', $6, true, $7)
     RETURNING *`,
    [enquiryId, e.base_date, offset, note, priority, e.assigned_staff_id, nextSeq]);

  await query(
    `INSERT INTO enquiry_history(enquiry_id, event_type, note)
     VALUES ($1, 'auto_follow_up_added', $2)`,
    [enquiryId, `${note} on ${ins.rows[0].scheduled_date.toISOString?.().slice(0, 10) || ins.rows[0].scheduled_date}`]);

  // Move early-stage leads into the follow-up pipeline.
  await query(
    `UPDATE enquiries SET status = 'follow_up_pending'
     WHERE id = $1 AND status IN ('new', 'contacted', 'interested')`, [enquiryId]);

  return ins.rows[0];
}

/**
 * Sweep every open enquiry and schedule the next auto follow-up where due.
 * Run daily (the scheduler calls this) so the chain keeps advancing and any
 * leads created before this feature existed get picked up too.
 * @returns { scheduled: number }
 */
async function sweepAutoFollowups() {
  if (!enabled()) return { scheduled: 0, disabled: true };
  const open = await query(
    `SELECT id FROM enquiries WHERE status = ANY($1::enquiry_status[])`, [OPEN_STATUSES]);
  let scheduled = 0;
  for (const row of open.rows) {
    const created = await scheduleNextAutoFollowup(row.id);
    if (created) scheduled += 1;
  }
  return { scheduled };
}

/**
 * Cancel any still-pending auto follow-ups for an enquiry — called when the
 * lead is won (booked) or closed (cancelled/lost) so no stray reminder emails go out.
 * @returns number of follow-ups cancelled.
 */
async function cancelAutoFollowups(enquiryId) {
  const r = await query(
    `UPDATE follow_ups SET status = 'cancelled'
     WHERE enquiry_id = $1 AND auto_generated = true AND status = 'pending'`, [enquiryId]);
  return r.rowCount;
}

module.exports = {
  scheduleNextAutoFollowup,
  sweepAutoFollowups,
  cancelAutoFollowups,
  OPEN_STATUSES,
  cadence,
};
