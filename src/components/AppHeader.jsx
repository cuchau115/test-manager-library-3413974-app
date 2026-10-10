import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Panel', end: true },
  { to: '/libros', label: 'Catálogo' },
  { to: '/socios', label: 'Socios' },
  { to: '/reportes', label: 'Reporte', adminOnly: true },
];

export default function AppHeader() {
  const { role, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // La visibilidad por rol se decide aquí: los items marcados adminOnly
  // solo se muestran cuando el rol de sesión es admin.
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="app-header">
      <h1 className="app-brand">Manager Library</h1>
      <nav className="app-nav" aria-label="Navegación principal">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="app-session">
        <span className="role-badge">{isAdmin ? 'Administrador' : 'Bibliotecario'}</span>
        <button type="button" onClick={handleLogout}>
          Salir
        </button>
      </div>
    </header>
  );
}