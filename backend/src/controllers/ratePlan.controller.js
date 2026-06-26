const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const crud = require('../utils/crudFactory')({
  table: 'rate_plans',
  columns: ['name','room_type','start_date','end_date','rate','priority','is_active'],
  searchable: ['name','room_type'],
  filterable: ['room_type','is_active'],
  orderBy: 'start_date DESC',
});
exports.list = crud.list; exports.get = crud.get; exports.create = crud.create;
exports.update = crud.update; exports.remove = crud.remove;

// GET /rate-plans/resolve?room_type=&date=  -> effective nightly rate
exports.resolve = asyncHandler(async (req, res) => {
  const { room_type, date } = req.query;
  const seasonal = await query(
    `SELECT rate, name FROM rate_plans
     WHERE room_type=$1 AND is_active AND $2::date BETWEEN start_date AND end_date
     ORDER BY priority DESC LIMIT 1`, [room_type, date]);
  if (seasonal.rows[0]) return ok(res, { rate: Number(seasonal.rows[0].rate), source: seasonal.rows[0].name });
  const base = await query(`SELECT rate FROM rooms WHERE room_type=$1 ORDER BY rate LIMIT 1`, [room_type]);
  ok(res, { rate: base.rows[0] ? Number(base.rows[0].rate) : null, source: 'base' });
});
