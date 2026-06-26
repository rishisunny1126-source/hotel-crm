const { pool, query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/respond');
const { quoteStay } = require('../services/pricing');
const { buildBookingEmail, buildCheckoutEmail, sendEmail } = require('../services/messaging');
const { cancelAutoFollowups } = require('../services/autoFollowup');
const { clientUrl } = require('../config/env');

function resolveWindow({ check_in, check_out, duration_hours }, fallbackCheckIn, fallbackCheckOut) {
  const ci = check_in ? new Date(check_in) : (fallbackCheckIn ? new Date(fallbackCheckIn) : new Date());
  let co;
  if (duration_hours) co = new Date(ci.getTime() + Number(duration_hours) * 3600 * 1000);
  else if (check_out) co = new Date(check_out);
  else if (fallbackCheckOut) co = new Date(fallbackCheckOut);
  else co = new Date(ci.getTime() + 24 * 3600 * 1000);
  return { ci: ci.toISOString(), co: co.toISOString() };
}

// Fetch full booking + guest email + room details, then email confirmation (best-effort).
async function emailConfirmation(bookingId) {
  try {
    const { rows } = await query(
      `SELECT b.booking_code, b.check_in_date, b.check_out_date, b.amount,
              g.name AS guest_name, g.email, r.room_number, r.room_type
       FROM bookings b JOIN guests g ON g.id=b.guest_id JOIN rooms r ON r.id=b.room_id
       WHERE b.id=$1`, [bookingId]);
    if (rows[0]) await sendEmail(buildBookingEmail(rows[0]));
  } catch (e) { console.error('[email] booking confirmation failed:', e.message); }
}

exports.list = asyncHandler(async (req, res) => {
  const where = [], params = [];
  for (const f of ['status','room_id','guest_id']) {
    if (req.query[f]) { params.push(req.query[f]); where.push(`b.${f}=$${params.length}`); }
  }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await query(
    `SELECT b.*, g.name AS guest_name, r.room_number, r.room_type
     FROM bookings b JOIN guests g ON g.id=b.guest_id JOIN rooms r ON r.id=b.room_id
     ${w} ORDER BY b.created_at DESC`, params);
  ok(res, rows.rows);
});

exports.get = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT b.*, g.name guest_name, g.mobile, r.room_number, r.room_type
     FROM bookings b JOIN guests g ON g.id=b.guest_id JOIN rooms r ON r.id=b.room_id
     WHERE b.id=$1`, [req.params.id]);
  if (!rows[0]) throw ApiError.notFound('Booking not found');
  ok(res, rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { guest_id, room_id, amount } = req.body;
  const { ci, co } = resolveWindow(req.body);
  const code = 'BKG-' + Date.now().toString().slice(-7);
  const seasonal = await quoteStay(null, room_id, ci, co);
  const { rows } = await query(
    `INSERT INTO bookings(booking_code,guest_id,room_id,check_in_date,check_out_date,amount,created_by)
     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [code, guest_id, room_id, ci, co, amount || seasonal || 0, req.user.id]);
  await query(`UPDATE rooms SET status='reserved' WHERE id=$1`, [room_id]);
  emailConfirmation(rows[0].id);                       // fire-and-forget confirmation email
  created(res, rows[0]);
});

exports.fromEnquiry = asyncHandler(async (req, res) => {
  const { room_id, amount } = req.body;
  const client = await pool.connect();
  let newId = null;
  try {
    await client.query('BEGIN');
    const e = await client.query('SELECT * FROM enquiries WHERE id=$1', [req.params.enquiryId]);
    if (!e.rowCount) throw ApiError.notFound('Enquiry not found');
    const enq = e.rows[0];
    const { ci, co } = resolveWindow(req.body, enq.check_in_date, enq.check_out_date);
    let g = await client.query('SELECT id FROM guests WHERE mobile=$1', [enq.mobile]);
    let guestId = g.rows[0]?.id;
    if (!guestId) {
      const ins = await client.query(
        `INSERT INTO guests(name,mobile,email,city,preferred_room_type)
         VALUES($1,$2,$3,$4,$5) RETURNING id`,
        [enq.guest_name, enq.mobile, enq.email, enq.city, enq.room_type]);
      guestId = ins.rows[0].id;
    }
    const seasonalAmount = await quoteStay(client, room_id, ci, co);
    const code = 'BKG-' + Date.now().toString().slice(-7);
    const b = await client.query(
      `INSERT INTO bookings(booking_code,enquiry_id,guest_id,room_id,check_in_date,check_out_date,amount,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [code, enq.id, guestId, room_id, ci, co, amount || seasonalAmount || enq.budget || 0, req.user.id]);
    newId = b.rows[0].id;
    await client.query(`UPDATE rooms SET status='reserved' WHERE id=$1`, [room_id]);
    await client.query(`UPDATE enquiries SET status='confirmed', guest_id=$2 WHERE id=$1`, [enq.id, guestId]);
    await client.query(`INSERT INTO enquiry_history(enquiry_id,event_type,to_value,actor_id,note)
       VALUES($1,'booking_confirmed',$2,$3,'Converted to booking')`, [enq.id, code, req.user.id]);
    await client.query('COMMIT');
    cancelAutoFollowups(enq.id).catch((err) =>          // lead won — stop auto nudges
      console.error('[auto-followup] cancel on booking failed:', err.message));
    emailConfirmation(newId);                          // confirmation email after commit
    created(res, b.rows[0]);
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
});

exports.checkIn = asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const b = await client.query(
      `UPDATE bookings SET status='checked_in', checked_in_at=now()
       WHERE id=$1 AND status='reserved' RETURNING *`, [req.params.id]);
    if (!b.rowCount) throw ApiError.badRequest('Booking not in reserved state');
    await client.query(`UPDATE rooms SET status='occupied', hk_status='occupied' WHERE id=$1`, [b.rows[0].room_id]);
    await client.query('COMMIT');
    ok(res, b.rows[0]);
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
});

exports.checkOut = asyncHandler(async (req, res) => {
  const client = await pool.connect();
  let booking = null;
  try {
    await client.query('BEGIN');
    const b = await client.query(
      `UPDATE bookings SET status='checked_out', checked_out_at=now()
       WHERE id=$1 AND status='checked_in' RETURNING *`, [req.params.id]);
    if (!b.rowCount) throw ApiError.badRequest('Booking not in checked_in state');
    booking = b.rows[0];
    await client.query(`UPDATE rooms SET status='cleaning', hk_status='dirty' WHERE id=$1`, [booking.room_id]);
    await client.query(`INSERT INTO housekeeping_tasks(room_id,status) VALUES($1,'dirty')`, [booking.room_id]);
    await client.query(
      `UPDATE guests SET total_stays=total_stays+1, lifetime_value=lifetime_value+$2 WHERE id=$1`,
      [booking.guest_id, booking.amount]);
    await client.query('COMMIT');
    // thank-you + feedback email (best-effort)
    try {
      const info = await query(
        `SELECT g.name AS guest_name, g.email, r.room_number
         FROM bookings b JOIN guests g ON g.id=b.guest_id JOIN rooms r ON r.id=b.room_id
         WHERE b.id=$1`, [booking.id]);
      if (info.rows[0]) {
        const url = `${clientUrl}/feedback/${booking.id}`;
        await sendEmail(buildCheckoutEmail(info.rows[0], url));
      }
    } catch (e) { console.error('[email] checkout email failed:', e.message); }
    ok(res, booking);
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
});
