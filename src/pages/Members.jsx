import { useEffect, useState } from 'react';
import { ApiError, api } from '../api/client.js';
import Pagination from '../components/Pagination.jsx';

const PAGE_SIZE = 10;

const EMPTY_FORM = { full_name: '', document_number: '' };

export default function Members() {
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formOk, setFormOk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get('/members', { params: { q: search, page, size: PAGE_SIZE } })
      .then((data) => {
        if (!active) return;
        setMembers(Array.isArray(data.items) ? data.items : []);
        setTotal(typeof data.total === 'number' ? data.total : 0);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los socios');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search, page, refreshKey]);

  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    let active = true;
    api
      .get(`/members/${detailId}`)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch(() => {
        if (active) setDetail(null);
      });
    return () => {
      active = false;
    };
  }, [detailId]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(q.trim());
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setCreating(true);
    setFormError(null);
    setFormOk(null);
    try {
      await api.post('/members', {
        full_name: form.full_name.trim(),
        document_number: form.document_number.trim(),
      });
      setForm(EMPTY_FORM);
      setFormOk('Socio creado correctamente.');
      setPage(1);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      setFormError(apiErr?.message ?? 'No se pudo crear el socio');
    } finally {
      setCreating(false);
    }
  }

  function toggleDetail(id) {
    setDetailId((current) => (current === id ? null : id));
  }

  return (
    <section>
      <h2>Socios</h2>

      <div className="two-col">
        <form className="card" onSubmit={handleSearch}>
          <h3>Lista de socios</h3>
          <div className="toolbar">
            <input
              className="toolbar-search"
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Buscar por nombre…"
              aria-label="Buscar socio"
            />
            <button type="submit">Buscar</button>
          </div>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          {loading ? (
            <p>Cargando socios…</p>
          ) : (
            <>
              {members.length === 0 ? (
                <p>No hay socios que coincidan con la búsqueda.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Documento</th>
                      <th className="num">Sin devolver</th>
                      <th aria-label="Detalle" />
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        detailOpen={detailId === member.id}
                        detail={detailId === member.id ? detail : null}
                        onToggle={() => toggleDetail(member.id)}
                      />
                    ))}
                  </tbody>
                </table>
              )}

              <Pagination page={page} size={PAGE_SIZE} total={total} onChange={setPage} />
            </>
          )}
        </form>

        <form className="card" onSubmit={handleCreate}>
          <h3>Nuevo socio</h3>
          <label className="field">
            <span>Nombre completo</span>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              minLength={2}
            />
          </label>
          <label className="field">
            <span>Número de documento</span>
            <input
              name="document_number"
              value={form.document_number}
              onChange={handleChange}
              required
              minLength={3}
            />
          </label>
          {formError && (
            <p className="error" role="alert">
              {formError}
            </p>
          )}
          {formOk && <p className="ok">{formOk}</p>}
          <button type="submit" disabled={creating}>
            {creating ? 'Guardando…' : 'Crear socio'}
          </button>
        </form>
      </div>
    </section>
  );
}

function MemberRow({ member, detailOpen, detail, onToggle }) {
  const activeLoans =
    detail != null && typeof detail.active_loans === 'number'
      ? detail.active_loans
      : typeof member.active_loans === 'number'
        ? member.active_loans
        : null;
  const fetched = detail != null;

  return (
    <>
      <tr>
        <td>{member.full_name}</td>
        <td className="mono">{member.document_number}</td>
        <td className="num">{fetched ? detail.active_loans : activeLoans ?? '—'}</td>
        <td>
          <button type="button" onClick={onToggle}>
            {detailOpen ? 'Ocultar' : 'Detalle'}
          </button>
        </td>
      </tr>
      {detailOpen && (
        <tr className="detail-row">
          <td colSpan={4}>
            <p>
              <strong>Documento:</strong> {detail?.document_number}
            </p>
            <p>
              <strong>Libros sin devolver:</strong> {detail?.active_loans ?? 0}
            </p>
          </td>
        </tr>
      )}
    </>
  );
}