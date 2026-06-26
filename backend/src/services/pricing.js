const { query } = require('../config/db');

// Effective nightly rate for a room_type on a given date (seasonal plan wins, else base room rate)
async function nightlyRate(client, roomType, date) {
  const q = client ? client.query.bind(client) : query;
  const plan = await q(
    `SELECT rate FROM rate_plans
     WHERE room_type=$1 AND is_active AND $2::date BETWEEN start_date AND end_date
     ORDER BY priority DESC LIMIT 1`, [roomType, date]);
  if (plan.rows[0]) return Number(plan.rows[0].rate);
  const base = await q(`SELECT rate FROM rooms WHERE room_type=$1 ORDER BY rate LIMIT 1`, [roomType]);
  return base.rows[0] ? Number(base.rows[0].rate) : 0;
}

// Total stay amount = sum of each night's effective rate
async function quoteStay(client, roomId, checkIn, checkOut) {
  const q = client ? client.query.bind(client) : query;
  const r = await q(`SELECT room_type, rate FROM rooms WHERE id=$1`, [roomId]);
  if (!r.rows[0]) return 0;
  const type = r.rows[0].room_type;
  const start = new Date(checkIn), end = new Date(checkOut);
  let total = 0;
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    total += await nightlyRate(client, type, d.toISOString().slice(0, 10));
  }
  return +total.toFixed(2);
}

module.exports = { nightlyRate, quoteStay };
