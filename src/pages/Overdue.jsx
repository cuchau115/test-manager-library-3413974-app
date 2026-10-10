import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api } from '../api/client.js';
import Pagination from '../components/Pagination.jsx';
import { formatDateTime, shortId } from '../utils/format.js';

const PAGE_SIZE = 10;

export default function Overdue() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [paginated, setPaginated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get('/loans/overdue', { params: { page, size: PAGE_SIZE } })
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];
        setRows(list);
        setPaginated(!Array.isArray(data) && typeof data?.total === 'number');
        setTotal(typeof data?.total === 'number' ? data.total : list.length);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los vencidos');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page]);

  return (
    <section>
      <h2>Libros vencidos</h2>
      <p className="muted">Líneas sin devolver cuya fecha de vencimiento ya pasó.</p>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p>Cargando vencidos…</p>
      ) : rows.length === 0 ? (
        <p>No hay préstamos vencidos.</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Libro</th>
                <th>Socio</th>
                <th>Venció</th>
                <th className="num">Días de retraso</th>
                <th aria-label="Detalle" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.loan_id}-${row.item_id}`}>
                  <td>{row.book_title}</td>
                  <td>{row.member_name}</td>
                  <td>{formatDateTime(row.due_at)}</td>
                  <td className="num">{row.days_late}</td>
                  <td>
                    <Link to={`/prestamos/${row.loan_id}`}>{shortId(row.loan_id)}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {paginated && (
            <Pagination page={page} size={PAGE_SIZE} total={total} onChange={setPage} />
          )}
        </>
      )}
    </section>
  );
}
