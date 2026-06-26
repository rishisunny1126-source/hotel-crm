const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const { reportPdf } = require('../services/pdf');

const toCsv = (rows) => {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
};

const REPORTS = {
  enquiry:   `SELECT ref_code,guest_name,mobile,source,status,room_type,budget,created_at FROM enquiries ORDER BY created_at DESC`,
  booking:   `SELECT b.booking_code,g.name guest,r.room_number,b.check_in_date,b.check_out_date,b.amount,b.status
              FROM bookings b JOIN guests g ON g.id=b.guest_id JOIN rooms r ON r.id=b.room_id ORDER BY b.created_at DESC`,
  occupancy: `SELECT room_number,room_type,status,hk_status,rate FROM rooms ORDER BY room_number`,
  revenue:   `SELECT to_char(date_trunc('month',created_at),'YYYY-MM') month, sum(amount)::float revenue, count(*)::int bookings
              FROM bookings GROUP BY 1 ORDER BY 1`,
  followup:  `SELECT f.scheduled_date,f.status,f.priority,e.guest_name,e.mobile
              FROM follow_ups f JOIN enquiries e ON e.id=f.enquiry_id ORDER BY f.scheduled_date DESC`,
  complaint: `SELECT title,priority,status,created_at,resolved_at FROM complaints ORDER BY created_at DESC`,
};

exports.generate = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const sql = REPORTS[type];
  if (!sql) return res.status(404).json({ success: false, error: { message: 'Unknown report type' } });
  const rows = (await query(sql)).rows;
  if (req.query.format === 'pdf') return reportPdf(res, type, rows);
  if (req.query.format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    return res.send(toCsv(rows));
  }
  ok(res, rows);
});
