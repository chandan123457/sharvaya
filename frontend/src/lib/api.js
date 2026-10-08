const BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields || {};
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Request failed', res.status, data.fields);
  return data;
}

export const candidatesApi = {
  list: (params) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );
    return request(`/candidates?${qs}`);
  },
  stats: () => request('/candidates/stats'),
  get: (id) => request(`/candidates/${id}`),
  create: (body) => request('/candidates', { method: 'POST', body }),
  update: (id, body) => request(`/candidates/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/candidates/${id}`, { method: 'DELETE' }),
  restore: (id) => request(`/candidates/${id}/restore`, { method: 'PATCH' }),
};
