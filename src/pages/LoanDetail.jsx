import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api } from '../api/client.js';
import { formatDateTime, shortId, statusClass, statusLabel } from '../utils/format.js';

export default function LoanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [returningId, setReturningId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/loans/${id}`);
      setLoan(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el préstamo');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReturn(item) {
    setReturningId(item.id);
    setError(null);
    try {
      await api.post(`/loans/${id}/items/${item.id}/return`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar la devolución');
    } finally {
      setReturningId(null);
    }
  }

  const items = Array.isArray(loan?.items) ? loan.items : [];

  return (
    <section>
      <div className="page-head">
        <h2>Préstamo {shortId(id)}</h2>
        <button type="button" className="btn-secondary" onClick={() => navigate('/prestamos')}>
          Volver a la lista
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p>Cargando préstamo…</p>
      ) : !loan ? (
        <p>No se encontró el préstamo.</p>
      ) : (
        <>
          <div className="card">
            <p>
              <strong>Socio:</strong>{' '}
              {loan.member_name ?? loan.member?.full_name ?? shortId(loan.member_id)}
            </p>
            <p>
              <strong>Fecha del préstamo:</strong> {formatDateTime(loan.loaned_at)}
            </p>
            <p>
              <strong>Estado:</strong>{' '}
              <span className={statusClass(loan.status)}>{statusLabel(loan.status)}</span>
            </p>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>ISBN</th>
                <th>Categoría</th>
                <th>Vence</th>
                <th>Devuelto</th>
                <th aria-label="Acción" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const returned = Boolean(item.returned_at);
                return (
                  <tr key={item.id}>
                    <td>{item.book_title}</td>
                    <td className="mono">{item.isbn}</td>
                    <td>{item.category_name}</td>
                    <td>{formatDateTime(item.due_at)}</td>
                    <td>{item.returned_at ? formatDateTime(item.returned_at) : '—'}</td>
                    <td>
                      {returned ? (
                        <span className="muted">Devuelto</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReturn(item)}
                          disabled={returningId === item.id}
                        >
                          {returningId === item.id ? 'Devolviendo…' : 'Devolver'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="muted">
            <Link to="/prestamos">Ver todos los préstamos</Link>
          </p>
        </>
      )}
    </section>
  );
}
