const STATUS_LABELS = {
  open: 'Abierto',
  overdue: 'Vencido',
  closed: 'Cerrado',
};

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? '—';
}

export function statusClass(status) {
  return `status status-${status ?? 'unknown'}`;
}

export function shortId(id) {
  if (!id) return '—';
  const text = String(id);
  return text.length > 8 ? text.slice(0, 8) : text;
}
