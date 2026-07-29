// In dev, Vite proxies /api → localhost:5000. In prod, set VITE_API_URL.
const BASE = import.meta.env.VITE_API_URL || '/api'

async function request(method, path, body) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Auto-logout on 401 — token expired or invalid
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    // Redirect to login without a full page reload loop
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
    const err = new Error('Session expired. Please sign in again.')
    err.status = 401
    throw err
  }

  const data = await res.json()

  if (!res.ok) {
    const err = new Error(data.message || 'Request failed')
    err.status = res.status
    throw err
  }

  return data
}

export const api = {
  get:    (path)              => request('GET',    path),
  post:   (path, body)        => request('POST',   path, body),
  put:    (path, body)        => request('PUT',    path, body),
  patch:  (path, body)        => request('PATCH',  path, body),
  delete: (path, body)        => request('DELETE', path, body),
}
