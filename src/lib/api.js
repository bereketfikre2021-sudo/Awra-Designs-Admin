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

  const data = await res.json()

  if (!res.ok) {
    const err = new Error(data.message || 'Request failed')
    err.status = res.status
    throw err
  }

  return data
}

export const api = {
  get:    (path)        => request('GET', path),
  post:   (path, body)  => request('POST', path, body),
  put:    (path, body)  => request('PUT', path, body),
  patch:  (path, body)  => request('PATCH', path, body),
  delete: (path)        => request('DELETE', path),
}
