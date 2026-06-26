const PDFDocument = require('pdfkit');
const BRAND = '#1E40AF';
const money = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-IN');

function stream(res, filename) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  return doc;
}
function header(doc, title) {
  doc.fillColor(BRAND).fontSize(20).text('Sri Nirvana Plaza', { continued: false });
  doc.fillColor('#666').fontSize(9).text('Hotel Enquiry & Follow-Up CRM');
  doc.moveDown(0.5).fillColor('#111').fontSize(14).text(title);
  doc.moveTo(50, doc.y + 4).lineTo(545, doc.y + 4).strokeColor(BRAND).stroke();
  doc.moveDown(1);
}

// Tabular report PDF
function reportPdf(res, type, rows) {
  const doc = stream(res, `${type}-report.pdf`);
  header(doc, `${type.charAt(0).toUpperCase() + type.slice(1)} Report`);
  doc.fontSize(8).fillColor('#888').text(`Generated: ${new Date().toLocaleString('en-IN')}   |   ${rows.length} records`);
  doc.moveDown(0.8);
  if (!rows.length) { doc.fontSize(11).fillColor('#111').text('No records.'); doc.end(); return; }
  const cols = Object.keys(rows[0]);
  const colW = (545 - 50) / cols.length;
  let y = doc.y;
  doc.fontSize(8).fillColor(BRAND);
  cols.forEach((c, i) => doc.text(c.replace(/_/g, ' '), 50 + i * colW, y, { width: colW - 4 }));
  y += 16; doc.moveTo(50, y - 4).lineTo(545, y - 4).strokeColor('#ddd').stroke();
  doc.fillColor('#111');
  rows.slice(0, 40).forEach((r) => {
    const h = 14;
    if (y > 780) { doc.addPage(); y = 50; }
    cols.forEach((c, i) => doc.fontSize(7.5).text(String(r[c] ?? '-').slice(0, 22), 50 + i * colW, y, { width: colW - 4 }));
    y += h;
  });
  doc.end();
}

// GST invoice PDF
function invoicePdf(res, p) {
  const doc = stream(res, `${p.invoice_no}.pdf`);
  header(doc, `Tax Invoice — ${p.invoice_no}`);
  doc.fontSize(10).fillColor('#111');
  doc.text(`Guest: ${p.guest_name || '-'}`);
  if (p.mobile) doc.text(`Mobile: ${p.mobile}`);
  if (p.booking_code) doc.text(`Booking: ${p.booking_code}`);
  doc.text(`Date: ${new Date(p.paid_at).toLocaleString('en-IN')}`);
  doc.text(`Payment Method: ${p.method}   Status: ${p.status}`);
  doc.moveDown(1);
  const row = (label, val, bold) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(11);
    const y = doc.y; doc.text(label, 50, y); doc.text(val, 350, y, { width: 195, align: 'right' });
    doc.moveDown(0.6);
  };
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke(); doc.moveDown(0.5);
  row('Room charges (taxable value)', money(p.base_amount));
  row(`GST @ ${p.gst_rate}%`, money(p.gst_amount));
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke(); doc.moveDown(0.5);
  row('Total Payable', money(p.total_amount), true);
  doc.moveDown(2).fontSize(8).fillColor('#888')
     .text('This is a computer-generated invoice and does not require a signature.', { align: 'center' });
  doc.end();
}

module.exports = { reportPdf, invoicePdf };
