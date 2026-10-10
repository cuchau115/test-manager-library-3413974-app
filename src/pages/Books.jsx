import { useEffect, useState } from 'react';
import { ApiError, api } from '../api/client.js';
import Pagination from '../components/Pagination.jsx';

const PAGE_SIZE = 10;

function toList(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

export default function Books() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
  }, [search, categoryId, page]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(q.trim());
  }

  function handleCategory(event) {
    setPage(1);
    setCategoryId(event.target.value);
  }

  const available = (book) => book.available_copies ?? 0;

  return (
    <section>
      <h2>Catálogo</h2>

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
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td>
                      {/* La portada real se añade en APP-06; aquí se deja el hueco. */}
                      <div className="cover-placeholder">{book.cover_key ? 'Portada' : 'Sin portada'}</div>
                    </td>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td className="mono">{book.isbn}</td>
                    <td>{book.category?.name}</td>
                    <td className="num">
                      {available(book)} / {book.total_copies}
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