import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layout/AppLayout.jsx';
import Books from './pages/Books.jsx';
import Home from './pages/Home.jsx';
import LoanDetail from './pages/LoanDetail.jsx';
import LoanNew from './pages/LoanNew.jsx';
import Loans from './pages/Loans.jsx';
import Login from './pages/Login.jsx';
import Members from './pages/Members.jsx';
import Overdue from './pages/Overdue.jsx';
import Reports from './pages/Reports.jsx';
import { RequireAuth, RequireRole } from './routes/guards.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="libros" element={<Books />} />
        <Route path="socios" element={<Members />} />
        <Route path="prestamos/nuevo" element={<LoanNew />} />
        <Route path="prestamos" element={<Loans />} />
        <Route path="prestamos/:id" element={<LoanDetail />} />
        <Route path="vencidos" element={<Overdue />} />
        <Route
          path="reportes"
          element={
            <RequireRole roles={['admin']}>
              <Reports />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}