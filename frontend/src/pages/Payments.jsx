import { useEffect, useState } from 'react';
import api from '../api/client';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import { money, date, statusColor } from '../utils/format';

export default function Payments() {
  const [rows, setRows] = useState([]);
  const [settle, setSettle] = useState(null);
  const [day, setDay] = useState(new Date().toISOString().slice(0,10));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ gst_rate: 12, method: 'cash' });
  const [bookings, setBookings] = useState([]);
  const [err, setErr] = useState('');

  const load = async () => {
    const { data } = await api.get('/payments');
    setRows(data.data);
  };
  const loadSettlement = async (d) => {
    const { data } = await api.get('/payments/settlement', { params: { date: d } });
    setSettle(data.data);
  };
  useEffect(() => { load(); api.get('/bookings').then(r=>setBookings(r.data.data)).catch(()=>{}); }, []);
  useEffect(() => { loadSettlement(day); }, [day]);

  const save = async (e) => {
    e.preventDefault(); setErr('');
    try {
      const b = bookings.find(x => x.id === form.booking_id);
      await api.post('/payments', { ...form, base_amount: Number(form.base_amount),
        gst_rate: Number(form.gst_rate), guest_id: b?.guest_id });
      setOpen(false); setForm({ gst_rate: 12, method: 'cash' }); load(); loadSettlement(day);
    } catch (e2) { setErr(e2.response?.data?.error?.message || 'Failed'); }
  };

  const invoice = (id) => {
    const token = localStorage.getItem('accessToken');
    fetch(`${import.meta.env.VITE_API_URL || '/api'}/payments/${id}/invoice`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(b => {
        const url = URL.createObjectURL(b); const a = document.createElement('a');
        a.href = url; a.download = 'invoice.pdf'; a.click(); URL.revokeObjectURL(url);
      });
  };

  const preview = form.base_amount
    ? { gst: (form.base_amount * form.gst_rate / 100), total: (Number(form.base_amount) * (1 + form.gst_rate/100)) }
    : null;

  return (
    <div>
      <PageHeader title="Payments & GST" subtitle="Daily revenue settlement and invoicing"
        action={<button className="btn-primary" onClick={()=>setOpen(true)}>+ Record Payment</button>} />

      {/* Settlement summary */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Daily Settlement</h3>
          <input type="date" className="input max-w-[180px]" value={day} onChange={e=>setDay(e.target.value)} />
        </div>
        {settle && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Transactions" value={settle.transactions} />
            <Stat label="Taxable Value" value={money(settle.base_total)} />
            <Stat label="GST Collected" value={money(settle.gst_total)} />
            <Stat label="Grand Total" value={money(settle.grand_total)} highlight />
          </div>
        )}
        {settle?.gstBreakup?.length > 0 && (
          <div className="mt-3 text-xs text-slate-500">
            GST breakup: {settle.gstBreakup.map(g => `${g.gst_rate}% → ${money(g.gst)}`).join('  ·  ')}
          </div>
        )}
      </div>

      {/* Payments table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-slate-50"><tr>
            {['Invoice','Guest','Booking','Base','GST','Total','Method','Status','Date',''].map(h=><th key={h} className="th">{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="td font-mono text-xs">{p.invoice_no}</td>
                <td className="td">{p.guest_name || '—'}</td>
                <td className="td text-xs">{p.booking_code || '—'}</td>
                <td className="td">{money(p.base_amount)}</td>
                <td className="td text-xs">{p.gst_rate}% · {money(p.gst_amount)}</td>
                <td className="td font-medium">{money(p.total_amount)}</td>
                <td className="td capitalize">{p.method}</td>
                <td className="td"><span className={`badge ${statusColor(p.status)}`}>{p.status}</span></td>
                <td className="td text-xs">{date(p.paid_at)}</td>
                <td className="td"><button className="text-brand-600 hover:underline text-xs" onClick={()=>invoice(p.id)}>Invoice PDF</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-slate-400" colSpan="10">No payments yet</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={open} title="Record Payment" onClose={()=>setOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          {err && <div className="text-sm text-red-600 bg-red-50 rounded p-2">{err}</div>}
          <div><label className="label">Booking (optional)</label>
            <select className="input" value={form.booking_id||''} onChange={e=>setForm(s=>({...s,booking_id:e.target.value}))}>
              <option value="">— none —</option>
              {bookings.map(b=><option key={b.id} value={b.id}>{b.booking_code} · {b.guest_name} · {money(b.amount)}</option>)}
            </select></div>
          <div><label className="label">Base Amount (taxable) *</label>
            <input className="input" type="number" required value={form.base_amount||''}
              onChange={e=>setForm(s=>({...s,base_amount:e.target.value}))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">GST Rate %</label>
              <select className="input" value={form.gst_rate} onChange={e=>setForm(s=>({...s,gst_rate:+e.target.value}))}>
                <option value={0}>0%</option><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option></select></div>
            <div><label className="label">Method</label>
              <select className="input" value={form.method} onChange={e=>setForm(s=>({...s,method:e.target.value}))}>
                {['cash','card','upi','bank_transfer','online'].map(m=><option key={m} value={m}>{m.replace('_',' ')}</option>)}</select></div>
          </div>
          {preview && <div className="text-sm bg-slate-50 rounded p-2">
            GST: <b>{money(preview.gst)}</b> · Total payable: <b>{money(preview.total)}</b></div>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={()=>setOpen(false)}>Cancel</button>
            <button className="btn-primary">Save Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded-lg p-3 ${highlight?'bg-brand-50':'bg-slate-50'}`}>
      <div className={`text-xl font-bold ${highlight?'text-brand-700':''}`}>{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}
