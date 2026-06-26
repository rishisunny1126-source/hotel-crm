const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/respond');

// GET /public/booking/:id  -> minimal info to personalize the feedback form
exports.booking = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT b.id, b.booking_code, g.name AS guest_name, r.room_number, r.room_type
     FROM bookings b JOIN guests g ON g.id=b.guest_id JOIN rooms r ON r.id=b.room_id
     WHERE b.id=$1`, [req.params.id]);
  if (!rows[0]) throw ApiError.notFound('Booking not found');
  ok(res, rows[0]);
});

// POST /public/feedback  -> guest submits rating + comments (no login)
exports.feedback = asyncHandler(async (req, res) => {
  const { booking_id, rating, comments } = req.body;
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) throw ApiError.badRequest('rating must be 1–5');
  const bk = await query('SELECT id, guest_id FROM bookings WHERE id=$1', [booking_id]);
  if (!bk.rowCount) throw ApiError.notFound('Booking not found');
  const dup = await query('SELECT 1 FROM feedback WHERE booking_id=$1', [booking_id]);
  if (dup.rowCount) throw ApiError.conflict('Feedback already submitted for this stay');
  const { rows } = await query(
    `INSERT INTO feedback(guest_id,booking_id,rating,comments) VALUES($1,$2,$3,$4) RETURNING id`,
    [bk.rows[0].guest_id, booking_id, r, comments || null]);
  created(res, { id: rows[0].id, message: 'Thank you for your feedback!' });
});
