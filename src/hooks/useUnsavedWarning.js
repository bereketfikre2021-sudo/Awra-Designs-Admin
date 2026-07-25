import { useEffect } from 'react'

/**
 * Warns the user if they try to leave with unsaved changes.
 * Works with BrowserRouter (no useBlocker required).
 * @param {boolean} isDirty - true when the form has unsaved changes
 */
export function useUnsavedWarning(isDirty) {
  // Warn on browser tab close / refresh
  useEffect(() => {
    if (!isDirty) return
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])
}
