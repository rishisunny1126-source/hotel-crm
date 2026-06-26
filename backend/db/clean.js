/* Removes ALL data (demo + real) and leaves a single fresh admin account.
   Run:  npm run clean
   Admin login comes from ADMIN_EMAIL / ADMIN_PASSWORD in .env (sensible defaults below). */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query } = require('../src/config/db');

(async () => {
  const tables = [
    'enquiry_history','follow_ups','payments','self_checkins','room_service_requests',
    'housekeeping_tasks','feedback','complaints','bookings','rate_plans',
    'corporate_bookings','group_bookings','shift_handovers','enquiries','guests',
    'rooms','refresh_tokens',
  ];
  try {
    await query(`TRUNCATE ${tables.join(',')} RESTART IDENTITY CASCADE`);
    await query('DELETE FROM users');                       // remove demo staff accounts
    const email = process.env.ADMIN_EMAIL || 'admin@hotel.com';
    const pass  = process.env.ADMIN_PASSWORD || 'Admin@123';
    const hash  = await bcrypt.hash(pass, parseInt(process.env.BCRYPT_ROUNDS || '12', 10));
    await query(
      `INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'admin')`,
      ['Administrator', email, hash]);
    console.log('Database cleaned. All sample data removed.');
    console.log(`Single admin login -> ${email} / ${pass}  (change the password after first login)`);
  } catch (e) { console.error('Clean failed:', e.message); process.exitCode = 1; }
  finally { await pool.end(); }
})();
