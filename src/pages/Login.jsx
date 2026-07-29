import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || '/api'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  // Avatar hint — fetched from backend when a valid email is typed
  const [hint,         setHint]         = useState(null)  // { name, avatar, role }
  const [hintLoading,  setHintLoading]  = useState(false)

  // Debounce email lookup — only fires after user stops typing for 500ms
  useEffect(() => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setHint(null)
      return
    }
    const timer = setTimeout(async () => {
      setHintLoading(true)
      try {
        const res = await fetch(`${API}/auth/hint?email=${encodeURIComponent(trimmed)}`)
        const data = await res.json()
        if (data.success && data.data) {
          setHint(data.data)
        } else {
          setHint(null)
        }
      } catch {
        setHint(null)
      } finally {
        setHintLoading(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const initials = hint?.name
    ? hint.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Avatar hint — appears once a valid email is recognised */}
        <div className={`flex items-center gap-3 mb-6 transition-all duration-300 ${hint ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ minHeight: '48px' }}>
          {hint?.avatar
            ? <img src={hint.avatar} alt={hint.name}
                className="w-10 h-10 rounded-full object-cover border border-neutral-800 flex-shrink-0" />
            : <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm font-medium text-neutral-400 flex-shrink-0">
                {hintLoading
                  ? <div className="w-3 h-3 border border-neutral-600 border-t-white rounded-full animate-spin" />
                  : initials}
              </div>
          }
          {hint && (
            <div>
              <p className="text-sm font-medium text-white">{hint.name}</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{hint.role || 'admin'}</p>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h1 className="text-xl font-medium text-white">Awra Admin</h1>
          <p className="text-xs text-neutral-500 mt-1">Sign in to manage your content</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-neutral-900 border border-neutral-800 text-sm text-white px-3 py-2.5 focus:border-neutral-600 transition-colors placeholder-neutral-600"
              placeholder="admin@awradesigns.com"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-neutral-900 border border-neutral-800 text-sm text-white px-3 py-2.5 focus:border-neutral-600 transition-colors"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-white text-[#0a0a0a] text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
