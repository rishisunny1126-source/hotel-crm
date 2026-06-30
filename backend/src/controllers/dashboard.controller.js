const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');

exports.summary = asyncHandler(async (_req, res) => {
  const q = async (sql, p = []) => (await query(sql, p)).rows[0].n;
  const cards = {
    totalEnquiries:      await q(`SELECT count(*)::int n FROM enquiries`),
    newEnquiries:        await q(`SELECT count(*)::int n FROM enquiries WHERE status='new'`),
    pendingFollowUps:    await q(`SELECT count(*)::int n FROM follow_ups WHERE status='pending'`),
    confirmedBookings:   await q(`SELECT count(*)::int n FROM enquiries WHERE status='confirmed'`),
    lostLeads:           await q(`SELECT count(*)::int n FROM enquiries WHERE status IN ('lost','cancelled')`),
    occupiedRooms:       await q(`SELECT count(*)::int n FROM rooms WHERE status='occupied'`),
    availableRooms:      await q(`SELECT count(*)::int n FROM rooms WHERE status='available'`),
    housekeepingPending: await q(`SELECT count(*)::int n FROM housekeeping_tasks WHERE status IN ('dirty','cleaning')`),
    openComplaints:      await q(`SELECT count(*)::int n FROM complaints WHERE status IN ('open','in_progress')`),
    corporateBookings:   await q(`SELECT count(*)::int n FROM corporate_bookings`),
  };
  ok(res, cards);
});

exports.charts = asyncHandler(async (_req, res) => {
  const bySource = (await query(
    `SELECT source, count(*)::int n FROM enquiries GROUP BY source ORDER BY n DESC`)).rows;
  const totalEnq = (await query(`SELECT count(*)::int n FROM enquiries`)).rows[0].n || 1;
  const confirmed = (await query(`SELECT count(*)::int n FROM enquiries WHERE status='confirmed'`)).rows[0].n;
  const revenueTrend = (await query(
    `SELECT to_char(date_trunc('month',created_at),'Mon') AS month,
            coalesce(sum(amount),0)::float AS total
     FROM bookings GROUP BY date_trunc('month',created_at) ORDER BY date_trunc('month',created_at)`)).rows;
  const occupancy = (await query(
    `SELECT status, count(*)::int n FROM rooms GROUP BY status`)).rows;
  ok(res, {
    enquiriesBySource: bySource,
    conversionRate: Math.round((confirmed / totalEnq) * 100),
    revenueTrend,
    occupancy,
  });
});

exports.activity = asyncHandler(async (_req, res) => {
  const rows = (await query(
    `SELECT h.event_type, h.to_value, h.created_at, e.guest_name, u.name AS actor
     FROM enquiry_history h
     JOIN enquiries e ON e.id = h.enquiry_id
     LEFT JOIN users u ON u.id = h.actor_id
     ORDER BY h.created_at DESC LIMIT 20`)).rows;
  ok(res, rows);
});
