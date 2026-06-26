import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@hotel.com');
  const [password, setPassword] = useState('Password@123');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try { await login(email, password); nav('/'); }
    catch (e2) { setErr(e2.response?.data?.error?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-brand-700">Hotel CRM</h1>
        <p className="text-sm text-slate-400 mb-5">Enquiry & Follow-Up management</p>
        <form onSubmit={submit} className="space-y-3">
          {err && <div className="text-sm text-red-600 bg-red-50 rounded p-2">{err}</div>}
          <div><label className="label">Email</label>
            <input className="input" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  );
}
