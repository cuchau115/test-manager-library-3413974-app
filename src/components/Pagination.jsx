const MAX_PAGES_SHOWN = 7;

export default function Pagination({ page, size, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / size));

  if (total === 0) {
    return null;
  }

  const startPage = Math.max(1, Math.min(page - 2, totalPages - (MAX_PAGES_SHOWN - 1)));
  const endPage = Math.min(totalPages, startPage + MAX_PAGES_SHOWN - 1);
  const pages = [];

  for (let p = startPage; p <= endPage; p += 1) {
    pages.push(p);
  }

  return (
    <nav className="pagination" aria-label="Paginación">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={p === page ? 'page-current' : ''}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Siguiente
      </button>
      <span className="pagination-info">
        Página {page} de {totalPages} · {total} resultados
      </span>
    </nav>
  );
}