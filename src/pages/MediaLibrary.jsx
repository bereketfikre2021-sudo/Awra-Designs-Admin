import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Btn from '../components/Btn'
import { useToast, ToastContainer } from '../components/Toast'

const API = import.meta.env.VITE_API_URL || '/api'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaLibrary() {
  const [media, setMedia]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(new Set())   // publicIds
  const [focused, setFocused]     = useState(null)        // single image for detail view
  const [deleting, setDeleting]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied]       = useState(null)
  const lastClickIdx              = useRef(null)
  const { show } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    api.get('/upload/media')
      .then(d => setMedia(d.data))
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleOne = (img, idx, e) => {
    // Shift-click → range select
    if (e.shiftKey && lastClickIdx.current !== null) {
      const lo = Math.min(lastClickIdx.current, idx)
      const hi = Math.max(lastClickIdx.current, idx)
      setSelected(s => {
        const n = new Set(s)
        media.slice(lo, hi + 1).forEach(m => n.add(m.publicId))
        return n
      })
      lastClickIdx.current = idx
      return
    }
    lastClickIdx.current = idx
    setSelected(s => {
      const n = new Set(s)
      n.has(img.publicId) ? n.delete(img.publicId) : n.add(img.publicId)
      return n
    })
    setFocused(img)
  }

  const selectAll   = () => setSelected(new Set(media.map(m => m.publicId)))
  const clearSelect = () => { setSelected(new Set()); setFocused(null) }

  // ── Copy ──────────────────────────────────────────────────────────────────
  const copy = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  // ── Delete (single or bulk) ───────────────────────────────────────────────
  const deleteItems = async (publicIds) => {
    if (!confirm(`Delete ${publicIds.length} image(s) from Cloudinary? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await Promise.all(publicIds.map(id => api.delete('/upload/media', { publicId: id })))
      setMedia(m => m.filter(i => !publicIds.includes(i.publicId)))
      setSelected(s => { const n = new Set(s); publicIds.forEach(id => n.delete(id)); return n })
      if (focused && publicIds.includes(focused.publicId)) setFocused(null)
      show(`${publicIds.length} image(s) deleted`)
    } catch (e) { show(e.message, 'error') }
    finally { setDeleting(false) }
  }

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
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
      show(`${data.data.urls.length} image(s) uploaded`)
      load()
    } catch (e) { show(e.message, 'error') }
    finally { setUploading(false); e.target.value = '' }
  }

  const selCount = selected.size

  return (
    <div>
      <PageHeader
        title="Media Library"
        subtitle={`${media.length} images`}
        action={
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-colors">
              {uploading ? 'Uploading…' : '+ Upload'}
            </span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        }
      />

      {/* ── Top action bar — shown when anything is selected ── */}
      {selCount > 0 && (
        <div className="sticky top-0 z-40 flex items-center gap-3 px-4 md:px-8 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs">
          <span className="text-white font-medium">{selCount} selected</span>

          {/* Copy URL — only when exactly one is selected */}
          {selCount === 1 && focused && (
            <button onClick={() => copy(focused.url)}
              className="px-3 py-1.5 border border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors">
              {copied === focused.url ? '✓ Copied' : 'Copy URL'}
            </button>
          )}

          {/* Open — only when exactly one */}
          {selCount === 1 && focused && (
            <a href={focused.url} target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 border border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors">
              Open ↗
            </a>
          )}

          {/* Select all */}
          <button onClick={selectAll}
            className="px-3 py-1.5 border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors">
            Select all ({media.length})
          </button>

          {/* Bulk delete */}
          <button onClick={() => deleteItems([...selected])} disabled={deleting}
            className="px-3 py-1.5 border border-red-900 text-red-400 hover:border-red-600 transition-colors disabled:opacity-40">
            {deleting ? 'Deleting…' : `Delete (${selCount})`}
          </button>

          <button onClick={clearSelect} className="ml-auto text-neutral-600 hover:text-white transition-colors">
            ✕ Clear
          </button>
        </div>
      )}

      {/* ── Single image detail bar — shown just below actions when one is focused ── */}
      {selCount === 1 && focused && (
        <div className="flex items-center gap-4 px-4 md:px-8 py-3 border-b border-neutral-900 bg-[#0d0d0d]">
          <div className="w-10 h-10 flex-shrink-0 bg-neutral-900 overflow-hidden border border-neutral-800">
            <img src={focused.url} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-[10px] text-neutral-400 font-mono truncate">{focused.url}</p>
            <p className="text-[10px] text-neutral-700">
              {focused.format?.toUpperCase()} · {focused.width} × {focused.height} · {formatBytes(focused.bytes)} · {new Date(focused.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border border-neutral-700 border-t-white rounded-full animate-spin" />
        </div>
      ) : media.length === 0 ? (
        <p className="text-sm text-neutral-600 text-center py-20">No images uploaded yet.</p>
      ) : (
        <div className="p-4 md:p-8">

          {/* Select all hint when nothing selected */}
          {selCount === 0 && (
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-neutral-700">Click to select · Shift+click for range</p>
              <button onClick={selectAll} className="text-[10px] text-neutral-600 hover:text-white transition-colors">
                Select all
              </button>
            </div>
          )}

          {/* ── Image grid ── */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-1">
            {media.map((img, idx) => {
              const isSelected = selected.has(img.publicId)
              const isFocused  = focused?.publicId === img.publicId
              return (
                <button
                  key={img.publicId}
                  onClick={e => toggleOne(img, idx, e)}
                  className={`relative aspect-square overflow-hidden border-2 transition-all group ${
                    isSelected ? 'border-white' : 'border-transparent hover:border-neutral-500'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover bg-neutral-900" loading="lazy" />

                  {/* Checkbox overlay */}
                  <div className={`absolute top-1.5 left-1.5 w-4 h-4 rounded-sm border flex items-center justify-center transition-all
                    ${isSelected
                      ? 'bg-white border-white'
                      : 'bg-black/40 border-neutral-500 opacity-0 group-hover:opacity-100'
                    }`}>
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {/* Focus ring indicator */}
                  {isFocused && !isSelected && (
                    <div className="absolute inset-0 ring-2 ring-inset ring-neutral-400 pointer-events-none" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}
