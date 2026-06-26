/*
 Generic CRUD controller factory for straightforward resources.
 opts: { table, columns[], searchable[], filterable[], orderBy }
 All queries are parameterized (SQL-injection safe).
*/
const { query } = require('../config/db');
const ApiError = require('./ApiError');
const asyncHandler = require('./asyncHandler');
const { ok, created } = require('./respond');

module.exports = function crudFactory(opts) {
  const { table, columns, searchable = [], filterable = [], orderBy = 'created_at DESC' } = opts;

  const list = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const offset = (page - 1) * limit;
    const where = [];
    const params = [];

    if (req.query.q && searchable.length) {
      params.push(`%${req.query.q}%`);
      where.push('(' + searchable.map(c => `${c}::text ILIKE $${params.length}`).join(' OR ') + ')');
    }
    for (const f of filterable) {
      if (req.query[f] !== undefined && req.query[f] !== '') {
        params.push(req.query[f]);
        where.push(`${f} = $${params.length}`);
      }
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = await query(`SELECT count(*)::int AS n FROM ${table} ${whereSql}`, params);
    params.push(limit, offset);
    const rows = await query(
      `SELECT * FROM ${table} ${whereSql} ORDER BY ${orderBy} LIMIT $${params.length-1} OFFSET $${params.length}`,
      params);
    ok(res, rows.rows, { page, limit, total: total.rows[0].n });
  });

  const get = asyncHandler(async (req, res) => {
    const { rows } = await query(`SELECT * FROM ${table} WHERE id=$1`, [req.params.id]);
    if (!rows[0]) throw ApiError.notFound(`${table} record not found`);
    ok(res, rows[0]);
  });

  const create = asyncHandler(async (req, res) => {
    const keys = columns.filter(c => req.body[c] !== undefined);
    if (!keys.length) throw ApiError.badRequest('No valid fields supplied');
    const vals = keys.map(k => req.body[k]);
    const ph = keys.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await query(
      `INSERT INTO ${table}(${keys.join(',')}) VALUES(${ph}) RETURNING *`, vals);
    created(res, rows[0]);
  });

  const update = asyncHandler(async (req, res) => {
    const keys = columns.filter(c => req.body[c] !== undefined);
    if (!keys.length) throw ApiError.badRequest('No valid fields supplied');
    const set = keys.map((k, i) => `${k}=$${i + 1}`).join(',');
    const vals = keys.map(k => req.body[k]);
    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE ${table} SET ${set} WHERE id=$${vals.length} RETURNING *`, vals);
    if (!rows[0]) throw ApiError.notFound(`${table} record not found`);
    ok(res, rows[0]);
  });

  const remove = asyncHandler(async (req, res) => {
    const { rowCount } = await query(`DELETE FROM ${table} WHERE id=$1`, [req.params.id]);
    if (!rowCount) throw ApiError.notFound(`${table} record not found`);
    ok(res, { message: 'Deleted' });
  });

  return { list, get, create, update, remove };
};
