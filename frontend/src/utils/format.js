export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const date = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
export const datetime = (d) => d ? new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
export const statusColor = (s) => ({
  new:'bg-blue-100 text-blue-700', contacted:'bg-indigo-100 text-indigo-700',
  interested:'bg-purple-100 text-purple-700', follow_up_pending:'bg-amber-100 text-amber-700',
  confirmed:'bg-green-100 text-green-700', cancelled:'bg-slate-200 text-slate-600',
  lost:'bg-red-100 text-red-700', available:'bg-green-100 text-green-700',
  occupied:'bg-red-100 text-red-700', reserved:'bg-amber-100 text-amber-700',
  cleaning:'bg-blue-100 text-blue-700', maintenance:'bg-slate-200 text-slate-600',
  open:'bg-red-100 text-red-700', in_progress:'bg-amber-100 text-amber-700',
  resolved:'bg-green-100 text-green-700', closed:'bg-slate-200 text-slate-600',
  pending:'bg-amber-100 text-amber-700', completed:'bg-green-100 text-green-700',
  ready:'bg-green-100 text-green-700', dirty:'bg-red-100 text-red-700',
}[s] || 'bg-slate-100 text-slate-600');
