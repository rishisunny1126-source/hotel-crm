const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/respond');
const { generateFollowUpMessage } = require('../services/messaging');
const { dispatchDueReminders } = require('../services/reminders');
const { sweepAutoFollowups } = require('../services/autoFollowup');

exports.list = asyncHandler(async (req, res) => {
  const where = [], params = [];
  for (const f of ['status','enquiry_id','assigned_staff_id','priority']) {
    if (req.query[f]) { params.push(req.query[f]); where.push(`f.${f}=$${params.length}`); }
  }
  if (req.query.overdue === 'true') where.push(`f.status='pending' AND f.scheduled_date < CURRENT_DATE`);
  if (req.query.today === 'true') where.push(`f.scheduled_date = CURRENT_DATE`);
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await query(
    `SELECT f.*, e.guest_name, e.mobile FROM follow_ups f
     JOIN enquiries e ON e.id=f.enquiry_id ${w}
     ORDER BY f.scheduled_date ASC, f.scheduled_time ASC NULLS LAST`, params);
  ok(res, rows.rows);
});

exports.create = asyncHandler(async (req, res) => {
  const { enquiry_id, scheduled_date, scheduled_time, notes, priority, assigned_staff_id } = req.body;
  const enq = await query('SELECT 1 FROM enquiries WHERE id=$1', [enquiry_id]);
  if (!enq.rowCount) throw ApiError.notFound('Enquiry not found');
  const { rows } = await query(
    `INSERT INTO follow_ups(enquiry_id,scheduled_date,scheduled_time,notes,priority,assigned_staff_id,created_by)
     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [enquiry_id, scheduled_date, scheduled_time, notes, priority || 'medium', assigned_staff_id, req.user.id]);
  await query(`INSERT INTO enquiry_history(enquiry_id,event_type,actor_id,note)
     VALUES($1,'follow_up_added',$2,$3)`, [enquiry_id, req.user.id, `Follow-up on ${scheduled_date}`]);
  // bump enquiry to follow_up_pending if still early-stage
  await query(`UPDATE enquiries SET status='follow_up_pending'
     WHERE id=$1 AND status IN ('new','contacted','interested')`, [enquiry_id]);
  created(res, rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const allowed = ['scheduled_date','scheduled_time','notes','priority','status','assigned_staff_id'];
  const keys = allowed.filter(k => req.body[k] !== undefined);
  if (!keys.length) throw ApiError.badRequest('No valid fields');
  const set = keys.map((k, i) => `${k}=$${i + 1}`).join(',');
  const vals = keys.map(k => req.body[k]); vals.push(req.params.id);
  const { rows } = await query(`UPDATE follow_ups SET ${set} WHERE id=$${vals.length} RETURNING *`, vals);
  if (!rows[0]) throw ApiError.notFound('Follow-up not found');
  ok(res, rows[0]);
});

exports.complete = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE follow_ups SET status='completed', completed_at=now() WHERE id=$1 RETURNING *`, [req.params.id]);
  if (!rows[0]) throw ApiError.notFound('Follow-up not found');
  ok(res, rows[0]);
});


// GET /follow-ups/message/:enquiryId  -> AI/rule-based personalized follow-up message
exports.message = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM enquiries WHERE id=$1', [req.params.enquiryId]);
  if (!rows[0]) throw ApiError.notFound('Enquiry not found');
  ok(res, generateFollowUpMessage(rows[0]));
});

// POST /follow-ups/remind  -> "send" reminders for due/overdue pending follow-ups
exports.remind = asyncHandler(async (req, res) => {
  ok(res, await dispatchDueReminders());
});

// POST /follow-ups/auto-sweep  -> schedule the next auto follow-up for every open lead
exports.autoSweep = asyncHandler(async (req, res) => {
  ok(res, await sweepAutoFollowups());
});
