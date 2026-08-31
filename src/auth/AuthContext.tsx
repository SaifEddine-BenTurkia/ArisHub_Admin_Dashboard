import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, tokenStore } from '../lib/api';
import type { AdminUser } from '../types';

interface AuthValue {
  admin: AdminUser | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    tokenStore.clear();
    setAdmin(null);
  }, []);

  useEffect(() => {
    const expired = () => logout();
    window.addEventListener('admin-session-expired', expired);
    if (!tokenStore.get()) {
      setLoading(false);
      return () => window.removeEventListener('admin-session-expired', expired);
    }
    api<AdminUser>('/admin/me')
      .then(setAdmin)
      .catch(logout)
      .finally(() => setLoading(false));
    return () => window.removeEventListener('admin-session-expired', expired);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api<{ accessToken: string; admin: AdminUser }>('/admin/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    tokenStore.set(result.accessToken);
    setAdmin(result.admin);
  }, []);

  const value = useMemo(() => ({ admin, loading, login, logout }), [admin, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
