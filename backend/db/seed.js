/* Seed demo data: users (all roles), rooms, guests, enquiries, bookings, etc. */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const pw = await bcrypt.hash('Password@123', rounds);

    const users = [
      ['Asha Admin', 'admin@hotel.com', 'admin'],
      ['Manish Manager', 'manager@hotel.com', 'manager'],
      ['Front Desk', 'frontdesk@hotel.com', 'front_desk'],
      ['Hema House', 'housekeeping@hotel.com', 'housekeeping'],
      ['Anil Accounts', 'accounts@hotel.com', 'accounts'],
      ['Carol Corp', 'corporate@hotel.com', 'corporate_coordinator'],
    ];
    for (const [name, email, role] of users) {
      await c.query(
        `INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4)
         ON CONFLICT (email) DO NOTHING`, [name, email, pw, role]);
    }

    // Rooms: 3 floors x types
    const types = [['Standard',2,2500],['Deluxe',3,4000],['Suite',4,7000]];
    for (let floor = 1; floor <= 3; floor++) {
      for (let i = 1; i <= 4; i++) {
        const [type, cap, rate] = types[(i - 1) % types.length];
        const num = `${floor}0${i}`;
        await c.query(
          `INSERT INTO rooms(room_number,room_type,capacity,rate,floor)
           VALUES($1,$2,$3,$4,$5) ON CONFLICT (room_number) DO NOTHING`,
          [num, type, cap, rate, floor]);
      }
    }

    // Guests
    const guests = [
      ['Ravi Kumar','9876500001','ravi@x.com','Pune','Deluxe'],
      ['Sneha Rao','9876500002','sneha@x.com','Mumbai','Suite'],
      ['John Doe','9876500003','john@x.com','Delhi','Standard'],
    ];
    for (const [name, mobile, email, city, pref] of guests) {
      await c.query(
        `INSERT INTO guests(name,mobile,email,city,preferred_room_type,total_stays,lifetime_value)
         VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (mobile) DO NOTHING`,
        [name, mobile, email, city, pref, Math.floor(Math.random()*5), Math.floor(Math.random()*50000)]);
    }

    // Enquiries
    const staff = await c.query(`SELECT id FROM users WHERE role='front_desk' LIMIT 1`);
    const sid = staff.rows[0]?.id;
    const sources = ['call','whatsapp','walk_in','website','ota'];
    const statuses = ['new','contacted','interested','follow_up_pending','confirmed','lost'];
    for (let i = 0; i < 12; i++) {
      await c.query(
        `INSERT INTO enquiries(ref_code,guest_name,mobile,email,city,source,room_type,
           guests_count,check_in_date,check_out_date,budget,status,assigned_staff_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8, CURRENT_DATE + ($9||' days')::interval,
           CURRENT_DATE + ($10||' days')::interval,$11,$12,$13)`,
        [`ENQ-${1000+i}`, `Guest ${i+1}`, `98765${10000+i}`, `g${i}@x.com`, 'Pune',
         sources[i%sources.length], types[i%3][0], 1+(i%3),
         i%10, (i%10)+2, 2000+(i*250), statuses[i%statuses.length], sid]);
    }


    // Seasonal rate plans (idempotent: only if none exist)
    const rpCount = await c.query('SELECT count(*)::int n FROM rate_plans');
    if (rpCount.rows[0].n === 0) {
      const plans = [
        ['Diwali Peak','Suite', '2026-11-01','2026-11-15', 9500, 3],
        ['Diwali Peak','Deluxe','2026-11-01','2026-11-15', 5500, 3],
        ['Monsoon Offer','Standard','2026-07-01','2026-08-31', 1900, 2],
        ['Year End','Suite','2026-12-24','2027-01-02', 11000, 3],
      ];
      for (const [name,type,sd,ed,rate,pr] of plans) {
        await c.query(`INSERT INTO rate_plans(name,room_type,start_date,end_date,rate,priority)
           VALUES($1,$2,$3,$4,$5,$6)`, [name,type,sd,ed,rate,pr]);
      }
    }

    await c.query('COMMIT');
    console.log('Seed complete. Login: admin@hotel.com / Password@123 (all roles use same password)');
  } catch (e) {
    await c.query('ROLLBACK'); console.error('Seed failed:', e.message); process.exit(1);
  } finally { c.release(); await pool.end(); }
}
seed();
