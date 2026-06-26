/* Loads the real hotel room inventory: 8 floors x 6 rooms = 48 rooms.
   Floors 1-2 Economy, 3-4 Deluxe, 5-6 Suite, 7-8 Business Lounge.
   Idempotent: re-running won't duplicate (ON CONFLICT on room_number).
   Run:  npm run rooms                                                    */
require('dotenv').config();
const { pool, query } = require('../src/config/db');

// [type, capacity, rate] per floor (index 0 = floor 1)
const FLOOR_PLAN = {
  1: ['Economy', 2, 2000],         2: ['Economy', 2, 2000],
  3: ['Deluxe', 3, 4000],          4: ['Deluxe', 3, 4000],
  5: ['Suite', 4, 7000],           6: ['Suite', 4, 7000],
  7: ['Business Lounge', 2, 9000], 8: ['Business Lounge', 2, 9000],
};

(async () => {
  try {
    let count = 0;
    for (let floor = 1; floor <= 8; floor++) {
      const [type, capacity, rate] = FLOOR_PLAN[floor];
      for (let r = 1; r <= 6; r++) {
        const room_number = `${floor}0${r}`;        // 101..806
        await query(
          `INSERT INTO rooms(room_number, room_type, capacity, rate, floor)
           VALUES($1,$2,$3,$4,$5)
           ON CONFLICT (room_number)
           DO UPDATE SET room_type=EXCLUDED.room_type, capacity=EXCLUDED.capacity,
                         rate=EXCLUDED.rate, floor=EXCLUDED.floor`,
          [room_number, type, capacity, rate, floor]);
        count++;
      }
    }
    console.log(`Loaded ${count} rooms across 8 floors (Economy, Deluxe, Suite, Business Lounge).`);
  } catch (e) { console.error('Room load failed:', e.message); process.exitCode = 1; }
  finally { await pool.end(); }
})();
