import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Envuelve rutas que exigen sesión. Sin token → redirige a /login
 * conservando el destino para volver tras autenticarse.
 */
export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

/**
 * Envuelve rutas o bloques que exigen un rol concreto (p. ej. solo admin).
 * Un rol insuficiente vuelve al panel sin revelar la ruta pedida.
 */
export function RequireRole({ roles, children }) {
  const { role } = useAuth();

  if (!roles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
