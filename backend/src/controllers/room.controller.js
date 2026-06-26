const { query } = require('../config/db');
const crud = require('../utils/crudFactory')({
  table: 'rooms',
  columns: ['room_number','room_type','capacity','rate','status','hk_status','floor'],
  searchable: ['room_number','room_type'],
  filterable: ['status','room_type','hk_status','floor'],
  orderBy: 'room_number ASC',
});
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');

exports.list = crud.list;
exports.get = crud.get;
exports.create = crud.create;
exports.update = crud.update;
exports.remove = crud.remove;

exports.changeStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { rows } = await query('UPDATE rooms SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
  if (!rows[0]) throw ApiError.notFound('Room not found');
  ok(res, rows[0]);
});

// GET /rooms/availability?check_in=&check_out=
exports.availability = asyncHandler(async (req, res) => {
  const { check_in, check_out, room_type } = req.query;
  if (!check_in || !check_out) throw ApiError.badRequest('check_in and check_out required');
  const params = [check_in, check_out];
  let typeSql = '';
  if (room_type) { params.push(room_type); typeSql = `AND r.room_type=$3`; }
  const { rows } = await query(
    `SELECT r.* FROM rooms r
     WHERE r.status <> 'maintenance' ${typeSql}
       AND NOT EXISTS (
         SELECT 1 FROM bookings b
         WHERE b.room_id=r.id AND b.status IN ('reserved','checked_in')
           AND tstzrange(b.check_in_date,b.check_out_date,'[)')
               && tstzrange($1::timestamptz,$2::timestamptz,'[)'))
     ORDER BY r.room_number`, params);
  ok(res, rows.rows);
});

// GET /rooms/board  -> live status of every room (auto-frees after checkout TIME passes)
exports.board = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT r.id, r.room_number, r.room_type, r.floor, r.rate, r.status AS stored_status,
            b.check_in_date  AS busy_from,
            b.check_out_date AS busy_until,
            b.status         AS booking_status,
            g.name           AS guest_name
     FROM rooms r
     LEFT JOIN LATERAL (
       SELECT * FROM bookings
       WHERE room_id = r.id
         AND status IN ('reserved','checked_in')
         AND check_out_date > now()           -- only bookings whose checkout is still in the future
       ORDER BY check_in_date LIMIT 1
     ) b ON true
     LEFT JOIN guests g ON g.id = b.guest_id
     ORDER BY r.floor, r.room_number`);
  const now = Date.now();
  const board = rows.map(r => {
    let live = 'available', free_at = null;
    if (r.busy_until) {
      const from = new Date(r.busy_from).getTime();
      live = from <= now ? 'occupied' : 'reserved';
      free_at = r.busy_until;            // becomes available automatically after this time
    } else if (['cleaning','maintenance'].includes(r.stored_status)) {
      live = r.stored_status;
    }
    return { ...r, live_status: live, free_at };
  });
  ok(res, board);
});
