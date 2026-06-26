import { useEffect, useState } from 'react';
import api from '../api/client';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import { statusColor, date, money } from '../utils/format';

const STATUSES = ['new','contacted','interested','follow_up_pending','confirmed','cancelled','lost'];
const SOURCES = ['call','whatsapp','walk_in','email','website','ota','referral','other'];

export default function Enquiries() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ source: 'call', guests_count: 1 });
  const [detail, setDetail] = useState(null);
  const [aiMsg, setAiMsg] = useState('');
  const [dur, setDur] = useState(24);
  const [staff, setStaff] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await api.get('/enquiries', { params: { q, status: statusF } });
    setRows(data.data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, statusF]);
  useEffect(() => {
    api.get('/users', { params: { limit: 100 } }).then(r => setStaff(r.data.data)).catch(() => {});
  }, []);

  const create = async (e) => {
    e.preventDefault(); setErr('');
    if (saving) return;                 // guard against double-submit
    setSaving(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach(k => payload[k] === '' && delete payload[k]);
      await api.post('/enquiries', payload);
      setOpen(false); setForm({ source: 'call', guests_count: 1 }); load();
    } catch (e2) { setErr(e2.response?.data?.error?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const openDetail = async (id) => {
    const { data } = await api.get(`/enquiries/${id}`);
    setDetail(data.data); setAiMsg('');
    api.get('/rooms/availability', { params: {
      check_in: data.data.check_in_date, check_out: data.data.check_out_date } })
      .then(r => setRooms(r.data.data)).catch(() => setRooms([]));
  };

  const changeStatus = async (s) => {
    await api.patch(`/enquiries/${detail.id}/status`, { status: s });
    openDetail(detail.id); load();
  };
  const convert = async (room_id) => {
    try { await api.post(`/bookings/from-enquiry/${detail.id}`, { room_id, duration_hours: dur });
      alert('Converted to booking!'); openDetail(detail.id); load();
    } catch (e) { alert(e.response?.data?.error?.message || 'Convert failed'); }
  };

  const genMessage = async () => {
    const { data } = await api.get(`/follow-ups/message/${detail.id}`);
    setAiMsg(data.data.body);
  };

  return (
    <div>
      <PageHeader title="Guest Enquiries" subtitle="Centralized enquiry CRM"
        action={<button className="btn-primary" onClick={() => setOpen(true)}>+ New Enquiry</button>} />

      <div className="flex flex-wrap gap-2 mb-4">
        <input className="input max-w-xs" placeholder="Search name / mobile / email"
          value={q} onChange={e => setQ(e.target.value)} />
        <select className="input max-w-xs" value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-slate-50"><tr>
            {['Ref','Guest','Mobile','Source','Room','Dates','Budget','Status','Staff'].map(h =>
              <th key={h} className="th">{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openDetail(r.id)}>
                <td className="td font-mono text-xs">{r.ref_code}</td>
                <td className="td font-medium">{r.guest_name}</td>
                <td className="td">{r.mobile}</td>
                <td className="td capitalize">{r.source?.replace(/_/g,' ')}</td>
                <td className="td">{r.room_type || '—'}</td>
                <td className="td text-xs">{date(r.check_in_date)} → {date(r.check_out_date)}</td>
                <td className="td">{r.budget ? money(r.budget) : '—'}</td>
                <td className="td"><span className={`badge ${statusColor(r.status)}`}>{r.status?.replace(/_/g,' ')}</span></td>
                <td className="td text-xs">{r.assigned_staff_name || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-slate-400" colSpan="9">No enquiries</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      <Modal open={open} title="New Enquiry" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="grid grid-cols-2 gap-3">
          {err && <div className="col-span-2 text-sm text-red-600 bg-red-50 rounded p-2">{err}</div>}
          {[['guest_name','Guest Name',true],['mobile','Mobile',true],['email','Email'],['city','City'],
            ['room_type','Room Type'],['budget','Budget','','number']].map(([n,l,req,type]) => (
            <div key={n}><label className="label">{l}{req && ' *'}</label>
              <input className="input" type={type||'text'} required={!!req}
                value={form[n]||''} onChange={e => setForm(s => ({ ...s, [n]: e.target.value }))} /></div>
          ))}
          <div><label className="label">Source</label>
            <select className="input" value={form.source} onChange={e => setForm(s => ({ ...s, source: e.target.value }))}>
              {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}</select></div>
          <div><label className="label">Guests</label>
            <input className="input" type="number" min="1" value={form.guests_count}
              onChange={e => setForm(s => ({ ...s, guests_count: +e.target.value }))} /></div>
          <div><label className="label">Check-in</label>
            <input className="input" type="date" value={form.check_in_date||''}
              onChange={e => setForm(s => ({ ...s, check_in_date: e.target.value }))} /></div>
          <div><label className="label">Check-out</label>
            <input className="input" type="date" value={form.check_out_date||''}
              onChange={e => setForm(s => ({ ...s, check_out_date: e.target.value }))} /></div>
          <div className="col-span-2"><label className="label">Special Requirements</label>
            <textarea className="input" rows="2" value={form.special_requirements||''}
              onChange={e => setForm(s => ({ ...s, special_requirements: e.target.value }))} /></div>
          <div className="col-span-2"><label className="label">Assign Staff</label>
            <select className="input" value={form.assigned_staff_id||''}
              onChange={e => setForm(s => ({ ...s, assigned_staff_id: e.target.value }))}>
              <option value="">Unassigned</option>
              {staff.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}</select></div>
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create Enquiry'}</button>
          </div>
        </form>
      </Modal>

      {/* Detail modal */}
      <Modal open={!!detail} title={detail?.ref_code} onClose={() => setDetail(null)}>
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><b>{detail.guest_name}</b><div className="text-slate-400">{detail.mobile}</div></div>
              <div className="text-right"><span className={`badge ${statusColor(detail.status)}`}>{detail.status?.replace(/_/g,' ')}</span></div>
              <div>Room: {detail.room_type || '—'}</div>
              <div>Budget: {detail.budget ? money(detail.budget) : '—'}</div>
              <div>{date(detail.check_in_date)} → {date(detail.check_out_date)}</div>
              <div>Guests: {detail.guests_count}</div>
            </div>

            <div>
              <label className="label">Change Status</label>
              <div className="flex flex-wrap gap-1">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => changeStatus(s)}
                    className={`badge ${statusColor(s)} ${detail.status===s?'ring-2 ring-brand-400':''}`}>{s.replace(/_/g,' ')}</button>
                ))}
              </div>
            </div>

            {detail.status !== 'confirmed' && (
              <div>
                <label className="label">Convert to Booking (available rooms)</label>
                <div className="mb-2">
                  <span className="text-xs text-slate-500 mr-2">Stay length:</span>
                  <select className="input inline-block max-w-[160px] py-1" value={dur} onChange={e=>setDur(+e.target.value)}>
                    <option value={12}>12 hours</option>
                    <option value={24}>1 day</option>
                    <option value={48}>2 days</option>
                    <option value={72}>3 days</option>
                    <option value={168}>1 week</option>
                  </select>
                </div>
                {rooms.length === 0 ? <p className="text-xs text-slate-400">No available rooms for these dates</p>
                  : <div className="flex flex-wrap gap-1">
                      {rooms.slice(0,8).map(r => (
                        <button key={r.id} onClick={() => convert(r.id)} className="badge bg-green-100 text-green-700 hover:bg-green-200">
                          {r.room_number} · {r.room_type}</button>))}
                    </div>}
              </div>
            )}

            <div>
              <label className="label">AI Follow-up Message</label>
              <button type="button" className="btn-ghost text-xs py-1 px-2 mb-2" onClick={genMessage}>✨ Generate message</button>
              {aiMsg && (
                <div className="bg-slate-50 rounded p-2 text-sm">
                  {aiMsg}
                  <button type="button" className="block mt-2 text-brand-600 hover:underline text-xs"
                    onClick={() => navigator.clipboard.writeText(aiMsg)}>Copy</button>
                </div>
              )}
            </div>

            <div>
              <label className="label">History Timeline</label>
              <ul className="border-l-2 border-slate-200 pl-3 space-y-2">
                {detail.history?.map(h => (
                  <li key={h.id} className="text-xs">
                    <span className="font-semibold capitalize">{h.event_type.replace(/_/g,' ')}</span>
                    {h.from_value && <span className="text-slate-400"> {h.from_value} → {h.to_value}</span>}
                    <div className="text-slate-400">{date(h.created_at)} - {h.note}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
