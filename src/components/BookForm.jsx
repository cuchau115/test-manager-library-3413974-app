import { useEffect, useState } from 'react';
import { ApiError, api } from '../api/client.js';
import BookCover from './BookCover.jsx';

const MAX_COVER_BYTES = 2 * 1024 * 1024;
const COVER_TYPES = ['image/jpeg', 'image/png'];

const EMPTY_FORM = {
  title: '',
  author: '',
  isbn: '',
  category_id: '',
  total_copies: '1',
};

function validateCover(file) {
  if (!COVER_TYPES.includes(file.type)) {
    return 'La portada debe ser JPG o PNG.';
  }
  if (file.size > MAX_COVER_BYTES) {
    return 'La portada no puede superar 2 MB.';
  }
  return null;
}

export default function BookForm({ book, categories, onSaved, onCancel }) {
  const isEdit = Boolean(book);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [error, setError] = useState(null);
  const [coverOk, setCoverOk] = useState(null);

  useEffect(() => {
    if (book) {
      setForm({
        title: book.title ?? '',
        author: book.author ?? '',
        isbn: book.isbn ?? '',
        category_id: book.category?.id ?? '',
        total_copies: String(book.total_copies ?? 1),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setFile(null);
    setError(null);
    setCoverOk(null);
  }, [book]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleFile(event) {
    const selected = event.target.files?.[0] ?? null;
    if (selected) {
      const invalid = validateCover(selected);
      if (invalid) {
        setError(invalid);
        event.target.value = '';
        setFile(null);
        return;
      }
    }
    setError(null);
    setFile(selected);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setCoverOk(null);

    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      category_id: form.category_id,
      total_copies: Number(form.total_copies),
    };

    try {
      if (isEdit) {
        // El contrato PUT reemplaza título, autor, categoría y total.
        await api.put(`/books/${book.id}`, payload);
        onSaved?.();
      } else {
        const created = await api.post('/books', {
          ...payload,
          isbn: form.isbn.trim(),
        });
        if (file) {
          const data = new FormData();
          data.append('file', file);
          await api.uploadPut(`/books/${created.id}/cover`, data);
        }
        onSaved?.();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el libro');
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadCover() {
    if (!file) {
      setError('Selecciona un archivo JPG o PNG.');
      return;
    }
    setCoverBusy(true);
    setError(null);
    setCoverOk(null);
    try {
      const data = new FormData();
      data.append('file', file);
      await api.uploadPut(`/books/${book.id}/cover`, data);
      setFile(null);
      setCoverOk('Portada actualizada.');
      onSaved?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo subir la portada');
    } finally {
      setCoverBusy(false);
    }
  }

  async function handleRemoveCover() {
    setCoverBusy(true);
    setError(null);
    setCoverOk(null);
    try {
      await api.delete(`/books/${book.id}/cover`);
      setCoverOk('Portada eliminada.');
      onSaved?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo quitar la portada');
    } finally {
      setCoverBusy(false);
    }
  }

  return (
    <form className="card book-form" onSubmit={handleSubmit}>
      <h3>{isEdit ? `Editar «${book.title}»` : 'Nuevo libro'}</h3>

      <label className="field">
        <span>Título</span>
        <input name="title" value={form.title} onChange={handleChange} required minLength={1} />
      </label>

      <label className="field">
        <span>Autor</span>
        <input name="author" value={form.author} onChange={handleChange} required minLength={1} />
      </label>

      <label className="field">
        <span>ISBN (13 dígitos)</span>
        <input
          name="isbn"
          value={form.isbn}
          onChange={handleChange}
          required
          disabled={isEdit}
          inputMode="numeric"
          pattern="\d{13}"
          title="13 dígitos"
        />
      </label>

      <label className="field">
        <span>Categoría</span>
        <select name="category_id" value={form.category_id} onChange={handleChange} required>
          <option value="">Selecciona una categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Total de ejemplares</span>
        <input
          name="total_copies"
          type="number"
          min="1"
          value={form.total_copies}
          onChange={handleChange}
          required
        />
      </label>

      {isEdit ? (
        <div className="cover-editor">
          <p className="muted">Portada actual</p>
          <BookCover bookId={book.id} coverKey={book.cover_key} size="md" />
          <input type="file" accept="image/png,image/jpeg" onChange={handleFile} />
          <div className="cover-actions">
            <button type="button" onClick={handleUploadCover} disabled={coverBusy || !file}>
              {coverBusy ? 'Procesando…' : 'Subir portada'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleRemoveCover}
              disabled={coverBusy || !book.cover_key}
            >
              Quitar portada
            </button>
          </div>
        </div>
      ) : (
        <label className="field">
          <span>Portada (opcional, JPG/PNG ≤ 2 MB)</span>
          <input type="file" accept="image/png,image/jpeg" onChange={handleFile} />
        </label>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {coverOk && <p className="ok">{coverOk}</p>}

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear libro'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
