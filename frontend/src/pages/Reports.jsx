import { useState } from 'react';
import api from '../api/client';
import PageHeader from '../components/ui/PageHeader';

const TYPES = ['enquiry','booking','occupancy','revenue','followup','complaint'];

export default function Reports() {
  const [type, setType] = useState('enquiry');
  const [rows, setRows] = useState([]);
  const run = async () => {
    const { data } = await api.get(`/reports/${type}`);
    setRows(data.data);
  };
  const download = (fmt) => {
    const token = localStorage.getItem('accessToken');
    fetch(`${import.meta.env.VITE_API_URL || '/api'}/reports/${type}?format=${fmt}`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(b => {
        const url = URL.createObjectURL(b); const a = document.createElement('a');
        a.href = url; a.download = `${type}-report.${fmt}`; a.click(); URL.revokeObjectURL(url);
      });
  };
  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Generate and export operational reports" />
      <div className="card flex flex-wrap items-end gap-3 mb-4">
        <div><label className="label">Report Type</label>
          <select className="input" value={type} onChange={e=>setType(e.target.value)}>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        <button className="btn-primary" onClick={run}>Generate</button>
        <button className="btn-ghost" onClick={()=>download('csv')}>Export CSV</button>
        <button className="btn-ghost" onClick={()=>download('pdf')}>Export PDF</button>
      </div>
      {rows.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead className="bg-slate-50"><tr>{Object.keys(rows[0]).map(k => <th key={k} className="th">{k}</th>)}</tr></thead>
            <tbody>{rows.map((r,i) => (
              <tr key={i} className="hover:bg-slate-50">{Object.values(r).map((v,j) => <td key={j} className="td">{String(v ?? '—')}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
