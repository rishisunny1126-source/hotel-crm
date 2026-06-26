const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/respond');
const { invoicePdf } = require('../services/pdf');

// POST /payments  -> records a payment and computes GST
exports.create = asyncHandler(async (req, res) => {
  const { booking_id, guest_id, base_amount, gst_rate = 12, method = 'cash', status = 'paid' } = req.body;
  if (base_amount === undefined || isNaN(Number(base_amount)))
    throw ApiError.badRequest('base_amount is required and must be a number');
  const base = Number(base_amount);
  const rate = Number(gst_rate);
  const gst = +(base * rate / 100).toFixed(2);
  const total = +(base + gst).toFixed(2);
  const invoice = 'INV-' + Date.now().toString().slice(-8);
  const { rows } = await query(
    `INSERT INTO payments(invoice_no,booking_id,guest_id,base_amount,gst_rate,gst_amount,total_amount,method,status,created_by)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [invoice, booking_id || null, guest_id || null, base, rate, gst, total, method, status, req.user.id]);
  created(res, rows[0]);
});

exports.list = asyncHandler(async (req, res) => {
  const where = [], params = [];
  for (const f of ['status','method','booking_id']) {
    if (req.query[f]) { params.push(req.query[f]); where.push(`p.${f}=$${params.length}`); }
  }
  if (req.query.date) { params.push(req.query.date); where.push(`p.paid_at::date = $${params.length}`); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await query(
    `SELECT p.*, g.name AS guest_name, b.booking_code
     FROM payments p LEFT JOIN guests g ON g.id=p.guest_id LEFT JOIN bookings b ON b.id=p.booking_id
     ${w} ORDER BY p.paid_at DESC`, params);
  ok(res, rows.rows);
});

exports.get = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.*, g.name AS guest_name, g.mobile, b.booking_code
     FROM payments p LEFT JOIN guests g ON g.id=p.guest_id LEFT JOIN bookings b ON b.id=p.booking_id
     WHERE p.id=$1`, [req.params.id]);
  if (!rows[0]) throw ApiError.notFound('Payment not found');
  ok(res, rows[0]);
});

// GET /payments/settlement?date=YYYY-MM-DD  -> daily revenue + GST settlement
exports.settlement = asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const summary = await query(
    `SELECT count(*)::int AS transactions,
            coalesce(sum(base_amount),0)::float AS base_total,
            coalesce(sum(gst_amount),0)::float  AS gst_total,
            coalesce(sum(total_amount),0)::float AS grand_total
     FROM payments WHERE paid_at::date = $1 AND status IN ('paid','partial')`, [date]);
  const byMethod = await query(
    `SELECT method, count(*)::int n, coalesce(sum(total_amount),0)::float amount
     FROM payments WHERE paid_at::date=$1 AND status IN ('paid','partial')
     GROUP BY method ORDER BY amount DESC`, [date]);
  const byGst = await query(
    `SELECT gst_rate, coalesce(sum(base_amount),0)::float taxable, coalesce(sum(gst_amount),0)::float gst
     FROM payments WHERE paid_at::date=$1 AND status IN ('paid','partial')
     GROUP BY gst_rate ORDER BY gst_rate`, [date]);
  ok(res, { date, ...summary.rows[0], byMethod: byMethod.rows, gstBreakup: byGst.rows });
});


// GET /payments/:id/invoice  -> GST invoice PDF
exports.invoice = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.*, g.name AS guest_name, g.mobile, b.booking_code
     FROM payments p LEFT JOIN guests g ON g.id=p.guest_id LEFT JOIN bookings b ON b.id=p.booking_id
     WHERE p.id=$1`, [req.params.id]);
  if (!rows[0]) throw ApiError.notFound('Payment not found');
  invoicePdf(res, rows[0]);
});
