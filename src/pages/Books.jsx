import { useEffect, useState } from 'react';
import { ApiError, api } from '../api/client.js';
import BookCover from '../components/BookCover.jsx';
import BookForm from '../components/BookForm.jsx';
import Pagination from '../components/Pagination.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const PAGE_SIZE = 10;

function toList(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

export default function Books() {
  const { isAdmin } = useAuth();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get('/categories')
      .then((data) => {
        if (active) setCategories(toList(data));
      })
      .catch(() => {
        // El catálogo funciona aunque falle el cargue de categorías.
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
      .get('/books', { params: { q: search, category_id: categoryId, page, size: PAGE_SIZE } })
      .then((data) => {
        if (!active) return;
        setBooks(Array.isArray(data.items) ? data.items : []);
        setTotal(typeof data.total === 'number' ? data.total : 0);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar el catálogo');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search, categoryId, page, refreshKey]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(q.trim());
  }

  function handleCategory(event) {
    setPage(1);
    setCategoryId(event.target.value);
  }

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(book) {
    setEditing(book);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  function handleSaved() {
    refresh();
    if (!editing) {
      closeForm();
    }
  }

  async function handleDelete(book) {
    const confirmed = window.confirm(
      `¿Dar de baja «${book.title}»? Dejará de aparecer en el catálogo.`
    );
    if (!confirmed) return;
    setBusyId(book.id);
    setError(null);
    try {
      await api.delete(`/books/${book.id}`);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo dar de baja el libro');
    } finally {
      setBusyId(null);
    }
  }

  const available = (book) => book.available_copies ?? 0;

  return (
    <section>
      <div className="page-head">
        <h2>Catálogo</h2>
        {isAdmin && (
          <button type="button" onClick={openCreate}>
            Nuevo libro
          </button>
        )}
      </div>

      <form className="toolbar" onSubmit={handleSearch}>
        <input
          className="toolbar-search"
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Buscar por título, autor o ISBN…"
          aria-label="Buscar libro"
        />
        <select value={categoryId} onChange={handleCategory} aria-label="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button type="submit">Buscar</button>
      </form>

      {isAdmin && showForm && (
        <BookForm
          book={editing}
          categories={categories}
          onSaved={handleSaved}
          onCancel={closeForm}
        />
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p>Cargando catálogo…</p>
      ) : (
        <>
          {books.length === 0 ? (
            <p>No hay libros que coincidan con la búsqueda.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Portada</th>
                  <th>Título</th>
                  <th>Autor</th>
                  <th>ISBN</th>
                  <th>Categoría</th>
                  <th className="num">Disponibles</th>
                  {isAdmin && <th aria-label="Acciones" />}
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <BookCover bookId={book.id} coverKey={book.cover_key} />
                    </td>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td className="mono">{book.isbn}</td>
                    <td>{book.category?.name}</td>
                    <td className="num">
                      {available(book)} / {book.total_copies}
                    </td>
                    {isAdmin && (
                      <td className="row-actions">
                        <button type="button" onClick={() => openEdit(book)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleDelete(book)}
                          disabled={busyId === book.id}
                        >
                          {busyId === book.id ? '…' : 'Baja'}
                        </button>
                      </td>
                    )}
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
