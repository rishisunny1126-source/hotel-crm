/* Quick Gmail check — no database needed.
   Usage:  npm run test:email your@email.com                                  */
require('dotenv').config();
const { sendEmail } = require('../src/services/messaging');

(async () => {
  const to = process.argv[2] || process.env.GMAIL_USER;
  console.log('GMAIL_USER     :', process.env.GMAIL_USER || '(not set)');
  console.log('APP_PASSWORD set:', process.env.GMAIL_APP_PASSWORD ? `yes (${process.env.GMAIL_APP_PASSWORD.length} chars)` : 'NO');
  console.log('Sending test email to:', to, '...');
  try {
    const r = await sendEmail({
      to,
      subject: 'Test email — Hotel CRM',
      body: 'If you can read this, your Gmail sending is working correctly! 🎉',
    });
    console.log('RESULT:', r);
    if (!r.delivered) console.log('>> Not delivered. Reason:', r.reason);
  } catch (e) {
    console.error('SEND FAILED:', e.message);
  }
  process.exit(0);
})();
