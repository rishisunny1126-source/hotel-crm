import { createContext, useContext, useEffect, useState } from 'react';
import api, { setAccessToken } from '../api/client';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('accessToken');
    if (t) setAccessToken(t);
    setReady(true);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = data.data;
    setAccessToken(accessToken);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try { await api.post('/auth/logout', { refreshToken }); } catch {}
    localStorage.clear();
    setAccessToken(null);
    setUser(null);
  };

  const can = (...roles) => user && (roles.length === 0 || roles.includes(user.role));

  return (
    <AuthCtx.Provider value={{ user, login, logout, can, ready }}>
      {children}
    </AuthCtx.Provider>
  );
}
