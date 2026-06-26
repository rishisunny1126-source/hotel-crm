const { pool, query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/respond');
const { generateFollowUpMessage, sendEmail } = require('../services/messaging');
const { scheduleNextAutoFollowup, cancelAutoFollowups } = require('../services/autoFollowup');

const CLOSED_STATUSES = ['confirmed', 'cancelled', 'lost'];

const FIELDS =['guest_name','mobile','email','city','source','room_type','guests_count',
  'check_in_date','check_out_date','budget','special_requirements','status','assigned_staff_id','guest_id'];

async function logHistory(client, enquiryId, eventType, from, to, actorId, note) {
  await client.query(
    `INSERT INTO enquiry_history(enquiry_id,event_type,from_value,to_value,actor_id,note)
     VALUES($1,$2,$3,$4,$5,$6)`, [enquiryId, eventType, from, to, actorId, note]);
}

exports.list = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
  const offset = (page - 1) * limit;
  const where = [], params = [];
  if (req.query.q) {
    params.push(`%${req.query.q}%`);
    where.push(`(guest_name ILIKE $${params.length} OR mobile ILIKE $${params.length} OR email ILIKE $${params.length})`);
  }
  for (const f of ['status','source','assigned_staff_id']) {
    if (req.query[f]) { params.push(req.query[f]); where.push(`${f}=$${params.length}`); }
  }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = await query(`SELECT count(*)::int n FROM enquiries ${w}`, params);
  params.push(limit, offset);
  const rows = await query(
    `SELECT e.*, u.name AS assigned_staff_name FROM enquiries e
     LEFT JOIN users u ON u.id=e.assigned_staff_id
     ${w} ORDER BY e.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params);
  ok(res, rows.rows, { page, limit, total: total.rows[0].n });
});

exports.get = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM enquiries WHERE id=$1', [req.params.id]);
  if (!rows[0]) throw ApiError.notFound('Enquiry not found');
  const fu = await query('SELECT * FROM follow_ups WHERE enquiry_id=$1 ORDER BY scheduled_date', [req.params.id]);
  const hist = await query('SELECT * FROM enquiry_history WHERE enquiry_id=$1 ORDER BY created_at', [req.params.id]);
  ok(res, { ...rows[0], follow_ups: fu.rows, history: hist.rows });
});

exports.create = asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const keys = FIELDS.filter(f => req.body[f] !== undefined);
    const ref = 'ENQ-' + Date.now().toString().slice(-7);
    keys.push('ref_code', 'created_by');
    const vals = keys.map(k => k === 'ref_code' ? ref : k === 'created_by' ? req.user.id : req.body[k]);
    const ph = keys.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await client.query(
      `INSERT INTO enquiries(${keys.join(',')}) VALUES(${ph}) RETURNING *`, vals);
    await logHistory(client, rows[0].id, 'created', null, rows[0].status, req.user.id, 'Enquiry created');
    await client.query('COMMIT');
    // immediate acknowledgement / first follow-up email to the guest
    if (rows[0].email) sendEmail(generateFollowUpMessage(rows[0]))
      .catch(e => console.error('[email] enquiry ack failed:', e.message));
    // Kick off the automatic follow-up chain. Non-fatal: a new enquiry must
    // still succeed even if scheduling the first nudge hiccups.
    scheduleNextAutoFollowup(rows[0].id).catch((err) =>
      console.error('[auto-followup] schedule on create failed:', err.message));
    created(res, rows[0]);
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
});

exports.update = asyncHandler(async (req, res) => {
  const keys = FIELDS.filter(f => req.body[f] !== undefined && f !== 'status');
  if (!keys.length) throw ApiError.badRequest('No valid fields');
  const set = keys.map((k, i) => `${k}=$${i + 1}`).join(',');
  const vals = keys.map(k => req.body[k]); vals.push(req.params.id);
  const { rows } = await query(`UPDATE enquiries SET ${set} WHERE id=$${vals.length} RETURNING *`, vals);
  if (!rows[0]) throw ApiError.notFound('Enquiry not found');
  await query(`INSERT INTO enquiry_history(enquiry_id,event_type,actor_id,note)
     VALUES($1,'updated',$2,'Details updated')`, [req.params.id, req.user.id]);
  ok(res, rows[0]);
});

// PATCH /enquiries/:id/status
exports.changeStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const cur = await query('SELECT status FROM enquiries WHERE id=$1', [req.params.id]);
  if (!cur.rowCount) throw ApiError.notFound('Enquiry not found');
  const { rows } = await query('UPDATE enquiries SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
  await query(`INSERT INTO enquiry_history(enquiry_id,event_type,from_value,to_value,actor_id)
     VALUES($1,'status_changed',$2,$3,$4)`, [req.params.id, cur.rows[0].status, status, req.user.id]);
  // Stop the auto follow-up chain once the lead is won or closed; otherwise
  // make sure the next nudge is scheduled.
  if (CLOSED_STATUSES.includes(status)) {
    await cancelAutoFollowups(req.params.id);
  } else {
    scheduleNextAutoFollowup(req.params.id).catch((err) =>
      console.error('[auto-followup] schedule on status change failed:', err.message));
  }
  ok(res, rows[0]);
});

// PATCH /enquiries/:id/assign
exports.assign = asyncHandler(async (req, res) => {
  const { assigned_staff_id } = req.body;
  const { rows } = await query('UPDATE enquiries SET assigned_staff_id=$1 WHERE id=$2 RETURNING *',
    [assigned_staff_id, req.params.id]);
  if (!rows[0]) throw ApiError.notFound('Enquiry not found');
  await query(`INSERT INTO enquiry_history(enquiry_id,event_type,to_value,actor_id,note)
     VALUES($1,'assigned',$2,$3,'Staff assigned')`, [req.params.id, assigned_staff_id, req.user.id]);
  ok(res, rows[0]);
});
