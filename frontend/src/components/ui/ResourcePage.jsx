import { useEffect, useState } from 'react';
import api from '../../api/client';
import Modal from './Modal';
import PageHeader from './PageHeader';
import { statusColor } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

/*
 Config-driven CRUD page.
 props: title, endpoint, columns[{key,label,badge?}], fields[{name,label,type,options?,required?}],
        canWrite(roles[]), filters[{name,label,options}]
*/
export default function ResourcePage({ title, subtitle, endpoint, columns, fields = [], writeRoles = ['admin','manager'], filters = [] }) {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [q, setQ] = useState('');
  const [filterVals, setFilterVals] = useState({});
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const writable = can(...writeRoles);

  const load = async () => {
    setLoading(true);
    try {
      const params = { q, ...filterVals };
      const { data } = await api.get(endpoint, { params });
      setRows(Array.isArray(data.data) ? data.data : []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, JSON.stringify(filterVals)]);

  const openCreate = () => { setEditing(null); setForm({}); setErr(''); setOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm(row); setErr(''); setOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    if (saving) return;
    setSaving(true);
    try {
      const payload = {};
      fields.forEach(f => { if (form[f.name] !== undefined && form[f.name] !== '') payload[f.name] = form[f.name]; });
      if (editing) await api.put(`${endpoint}/${editing.id}`, payload);
      else await api.post(endpoint, payload);
      setOpen(false); load();
    } catch (e2) {
      setErr(e2.response?.data?.error?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const remove = async (row) => {
    if (!confirm('Delete this record?')) return;
    try { await api.delete(`${endpoint}/${row.id}`); load(); }
    catch (e) { alert(e.response?.data?.error?.message || 'Delete failed'); }
  };

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle}
        action={writable && <button className="btn-primary" onClick={openCreate}>+ New</button>} />

      <div className="flex flex-wrap gap-2 mb-4">
        <input className="input max-w-xs" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
        {filters.map(f => (
          <select key={f.name} className="input max-w-xs"
            value={filterVals[f.name] || ''} onChange={e => setFilterVals(v => ({ ...v, [f.name]: e.target.value }))}>
            <option value="">All {f.label}</option>
            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>{columns.map(c => <th key={c.key} className="th">{c.label}</th>)}
              {writable && <th className="th">Actions</th>}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td className="td" colSpan={columns.length + 1}>Loading…</td></tr>
              : rows.length === 0 ? <tr><td className="td text-slate-400" colSpan={columns.length + 1}>No records</td></tr>
              : rows.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  {columns.map(c => (
                    <td key={c.key} className="td">
                      {c.badge
                        ? <span className={`badge ${statusColor(r[c.key])}`}>{String(r[c.key] ?? '').replace(/_/g,' ')}</span>
                        : String(r[c.key] ?? '—').replace(/_/g,' ')}
                    </td>
                  ))}
                  {writable && (
                    <td className="td whitespace-nowrap">
                      <button className="text-brand-600 hover:underline mr-3" onClick={() => openEdit(r)}>Edit</button>
                      <button className="text-red-500 hover:underline" onClick={() => remove(r)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={`${editing ? 'Edit' : 'New'} ${title.replace(/s$/,'')}`} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          {err && <div className="text-sm text-red-600 bg-red-50 rounded p-2">{err}</div>}
          {fields.map(f => (
            <div key={f.name}>
              <label className="label">{f.label}{f.required && ' *'}</label>
              {f.type === 'select' ? (
                <select className="input" value={form[f.name] || ''} required={f.required}
                  onChange={e => setForm(s => ({ ...s, [f.name]: e.target.value }))}>
                  <option value="">Select…</option>
                  {f.options.map(o => <option key={o} value={o}>{String(o).replace(/_/g,' ')}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea className="input" rows="3" value={form[f.name] || ''}
                  onChange={e => setForm(s => ({ ...s, [f.name]: e.target.value }))} />
              ) : (
                <input className="input" type={f.type || 'text'} value={form[f.name] || ''} required={f.required}
                  onChange={e => setForm(s => ({ ...s, [f.name]: e.target.value }))} />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : (editing ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
