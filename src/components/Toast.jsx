import { useState, useCallback } from 'react'

let _setToast = null

export function useToast() {
  const show = useCallback((message, type = 'success') => {
    if (_setToast) _setToast({ message, type, id: Date.now() })
  }, [])
  return { show }
}

export function ToastContainer() {
  const [toast, setToast] = useState(null)
  _setToast = (t) => {
    setToast(t)
    setTimeout(() => setToast(null), 3500)
  }

  if (!toast) return null
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`px-4 py-3 text-xs font-medium shadow-lg ${
        toast.type === 'error' ? 'bg-red-900 text-red-200 border border-red-700' : 'bg-neutral-800 text-white border border-neutral-700'
      }`}>
        {toast.message}
      </div>
    </div>
  )
}
