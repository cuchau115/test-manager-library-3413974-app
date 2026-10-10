import { Outlet } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';

export default function AppLayout() {
  return (
    <div className="app">
      <AppHeader />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}