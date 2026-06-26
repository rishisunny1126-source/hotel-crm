const { query } = require('../config/db');
const { generateFollowUpMessage, sendEmail } = require('./messaging');

// Emails a personalized follow-up for every pending follow-up due today or overdue.
async function dispatchDueReminders() {
  const due = await query(
    `SELECT f.id, e.guest_name, e.mobile, e.email, e.room_type, e.budget,
            e.check_in_date, e.check_out_date, e.status
     FROM follow_ups f JOIN enquiries e ON e.id = f.enquiry_id
     WHERE f.status = 'pending' AND f.scheduled_date <= CURRENT_DATE`);
  const results = [];
  for (const enq of due.rows) {
    const r = await sendEmail(generateFollowUpMessage(enq));
    results.push({ guest: enq.guest_name, ...r });
  }
  return { reminded: results.length, results };
}
module.exports = { dispatchDueReminders };
