import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, api } from '../api/client.js';

const MAX_ITEMS = 3;

function toList(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

export default function LoanNew() {
  const navigate = useNavigate();
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState([]);
  const [member, setMember] = useState(null);

  const [bookQuery, setBookQuery] = useState('');
  const [bookResults, setBookResults] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get('/members', { params: { q: memberQuery.trim(), page: 1, size: 8 } })
      .then((data) => {
        if (active) setMemberResults(toList(data));
      })
      .catch(() => {
        if (active) setMemberResults([]);
      });
    return () => {
      active = false;
    };
  }, [memberQuery]);

  useEffect(() => {
    let active = true;
    api
      .get('/books', { params: { q: bookQuery.trim(), page: 1, size: 8 } })
      .then((data) => {
        if (active) setBookResults(toList(data));
      })
      .catch(() => {
        if (active) setBookResults([]);
      });
    return () => {
      active = false;
    };
  }, [bookQuery]);

  function selectMember(candidate) {
    setMember(candidate);
    setError(null);
  }

  function isSelected(bookId) {
    return selectedBooks.some((book) => book.id === bookId);
  }

  function addBook(book) {
    setError(null);
    if (isSelected(book.id)) {
      setError('Ese libro ya está en el préstamo. No se puede repetir.');
      return;
    }
    if (selectedBooks.length >= MAX_ITEMS) {
      setError(`Un préstamo admite máximo ${MAX_ITEMS} libros.`);
      return;
    }
    setSelectedBooks((prev) => [...prev, book]);
  }

  function removeBook(bookId) {
    setSelectedBooks((prev) => prev.filter((book) => book.id !== bookId));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!member) {
      setError('Selecciona un socio.');
      return;
    }
    if (selectedBooks.length < 1) {
      setError('Agrega al menos un libro.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const loan = await api.post('/loans', {
        member_id: member.id,
        items: selectedBooks.map((book) => ({ book_id: book.id })),
      });
      navigate(`/prestamos/${loan.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar el préstamo');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2>Registrar préstamo</h2>
      <p className="muted">Un socio, de 1 a 3 libros distintos. El plazo es de 14 días.</p>

      <form onSubmit={handleSubmit}>
        <div className="two-col">
          <div className="card">
            <h3>Socio</h3>
            {member ? (
              <p className="selection">
                <strong>{member.full_name}</strong>
                <span className="mono"> · {member.document_number}</span>
                <button type="button" className="btn-secondary" onClick={() => setMember(null)}>
                  Cambiar
                </button>
              </p>
            ) : (
              <>
                <input
                  type="search"
                  className="toolbar-search"
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  placeholder="Buscar socio por nombre o documento…"
                  aria-label="Buscar socio"
                  autoFocus
                />
                <ul className="pick-list">
                  {memberResults.map((candidate) => (
                    <li key={candidate.id}>
                      <button type="button" onClick={() => selectMember(candidate)}>
                        {candidate.full_name}
                        <span className="mono"> · {candidate.document_number}</span>
                      </button>
                    </li>
                  ))}
                  {memberResults.length === 0 && <li className="muted">Sin resultados.</li>}
                </ul>
              </>
            )}
          </div>

          <div className="card">
            <h3>Libros ({selectedBooks.length}/{MAX_ITEMS})</h3>
            <input
              type="search"
              className="toolbar-search"
              value={bookQuery}
              onChange={(event) => setBookQuery(event.target.value)}
              placeholder="Buscar libro por título, autor o ISBN…"
              aria-label="Buscar libro"
            />
            <ul className="pick-list">
              {bookResults.map((book) => {
                const selected = isSelected(book.id);
                const full = selectedBooks.length >= MAX_ITEMS;
                return (
                  <li key={book.id}>
                    <button
                      type="button"
                      onClick={() => addBook(book)}
                      disabled={selected || full}
                    >
                      {book.title}
                      <span className="muted"> · {book.author}</span>
                      {selected && <span className="tag">Agregado</span>}
                    </button>
                  </li>
                );
              })}
              {bookResults.length === 0 && <li className="muted">Sin resultados.</li>}
            </ul>

            {selectedBooks.length > 0 && (
              <ul className="chips">
                {selectedBooks.map((book) => (
                  <li key={book.id} className="chip">
                    {book.title}
                    <button
                      type="button"
                      aria-label={`Quitar ${book.title}`}
                      onClick={() => removeBook(book.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" disabled={saving || !member || selectedBooks.length === 0}>
            {saving ? 'Registrando…' : 'Registrar préstamo'}
          </button>
        </div>
      </form>
    </section>
  );
}
