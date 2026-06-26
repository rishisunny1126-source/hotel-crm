import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NAV } from '../../utils/nav';
import { useState } from 'react';

export default function Layout({ children }) {
  const { user, logout, can } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const items = NAV.filter(n => can(...n.roles));

  return (
    <div className="min-h-screen flex">
      <aside className={`fixed lg:static z-20 w-64 bg-white border-r border-slate-200 h-screen overflow-y-auto
        transition-transform ${open ? '' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-slate-200">
          <h1 className="font-bold text-brand-700 text-lg leading-tight">Hotel CRM</h1>
          <p className="text-xs text-slate-400">Enquiry & Follow-Up</p>
        </div>
        <nav className="p-2">
          {items.map(i => (
            <NavLink key={i.to} to={i.to} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-0.5
                ${isActive ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
              <span>{i.icon}</span>{i.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-10">
          <button className="lg:hidden btn-ghost px-2 py-1" onClick={() => setOpen(o => !o)}>☰</button>
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right">
              <div className="font-semibold">{user?.name}</div>
              <div className="text-xs text-slate-400 capitalize">{user?.role?.replace('_',' ')}</div>
            </div>
            <button className="btn-ghost" onClick={async () => { await logout(); nav('/login'); }}>Logout</button>
          </div>
        </header>
        <main className="p-4 lg:p-6 flex-1 max-w-screen-2xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
