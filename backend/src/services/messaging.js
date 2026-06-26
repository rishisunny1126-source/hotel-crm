/*
 Email messaging — Gmail only (free), via nodemailer.
 Builders return { to, subject, body (plain text), html }. sendEmail delivers both parts.
 Needs GMAIL_USER + GMAIL_APP_PASSWORD (a Google "App Password"). If unset, it logs instead of crashing.
*/
const nodemailer = require('nodemailer');
const HOTEL = 'Sri Nirvana Plaza';
const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const dt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

let transporter = null;
function getTransport() {
  if (transporter) return transporter;
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  return transporter;
}

// ---- shared HTML shell ----
function shell(title, inner) {
  return `<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:24px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e9f2">
        <tr><td style="background:#1E2761;padding:22px 28px">
          <div style="color:#fff;font-size:20px;font-weight:bold">${HOTEL}</div>
          <div style="color:#cadcfc;font-size:12px">Hotel Enquiry &amp; Follow-Up CRM</div>
        </td></tr>
        <tr><td style="padding:26px 28px">
          <h2 style="margin:0 0 14px;font-size:18px;color:#1E2761">${title}</h2>
          ${inner}
        </td></tr>
        <tr><td style="padding:16px 28px;background:#f7f9fd;color:#7a86a8;font-size:11px;border-top:1px solid #eef2fb">
          ${HOTEL} · This is an automated message. Reply to this email for any changes to your booking.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}
function row(label, value) {
  return `<tr><td style="padding:7px 0;color:#6b7280;font-size:13px;width:42%">${label}</td>
          <td style="padding:7px 0;color:#111827;font-size:13px;font-weight:bold">${value}</td></tr>`;
}

// ---- 1. Booking confirmation ----
function buildBookingEmail(b) {
  const first = (b.guest_name || 'Guest').split(' ')[0];
  const inner = `
    <p style="font-size:14px;line-height:1.5;margin:0 0 16px">
      Hi ${first}, your booking is <b style="color:#1E9E6A">confirmed</b>. We look forward to welcoming you to ${HOTEL}.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eef2fb;border-radius:8px;padding:6px 14px">
      ${row('Booking Reference', b.booking_code)}
      ${row('Room', `${b.room_number} · ${b.room_type}`)}
      ${row('Check-in', dt(b.check_in_date))}
      ${row('Check-out', dt(b.check_out_date))}
      ${row('Amount (incl. taxes)', money(b.amount))}
    </table>
    <p style="font-size:13px;color:#6b7280;margin:18px 0 0">
      Standard check-in is from the time shown above. Carry a valid photo ID. Need anything special? Just reply to this email.
    </p>`;
  const text = `Hi ${first}, your booking at ${HOTEL} is confirmed.\n`
    + `Ref: ${b.booking_code}\nRoom: ${b.room_number} (${b.room_type})\n`
    + `Check-in: ${dt(b.check_in_date)}\nCheck-out: ${dt(b.check_out_date)}\nAmount: ${money(b.amount)}`;
  return { to: b.email || null, subject: `Booking confirmed — ${b.booking_code} · ${HOTEL}`, body: text, html: shell('Your booking is confirmed', inner) };
}

// ---- 2. Check-out thank-you + feedback ----
function buildCheckoutEmail(b, feedbackUrl) {
  const first = (b.guest_name || 'Guest').split(' ')[0];
  const inner = `
    <p style="font-size:14px;line-height:1.5;margin:0 0 16px">
      Hi ${first}, thank you for staying with ${HOTEL} (Room ${b.room_number}). We hope you had a wonderful time!
    </p>
    <p style="font-size:14px;line-height:1.5;margin:0 0 18px">
      Your feedback helps us serve you better. It takes less than a minute:
    </p>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#1E2761;border-radius:8px">
      <a href="${feedbackUrl}" style="display:inline-block;padding:12px 26px;color:#fff;font-size:14px;font-weight:bold;text-decoration:none">★ Share your feedback</a>
    </td></tr></table>
    <p style="font-size:12px;color:#9aa3b5;margin:16px 0 0">Or paste this link in your browser:<br>${feedbackUrl}</p>`;
  const text = `Hi ${first}, thank you for staying with ${HOTEL}.\nWe'd love your feedback: ${feedbackUrl}`;
  return { to: b.email || null, subject: `Thank you for staying with ${HOTEL} — share your feedback`, body: text, html: shell('Thank you for your stay', inner) };
}

// ---- 3. Follow-up (rule-based) ----
function generateFollowUpMessage(enquiry) {
  const name = (enquiry.guest_name || 'Guest').split(' ')[0];
  const room = enquiry.room_type ? `${enquiry.room_type} room` : 'room';
  const dates = (enquiry.check_in_date && enquiry.check_out_date) ? ` for ${dt(enquiry.check_in_date)}–${dt(enquiry.check_out_date)}` : '';
  const budget = enquiry.budget ? ` within your budget of ${money(enquiry.budget)}` : '';
  const byStatus = {
    new: `Hi ${name}, thank you for your enquiry with ${HOTEL}. We'd love to host you in a ${room}${dates}. May I share our best available options${budget}?`,
    contacted: `Hi ${name}, following up on your ${room} enquiry${dates}. We have availability and can hold a room for you${budget}. Shall I proceed?`,
    interested: `Hi ${name}, great to know you're interested! I can confirm your ${room}${dates}${budget} today. Would you like me to block it?`,
    follow_up_pending: `Hi ${name}, a gentle reminder about your ${room}${dates}. Rooms are filling up — would you like to confirm${budget}?`,
    confirmed: `Hi ${name}, your booking with ${HOTEL} is confirmed${dates}. We look forward to welcoming you!`,
  };
  const body = byStatus[enquiry.status] || byStatus.new;
  return { to: enquiry.email || null, subject: `${HOTEL} — your room enquiry`, body };
}

// ---- transport ----
async function sendEmail({ to, subject, body, html }) {
  if (!to) return { delivered: false, reason: 'no email address on record' };
  const t = getTransport();
  if (!t) { console.log(`[email-not-configured] would email ${to}: ${subject}`); return { delivered: false, reason: 'GMAIL not set', to }; }
  await t.sendMail({ from: `${HOTEL} <${process.env.GMAIL_USER}>`, to, subject, text: body, ...(html ? { html } : {}) });
  return { delivered: true, channel: 'email', to, at: new Date().toISOString() };
}

module.exports = { generateFollowUpMessage, buildBookingEmail, buildCheckoutEmail, sendEmail };
