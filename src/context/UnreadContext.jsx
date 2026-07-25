import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

const UnreadContext = createContext({ unread: 0, refresh: () => {} })

export function UnreadProvider({ children }) {
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(() => {
    api.get('/admin/dashboard')
      .then(d => setUnread(d.data?.messages?.unread ?? 0))
      .catch(() => {})
  }, [])

  // Poll every 60 seconds
  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 60_000)
    return () => clearInterval(id)
  }, [refresh])

  return (
    <UnreadContext.Provider value={{ unread, refresh }}>
      {children}
    </UnreadContext.Provider>
  )
}

export const useUnread = () => useContext(UnreadContext)
