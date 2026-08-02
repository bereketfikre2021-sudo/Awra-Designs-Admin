import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

const API = import.meta.env.VITE_API_URL || '/api'

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Modal to browse the media library and pick image(s).
 *
 * Props:
 *   open        — boolean, controls visibility
 *   onClose     — called when user dismisses
 *   onSelect    — called with selected URL(s):
 *                   single mode  → onSelect(url: string)
 *                   multi mode   → onSelect(urls: string[])
 *   multi       — boolean, allow selecting multiple images (default false)
 *   maxSelect   — max number of images in multi mode (default unlimited)
 */
export default function MediaPickerModal({ open, onClose, onSelect, multi = false, maxSelect }) {
  const [media, setMedia]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState(new Set()) // publicIds
  const [hover, setHover]       = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]       = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.get('/upload/media')
      .then(d => setMedia(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (open) { setSelected(new Set()); setError(''); load() }
  }, [open, load])

  // ESC to close
  useEffect(() => {
    if (!open) return
    const fn = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [open, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const getUrl = (publicId) => media.find(m => m.publicId === publicId)?.url || ''

  const toggleSelect = (img) => {
    setSelected(s => {
      const n = new Set(s)
      if (n.has(img.publicId)) {
        n.delete(img.publicId)
      } else {
        if (!multi) {
          n.clear()
        } else if (maxSelect && n.size >= maxSelect) {
          return s // at limit
        }
        n.add(img.publicId)
      }
      return n
    })
  }

  const confirm = () => {
    if (selected.size === 0) return
    if (multi) {
      onSelect(media.filter(m => selected.has(m.publicId)).map(m => m.url))
    } else {
      onSelect(getUrl([...selected][0]))
    }
    onClose()
  }

  const handleUpload = async (e) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    setError('')
    const token = localStorage.getItem('token')
    const form = new FormData()
    Array.from(files).forEach(f => form.append('images', f))
    try {
      const res = await fetch(`${API}/upload/multiple`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const atLimit = multi && maxSelect && selected.size >= maxSelect

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-5xl mx-4 mt-12 mb-8 bg-[#0f0f0f] border border-neutral-800 flex flex-col"
        style={{ maxHeight: 'calc(100vh - 5rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-900 flex-shrink-0">
          <div>
            <p className="text-sm font-medium text-white">Media Library</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              {multi
                ? `Select images${maxSelect ? ` (up to ${maxSelect})` : ''} · ${selected.size} selected`
                : 'Click an image to select it'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Upload from here too */}
            <label className="cursor-pointer">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-700 text-xs text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? (
                  <><div className="w-3 h-3 border border-neutral-500 border-t-white rounded-full animate-spin" /> Uploading…</>
                ) : (
                  <>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4-4m0 0l-4 4m4-4v12"/>
                    </svg>
                    Upload new
                  </>
                )}
              </span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-white transition-colors" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M12 4L4 12M4 4l8 8"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-5 h-5 border border-neutral-700 border-t-white rounded-full animate-spin" />
            </div>
          ) : media.length === 0 ? (
            <p className="text-sm text-neutral-600 text-center py-16">No images yet. Upload one above.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
              {media.map(img => {
                const isSelected = selected.has(img.publicId)
                const isDisabled = !isSelected && !!atLimit
                return (
                  <button
                    key={img.publicId}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => toggleSelect(img)}
                    onMouseEnter={() => setHover(img.publicId)}
                    onMouseLeave={() => setHover(null)}
                    className={`relative aspect-square overflow-hidden border-2 transition-all group ${
                      isSelected
                        ? 'border-white'
                        : isDisabled
                          ? 'border-transparent opacity-30 cursor-not-allowed'
                          : 'border-transparent hover:border-neutral-400 cursor-pointer'
                    }`}
                    title={isDisabled ? `Max ${maxSelect} images` : img.url}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover bg-neutral-900" loading="lazy" />

                    {/* Checkbox */}
                    <div className={`absolute top-1 left-1 w-4 h-4 border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-white border-white'
                        : 'bg-black/40 border-neutral-400 opacity-0 group-hover:opacity-100'
                    }`}>
                      {isSelected && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5l2 2 4-4" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>

                    {/* Hover info */}
                    {hover === img.publicId && !isSelected && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1.5 py-1 pointer-events-none">
                        <p className="text-[9px] text-neutral-300 truncate">{formatBytes(img.bytes)}</p>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-900 flex-shrink-0">
          <p className="text-[10px] text-neutral-600">
            {media.length} image{media.length !== 1 ? 's' : ''} in library
          </p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-400 border border-neutral-800 hover:border-neutral-600 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={selected.size === 0}
              className="px-4 py-2 text-xs bg-white text-[#0a0a0a] font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {multi
                ? `Insert ${selected.size > 0 ? selected.size : ''} image${selected.size !== 1 ? 's' : ''}`
                : 'Select image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
