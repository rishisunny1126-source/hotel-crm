import { useEffect, useState } from 'react';
import api from '../api/client';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import { statusColor, datetime, money } from '../utils/format';

// local datetime-local value (YYYY-MM-DDTHH:mm) from a Date
const toLocalInput = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite', 'Executive', 'Family'];

export default function Bookings() {
  const [rows, setRows] = useState([]);
  const [statusF, setStatusF] = useState('');

  // ---- new booking modal state ----
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [guestMode, setGuestMode] = useState('new');      // 'new' | 'existing'
  const [guests, setGuests] = useState([]);
  const [form, setForm] = useState({
    guest_id: '', name: '', mobile: '', email: '',
    check_in: toLocalInput(now), check_out: toLocalInput(tomorrow),
    room_type: '', room_id: '', amount: '',
  });
  const [availRooms, setAvailRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = async () => {
    const { data } = await api.get('/bookings', { params: { status: statusF } });
    setRows(data.data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusF]);

  const act = async (id, action) => {
    try { await api.patch(`/bookings/${id}/${action}`); load(); }
    catch (e) { alert(e.response?.data?.error?.message || 'Action failed'); }
  };

  // open modal: reset + preload existing guests
  const openNew = () => {
    setErr(''); setAvailRooms([]); setGuestMode('new');
    setForm({
      guest_id: '', name: '', mobile: '', email: '',
      check_in: toLocalInput(now), check_out: toLocalInput(tomorrow),
      room_type: '', room_id: '', amount: '',
    });
    setOpen(true);
    api.get('/guests', { params: { limit: 100 } }).then(r => setGuests(r.data.data)).catch(() => setGuests([]));
  };

  // fetch available rooms whenever the window / type changes (while modal open)
  useEffect(() => {
    if (!open || !form.check_in || !form.check_out) return;
    setLoadingRooms(true);
    const params = {
      check_in: new Date(form.check_in).toISOString(),
      check_out: new Date(form.check_out).toISOString(),
    };
    if (form.room_type) params.room_type = form.room_type;
    api.get('/rooms/availability', { params })
      .then(r => setAvailRooms(r.data.data))
      .catch(() => setAvailRooms([]))
      .finally(() => setLoadingRooms(false));
    // eslint-disable-next-line
  }, [open, form.check_in, form.check_out, form.room_type]);

  const submit = async () => {
    setErr('');
    if (new Date(form.check_out) <= new Date(form.check_in)) return setErr('Check-out must be after check-in.');
    if (!form.room_id) return setErr('Pick an available room.');
    if (guestMode === 'new' && (!form.name || !form.mobile)) return setErr('Guest name and mobile are required.');
    if (guestMode === 'existing' && !form.guest_id) return setErr('Select a guest.');

    setSaving(true);
    try {
      // resolve guest id (create if new)
      let guestId = form.guest_id;
      if (guestMode === 'new') {
        const { data } = await api.post('/guests', {
          name: form.name.trim(), mobile: form.mobile.trim(),
          email: form.email.trim() || undefined,
        });
        guestId = data.data.id;
      }
      const body = {
        guest_id: guestId,
        room_id: form.room_id,
        check_in_date: new Date(form.check_in).toISOString(),
        check_out_date: new Date(form.check_out).toISOString(),
      };
      if (form.amount !== '') body.amount = Number(form.amount);
      await api.post('/bookings', body);
      setOpen(false);
      load();
      const hasEmail = guestMode === 'new' ? !!form.email.trim()
        : !!guests.find(g => g.id === guestId)?.email;
      alert(hasEmail
        ? 'Booking created — a confirmation email has been sent to the guest.'
        : 'Booking created. (No email on record for this guest, so no confirmation email was sent.)');
    } catch (e) {
      setErr(e.response?.data?.error?.message || 'Could not create booking.');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title="Bookings" subtitle="Reservations, check-in & check-out"
        action={<button className="btn-primary" onClick={openNew}>+ New Booking</button>}
      />
      <select className="input max-w-xs mb-4" value={statusF} onChange={e=>setStatusF(e.target.value)}>
        <option value="">All statuses</option>
        {['reserved','checked_in','checked_out','cancelled','no_show'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
      </select>
      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-slate-50"><tr>
            {['Code','Guest','Room','Dates','Amount','Status','Actions'].map(h=><th key={h} className="th">{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map(b => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="td font-mono text-xs">{b.booking_code}</td>
                <td className="td font-medium">{b.guest_name}</td>
                <td className="td">{b.room_number}</td>
                <td className="td text-xs">{datetime(b.check_in_date)} → {datetime(b.check_out_date)}</td>
                <td className="td">{money(b.amount)}</td>
                <td className="td"><span className={`badge ${statusColor(b.status)}`}>{b.status?.replace(/_/g,' ')}</span></td>
                <td className="td whitespace-nowrap">
                  {b.status === 'reserved' && <button className="btn-primary py-1 px-2 text-xs" onClick={()=>act(b.id,'check-in')}>Check-in</button>}
                  {b.status === 'checked_in' && <button className="btn-ghost py-1 px-2 text-xs" onClick={()=>act(b.id,'check-out')}>Check-out</button>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-slate-400" colSpan="7">No bookings</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={open} title="New Booking" onClose={() => !saving && setOpen(false)}>
        {err && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</div>}

        {/* Guest */}
        <div className="mb-3">
          <span className="label">Guest</span>
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => setGuestMode('new')}
              className={`badge ${guestMode==='new'?'bg-brand-600 text-white':'bg-slate-100 text-slate-600'}`}>New guest</button>
            <button type="button" onClick={() => setGuestMode('existing')}
              className={`badge ${guestMode==='existing'?'bg-brand-600 text-white':'bg-slate-100 text-slate-600'}`}>Existing guest</button>
          </div>
          {guestMode === 'new' ? (
            <div className="grid grid-cols-1 gap-2">
              <input className="input" placeholder="Guest name *" value={form.name} onChange={e=>set('name', e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="Mobile *" value={form.mobile} onChange={e=>set('mobile', e.target.value)} />
                <input className="input" placeholder="Email (for confirmation)" value={form.email} onChange={e=>set('email', e.target.value)} />
              </div>
            </div>
          ) : (
            <select className="input" value={form.guest_id} onChange={e=>set('guest_id', e.target.value)}>
              <option value="">Select a guest…</option>
              {guests.map(g => <option key={g.id} value={g.id}>{g.name} · {g.mobile}{g.email ? ` · ${g.email}` : ''}</option>)}
            </select>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <span className="label">Check-in</span>
            <input type="datetime-local" className="input" value={form.check_in} onChange={e=>set('check_in', e.target.value)} />
          </div>
          <div>
            <span className="label">Check-out</span>
            <input type="datetime-local" className="input" value={form.check_out} onChange={e=>set('check_out', e.target.value)} />
          </div>
        </div>

        {/* Room */}
        <div className="mb-3">
          <span className="label">Room type (optional filter)</span>
          <select className="input mb-2" value={form.room_type} onChange={e=>{ set('room_type', e.target.value); set('room_id',''); }}>
            <option value="">Any type</option>
            {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="label">Available room</span>
          {loadingRooms ? <p className="text-xs text-slate-400">Checking availability…</p>
            : availRooms.length === 0
              ? <p className="text-xs text-slate-400">No available rooms for this window. (Have you run <code>npm run rooms</code>?)</p>
              : <div className="flex flex-wrap gap-1">
                  {availRooms.map(r => (
                    <button key={r.id} type="button" onClick={() => set('room_id', r.id)}
                      className={`badge ${form.room_id===r.id?'bg-green-600 text-white':'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                      {r.room_number} · {r.room_type}</button>))}
                </div>}
        </div>

        {/* Amount */}
        <div className="mb-4">
          <span className="label">Amount (₹, optional — leave blank to auto-price)</span>
          <input type="number" min="0" className="input" placeholder="auto" value={form.amount} onChange={e=>set('amount', e.target.value)} />
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => !saving && setOpen(false)}>Cancel</button>
          <button className="btn-primary" disabled={saving} onClick={submit}>{saving ? 'Creating…' : 'Create booking'}</button>
        </div>
      </Modal>
    </div>
  );
}
