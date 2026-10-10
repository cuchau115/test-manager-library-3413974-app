import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api } from '../api/client.js';
import Pagination from '../components/Pagination.jsx';
import { formatDateTime, shortId, statusClass, statusLabel } from '../utils/format.js';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ['', 'open', 'overdue', 'closed'];

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [memberId, setMemberId] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get('/members', { params: { page: 1, size: 50 } })
      .then((data) => {
        if (active) setMembers(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        // El filtro por socio es opcional: si falla, la lista sigue operativa.
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get('/loans', {
        params: { from, to, status, member_id: memberId, page, size: PAGE_SIZE },
      })
      .then((data) => {
        if (!active) return;
        setLoans(Array.isArray(data.items) ? data.items : []);
        setTotal(typeof data.total === 'number' ? data.total : 0);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los préstamos');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [from, to, status, memberId, page]);

  const memberNames = useMemo(() => {
    const map = new Map();
    members.forEach((member) => map.set(member.id, member.full_name));
    return map;
  }, [members]);

  function resetPage(fn) {
    return (event) => {
      setPage(1);
      fn(event.target.value);
    };
  }

  function linesCount(loan) {
    if (Array.isArray(loan.items)) return loan.items.length;
    if (typeof loan.item_count === 'number') return loan.item_count;
    return '—';
  }

  function memberLabel(loan) {
    if (loan.member_name) return loan.member_name;
    if (loan.member?.full_name) return loan.member.full_name;
    return memberNames.get(loan.member_id) ?? shortId(loan.member_id);
  }

  return (
    <section>
      <div className="page-head">
        <h2>Préstamos</h2>
        <Link className="button-link" to="/prestamos/nuevo">
          Nuevo préstamo
        </Link>
      </div>

      <div className="toolbar filters">
        <label className="field-inline">
          <span>Desde</span>
          <input type="date" value={from} onChange={resetPage(setFrom)} />
        </label>
        <label className="field-inline">
          <span>Hasta</span>
          <input type="date" value={to} onChange={resetPage(setTo)} />
        </label>
        <label className="field-inline">
          <span>Estado</span>
          <select value={status} onChange={resetPage(setStatus)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option || 'all'} value={option}>
                {option === '' ? 'Todos' : statusLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label className="field-inline">
          <span>Socio</span>
          <select value={memberId} onChange={resetPage(setMemberId)}>
            <option value="">Todos</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p>Cargando préstamos…</p>
      ) : (
        <>
          {loans.length === 0 ? (
            <p>No hay préstamos que coincidan con los filtros.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Préstamo</th>
                  <th>Socio</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th className="num">Líneas</th>
                  <th aria-label="Detalle" />
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id}>
                    <td className="mono">{shortId(loan.id)}</td>
                    <td>{memberLabel(loan)}</td>
                    <td>{formatDateTime(loan.loaned_at)}</td>
                    <td>
                      <span className={statusClass(loan.status)}>{statusLabel(loan.status)}</span>
                    </td>
                    <td className="num">{linesCount(loan)}</td>
                    <td>
                      <Link to={`/prestamos/${loan.id}`}>Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <Pagination page={page} size={PAGE_SIZE} total={total} onChange={setPage} />
        </>
      )}
    </section>
  );
}
