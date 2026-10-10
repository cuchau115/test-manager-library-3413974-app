import { createContext, useContext, useMemo, useState } from 'react';

const TOKEN_KEY = 'mllib.token';
const ROLE_KEY = 'mllib.role';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [role, setRole] = useState(() => localStorage.getItem(ROLE_KEY));

  const value = useMemo(
    () => ({
      token,
      role,
      isAuthenticated: Boolean(token),
      login(newToken, newRole) {
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(ROLE_KEY, newRole);
        setToken(newToken);
        setRole(newRole);
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ROLE_KEY);
        setToken(null);
        setRole(null);
      },
    }),
    [token, role]
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
