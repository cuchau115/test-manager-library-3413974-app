import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, TOKEN_KEY, UNAUTHORIZED_EVENT } from '../api/client.js';

const ROLE_KEY = 'mllib.role';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [role, setRole] = useState(() => localStorage.getItem(ROLE_KEY));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    setToken(null);
    setRole(null);
  }, []);

  // Cualquier 401 del cliente (token invalido/vencido) limpia la sesion.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, clearSession);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, clearSession);
  }, [clearSession]);

  const login = useCallback(async (username, password) => {
    const session = await api.post(
      '/auth/login',
      { username, password },
      { auth: false }
    );
    localStorage.setItem(TOKEN_KEY, session.access_token);
    localStorage.setItem(ROLE_KEY, session.role);
    setToken(session.access_token);
    setRole(session.role);
    return session;
  }, []);

  const value = useMemo(
    () => ({
      token,
      role,
      isAuthenticated: Boolean(token),
      isAdmin: role === 'admin',
      hasRole: (...roles) => roles.includes(role),
      login,
      logout: clearSession,
    }),
    [token, role, login, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
