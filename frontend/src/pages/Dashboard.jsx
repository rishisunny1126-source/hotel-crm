import { useEffect, useState } from 'react';
import api from '../api/client';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { date } from '../utils/format';

const COLORS = ['#2563eb','#16a34a','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];

const CARD_DEFS = [
  ['totalEnquiries','Total Enquiries','📝'],
  ['newEnquiries','New Enquiries','🆕'],
  ['pendingFollowUps','Pending Follow-Ups','⏰'],
  ['confirmedBookings','Confirmed Bookings','✅'],
  ['lostLeads','Lost Leads','❌'],
  ['occupiedRooms','Occupied Rooms','🛏️'],
  ['availableRooms','Available Rooms','🟢'],
  ['housekeepingPending','HK Pending','🧹'],
  ['openComplaints','Open Complaints','⚠️'],
  ['corporateBookings','Corporate Bookings','🏢'],
];

export default function Dashboard() {
  const [cards, setCards] = useState({});
  const [charts, setCharts] = useState(null);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    api.get('/dashboard/summary').then(r => setCards(r.data.data));
    api.get('/dashboard/charts').then(r => setCharts(r.data.data));
    api.get('/dashboard/activity').then(r => setActivity(r.data.data));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-5">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        {CARD_DEFS.map(([k, label, icon]) => (
          <div key={k} className="card">
            <div className="text-2xl">{icon}</div>
            <div className="text-2xl font-bold mt-1">{cards[k] ?? '—'}</div>
            <div className="text-xs text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h3 className="font-semibold mb-3 text-sm">Enquiries by Source</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts?.enquiriesBySource || []}>
              <XAxis dataKey="source" fontSize={11} /><YAxis fontSize={11} /><Tooltip />
              <Bar dataKey="n" fill="#2563eb" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-3 text-sm">Room Occupancy</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={charts?.occupancy || []} dataKey="n" nameKey="status" outerRadius={90} label>
                {(charts?.occupancy || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-3 text-sm">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={charts?.revenueTrend || []}>
              <XAxis dataKey="month" fontSize={11} /><YAxis fontSize={11} /><Tooltip />
              <Line dataKey="total" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card flex flex-col items-center justify-center">
          <h3 className="font-semibold mb-3 text-sm self-start">Booking Conversion Rate</h3>
          <div className="text-6xl font-bold text-brand-600">{charts?.conversionRate ?? 0}%</div>
          <p className="text-xs text-slate-400 mt-2">Enquiries → Confirmed bookings</p>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3 text-sm">Recent Activity</h3>
        <ul className="divide-y divide-slate-100">
          {activity.length === 0 && <li className="text-sm text-slate-400 py-2">No activity yet</li>}
          {activity.map((a, i) => (
            <li key={i} className="py-2 text-sm flex justify-between">
              <span><b className="capitalize">{a.event_type?.replace(/_/g,' ')}</b> — {a.guest_name}
                {a.to_value && <span className="text-slate-400"> → {a.to_value}</span>}</span>
              <span className="text-xs text-slate-400">{date(a.created_at)} · {a.actor || 'system'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
