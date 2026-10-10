import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

/**
 * Pinta la portada de un libro. `GET /books/{id}/cover` exige Authorization,
 * así que se descarga como blob y se expone con un object URL; un 404 o
 * cualquier fallo cae al marcador de "sin portada".
 */
export default function BookCover({ bookId, coverKey, size = 'sm' }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!bookId || !coverKey) {
      setUrl(null);
      setFailed(false);
      return undefined;
    }

    let active = true;
    let objectUrl = null;

    api
      .getBinary(`/books/${bookId}/cover`)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        setFailed(false);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [bookId, coverKey]);

  const className = `cover cover-${size}`;

  if (!coverKey || failed || !url) {
    return <div className={`${className} cover-empty`}>Sin portada</div>;
  }

  return <img className={className} src={url} alt="Portada del libro" />;
}
