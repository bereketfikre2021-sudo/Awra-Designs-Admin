import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then(d => { setAdmin(d.data); setLoading(false) })
      .catch(() => { logout(); setLoading(false) })
  }, [])

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.data.token)
    localStorage.setItem('admin', JSON.stringify(data.data.admin))
    setAdmin(data.data.admin)
    return data.data.admin
  }

  const logout = async () => {
    try { await api.post('/auth/logout', {}) } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {loading ? (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="w-6 h-6 border border-neutral-700 border-t-white rounded-full animate-spin" />
        </div>
      ) : children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
