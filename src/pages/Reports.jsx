import { useState } from 'react';
import { ApiError, api } from '../api/client.js';

function today(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export default function Reports() {
  const [from, setFrom] = useState(today(-30));
  const [to, setTo] = useState(today());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/reports/most-borrowed', { params: { from, to } });
      setReport(data);
    } catch (err) {
      setReport(null);
      setError(err instanceof ApiError ? err.message : 'No se pudo generar el reporte');
    } finally {
      setLoading(false);
    }
  }

  const rows = Array.isArray(report?.rows) ? report.rows : [];

  return (
    <section>
      <h2>Reporte de libros más prestados</h2>
      <p className="muted">Elige un rango de fechas (ambos inclusive). Solo administradores.</p>

      <form className="toolbar filters" onSubmit={handleSubmit}>
        <label className="field-inline">
          <span>Desde</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
        </label>
        <label className="field-inline">
          <span>Hasta</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Generando…' : 'Generar reporte'}
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {report && (
        <>
          <p className="muted">
            Periodo: {report.from} — {report.to}
          </p>
          {rows.length === 0 ? (
            <p>No hubo préstamos en el periodo seleccionado.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Categoría</th>
                  <th className="num">Veces prestado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.book_id}-${row.category_name}`}>
                    <td>{row.book_title}</td>
                    <td>{row.category_name}</td>
                    <td className="num">{row.times_borrowed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}
