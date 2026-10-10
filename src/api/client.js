const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export const TOKEN_KEY = 'mllib.token';
export const UNAUTHORIZED_EVENT = 'mllib:unauthorized';

const DEFAULT_MESSAGES = {
  400: 'Solicitud inválida',
  401: 'Sesión no válida o vencida',
  403: 'No tienes permisos para esta acción',
  404: 'Recurso no encontrado',
  409: 'Conflicto con el estado actual',
  422: 'Datos inválidos',
  500: 'Error interno del servidor',
};

/**
 * Error tipado con la forma del cuerpo de error único del contrato:
 * { code, message, details }
 */
export class ApiError extends Error {
  constructor({ code, message, details = [], status }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function buildQuery(params) {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function toApiError(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  const code = body?.code ?? `HTTP_${response.status}`;
  const message = body?.message ?? DEFAULT_MESSAGES[response.status] ?? 'Error inesperado';
  const details = Array.isArray(body?.details) ? body.details : [];

  return new ApiError({ code, message, details, status: response.status });
}

async function request(method, path, { body, params, auth = true, headers = {} } = {}) {
  const url = `${API_URL}${path}${buildQuery(params)}`;
  const isFormData = body instanceof FormData;
  const finalHeaders = { Accept: 'application/json', ...headers };

  if (auth) {
    const token = getToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let payload;
  if (body !== undefined && body !== null) {
    if (isFormData) {
      payload = body;
    } else {
      finalHeaders['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
  }

  const response = await fetch(url, { method, headers: finalHeaders, body: payload });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    throw await toApiError(response);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export const api = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  put: (path, body, options) => request('PUT', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),

  upload: (path, formData, options) =>
    request('POST', path, { ...options, body: formData }),

  async getBinary(path, options) {
    const response = await fetch(`${API_URL}${path}${buildQuery(options?.params)}`, {
      method: 'GET',
      headers: options?.auth === false ? {} : { Authorization: `Bearer ${getToken() ?? ''}` },
    });
    if (!response.ok) {
      throw await toApiError(response);
    }
    return response.blob();
  },
};

export default api;
