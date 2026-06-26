const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../config/db');
const { bcryptRounds } = require('../config/env');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/token');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/respond');

const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

// POST /auth/register  (admin-only at route level)
exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  const exists = await query('SELECT 1 FROM users WHERE email=$1', [email]);
  if (exists.rowCount) throw ApiError.conflict('Email already registered');
  const hash = await bcrypt.hash(password, bcryptRounds);
  const { rows } = await query(
    `INSERT INTO users(name,email,phone,password_hash,role)
     VALUES($1,$2,$3,$4,$5) RETURNING id,name,email,role,is_active,created_at`,
    [name, email, phone, hash, role]);
  created(res, rows[0]);
});

// POST /auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await query('SELECT * FROM users WHERE email=$1', [email]);
  const user = rows[0];
  if (!user || !user.is_active) throw ApiError.unauthorized('Invalid credentials');
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw ApiError.unauthorized('Invalid credentials');

  const payload = { sub: user.id, role: user.role, name: user.name };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh({ sub: user.id });
  await query(
    `INSERT INTO refresh_tokens(user_id,token_hash,expires_at)
     VALUES($1,$2, now() + interval '7 days')`, [user.id, sha(refreshToken)]);
  await query('UPDATE users SET last_login_at=now() WHERE id=$1', [user.id]);

  ok(res, {
    accessToken, refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// POST /auth/refresh
exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw ApiError.badRequest('refreshToken required');
  let decoded;
  try { decoded = verifyRefresh(refreshToken); }
  catch { throw ApiError.unauthorized('Invalid refresh token'); }
  const stored = await query(
    'SELECT * FROM refresh_tokens WHERE user_id=$1 AND token_hash=$2 AND expires_at>now()',
    [decoded.sub, sha(refreshToken)]);
  if (!stored.rowCount) throw ApiError.unauthorized('Refresh token revoked/expired');
  const u = await query('SELECT id,name,role FROM users WHERE id=$1', [decoded.sub]);
  const user = u.rows[0];
  ok(res, { accessToken: signAccess({ sub: user.id, role: user.role, name: user.name }) });
});

// POST /auth/logout
exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await query('DELETE FROM refresh_tokens WHERE token_hash=$1', [sha(refreshToken)]);
  ok(res, { message: 'Logged out' });
});

// GET /auth/me
exports.me = asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT id,name,email,phone,role,is_active,last_login_at FROM users WHERE id=$1', [req.user.id]);
  if (!rows[0]) throw ApiError.notFound('User not found');
  ok(res, rows[0]);
});
