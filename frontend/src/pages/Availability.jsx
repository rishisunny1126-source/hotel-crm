import { useEffect, useState } from 'react';
import api from '../api/client';
import PageHeader from '../components/ui/PageHeader';
import { money, statusColor, datetime } from '../utils/format';

const LIVE_COLOR = {
  available: 'bg-green-100 text-green-700 border-green-200',
  reserved:  'bg-amber-100 text-amber-700 border-amber-200',
  occupied:  'bg-red-100 text-red-700 border-red-200',
  cleaning:  'bg-blue-100 text-blue-700 border-blue-200',
  maintenance:'bg-slate-200 text-slate-600 border-slate-300',
};

function countdown(freeAt, now) {
  const ms = new Date(freeAt).getTime() - now;
  if (ms <= 0) return 'freeing…';
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  if (h >= 24) return `frees in ${Math.floor(h/24)}d ${h%24}h`;
  return h > 0 ? `frees in ${h}h ${m}m` : `frees in ${m}m`;
}

export default function Availability() {
  const [board, setBoard] = useState([]);
  const [ci, setCi] = useState('');
  const [co, setCo] = useState('');
  const [type, setType] = useState('');
  const [rooms, setRooms] = useState(null);
  const [err, setErr] = useState('');
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const loadBoard = () => api.get('/rooms/board').then(r => setBoard(r.data.data)).catch(()=>{});
  useEffect(() => { loadBoard(); const t = setInterval(loadBoard, 30000); return () => clearInterval(t); }, []);

  const search = async (e) => {
    e.preventDefault(); setErr('');
    try {
      const { data } = await api.get('/rooms/availability', { params: { check_in: ci, check_out: co, room_type: type } });
      setRooms(data.data);
    } catch (e2) { setErr(e2.response?.data?.error?.message || 'Failed'); }
  };

  // group board by floor
  const floors = [...new Set(board.map(r => r.floor))].sort((a,b)=>a-b);
  const counts = board.reduce((a,r)=>{ a[r.live_status]=(a[r.live_status]||0)+1; return a; }, {});

  return (
    <div>
      <PageHeader title="Room Availability" subtitle="Live board — a booked room frees automatically after its checkout time" />

      {/* live summary */}
      <div className="flex flex-wrap gap-2 mb-4 text-sm">
        {['available','reserved','occupied','cleaning'].map(k => (
          <span key={k} className={`badge border ${LIVE_COLOR[k]}`}>{counts[k]||0} {k}</span>
        ))}
        <span className="text-xs text-slate-400 self-center">· auto-refreshes every 30s</span>
      </div>

      {/* LIVE BOARD by floor */}
      <div className="card mb-6">
        {board.length === 0 && <p className="text-sm text-slate-400">No rooms yet. Run <code>npm run rooms</code> to load the 8 floors.</p>}
        {floors.map(fl => (
          <div key={fl} className="mb-4 last:mb-0">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
              Floor {fl} · {board.find(r=>r.floor===fl)?.room_type}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {board.filter(r=>r.floor===fl).map(r => (
                <div key={r.id} className={`rounded-lg border p-2 text-center ${LIVE_COLOR[r.live_status]}`}>
                  <div className="font-bold">{r.room_number}</div>
                  <div className="text-[10px] capitalize">{r.live_status}</div>
                  {r.free_at && <div className="text-[9px] mt-0.5 leading-tight font-semibold">{countdown(r.free_at, now)}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* date-range availability search */}
      <PageHeader title="Check a date/time range" subtitle="See which rooms are free for a specific window" />
      <form onSubmit={search} className="card flex flex-wrap items-end gap-3 mb-4">
        <div><label className="label">Check-in</label><input type="datetime-local" className="input" required value={ci} onChange={e=>setCi(e.target.value)} /></div>
        <div><label className="label">Check-out</label><input type="datetime-local" className="input" required value={co} onChange={e=>setCo(e.target.value)} /></div>
        <div><label className="label">Room Type</label>
          <select className="input" value={type} onChange={e=>setType(e.target.value)}>
            <option value="">Any</option><option>Economy</option><option>Deluxe</option><option>Suite</option><option>Business Lounge</option></select></div>
        <button className="btn-primary">Check</button>
      </form>
      {err && <div className="text-sm text-red-600 mb-3">{err}</div>}
      {rooms && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {rooms.length === 0 && <p className="text-slate-400 col-span-full">No rooms free for that window.</p>}
          {rooms.map(r => (
            <div key={r.id} className="card text-center">
              <div className="text-lg font-bold">{r.room_number}</div>
              <div className="text-xs text-slate-400">{r.room_type}</div>
              <div className="text-sm mt-1">{money(r.rate)}</div>
              <span className={`badge mt-2 ${statusColor(r.status)}`}>free</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
