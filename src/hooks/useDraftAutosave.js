import { useEffect, useRef } from 'react'

const INTERVAL = 30_000 // 30 seconds

/**
 * Autosaves `data` to localStorage under `key` every 30s when `isDirty` is true.
 * Returns { hasDraft, restoreDraft, clearDraft }.
 *
 * Usage:
 *   const { hasDraft, restoreDraft, clearDraft } = useDraftAutosave('project-draft', form, isDirty)
 */
export function useDraftAutosave(key, data, isDirty) {
  const timerRef = useRef(null)

  // Save every 30s while dirty
  useEffect(() => {
    if (!isDirty) return
    timerRef.current = setInterval(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() }))
      } catch {}
    }, INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [key, data, isDirty])

  const hasDraft = () => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return false
      const { savedAt } = JSON.parse(raw)
      // Drafts expire after 7 days
      return Date.now() - savedAt < 7 * 24 * 60 * 60 * 1000
    } catch { return false }
  }

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      return JSON.parse(raw).data
    } catch { return null }
  }

  const clearDraft = () => {
    try { localStorage.removeItem(key) } catch {}
  }

  return { hasDraft, restoreDraft, clearDraft }
}
