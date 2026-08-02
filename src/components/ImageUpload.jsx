import { useState, useRef } from 'react'
import { compressImage } from '../lib/compressImage'
import MediaPickerModal from './MediaPickerModal'

const API = import.meta.env.VITE_API_URL || '/api'

/**
 * Single image upload with preview + optional alt text field.
 * Props:
 *   value       — current image URL string
 *   onChange    — called with new URL string
 *   alt         — current alt text string (optional)
 *   onAltChange — called with new alt text (optional, enables alt field)
 *   label       — optional label text
 *   required    — shows * marker
 *   variant     — "default" (wide banner) | "avatar" (square portrait, for headshots)
 */
export default function ImageUpload({ value, onChange, alt, onAltChange, label, required, variant = 'default' }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const inputRef = useRef(null)

  const upload = async (file) => {
    setError('')
    setUploading(true)
    const token = localStorage.getItem('token')
    const form = new FormData()
    const compressed = await compressImage(file)
    form.append('image', compressed)
    try {
      const res = await fetch(`${API}/upload/single`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed')
      onChange(data.data.url)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  const clear = () => { onChange(''); if (onAltChange) onAltChange('') }

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-neutral-400 mb-1.5">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={url => { onChange(url); setPickerOpen(false) }}
      />

      {value ? (
        <div className="space-y-2">
          {variant === 'avatar' ? (
            /* ── Avatar/portrait preview — square card like team section ── */
            <div className="flex items-center gap-4">
              <div className="relative group w-20 h-20 flex-shrink-0">
                <img
                  src={value} alt={alt || 'Preview'}
                  className="w-20 h-20 rounded-full object-cover border border-neutral-800 bg-neutral-900"
                />
                <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={() => inputRef.current?.click()}
                    className="text-[10px] text-white underline underline-offset-2">
                    Change
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <button type="button" onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="text-xs border border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-white px-3 py-1.5 transition-colors disabled:opacity-40">
                  {uploading ? 'Uploading…' : 'Upload new'}
                </button>
                <button type="button" onClick={() => setPickerOpen(true)}
                  className="text-xs border border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-white px-3 py-1.5 transition-colors flex items-center gap-1.5">
                  <GridIcon /> Browse media
                </button>
                <button type="button" onClick={clear}
                  className="text-xs text-neutral-600 hover:text-red-400 transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            /* ── Default wide banner preview ── */
            <div className="relative group w-full">
              <img src={value} alt={alt || 'Preview'} className="w-full max-h-56 object-cover border border-neutral-800 bg-neutral-900" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button type="button" onClick={() => inputRef.current?.click()}
                  className="px-3 py-1.5 bg-white text-[#0a0a0a] text-xs font-medium">
                  Replace
                </button>
                <button type="button" onClick={() => setPickerOpen(true)}
                  className="px-3 py-1.5 border border-white text-white text-xs font-medium flex items-center gap-1.5">
                  <GridIcon /> Browse
                </button>
                <button type="button" onClick={clear}
                  className="px-3 py-1.5 border border-white/60 text-white/70 text-xs font-medium">
                  Remove
                </button>
              </div>
            </div>
          )}
          {onAltChange && (
            <input
              type="text"
              value={alt || ''}
              onChange={e => onAltChange(e.target.value)}
              placeholder="Alt text (describe the image for accessibility)"
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 px-3 py-1.5 focus:border-neutral-600 transition-colors placeholder-neutral-600"
            />
          )}
        </div>
      ) : (
        variant === 'avatar' ? (
          /* ── Avatar empty state ── */
          <div className="flex items-center gap-3">
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              className="w-20 h-20 rounded-full border-2 border-dashed border-neutral-700 hover:border-neutral-500 transition-colors cursor-pointer flex items-center justify-center bg-neutral-900/50"
            >
              {uploading
                ? <div className="w-5 h-5 border border-neutral-600 border-t-white rounded-full animate-spin" />
                : <svg className="w-6 h-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
              }
            </div>
            <div className="flex flex-col gap-1.5">
              <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
                className="text-xs border border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-white px-3 py-1.5 transition-colors disabled:opacity-40">
                Upload photo
              </button>
              <button type="button" onClick={() => setPickerOpen(true)}
                className="text-xs border border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-white px-3 py-1.5 transition-colors flex items-center gap-1.5">
                <GridIcon /> Browse media
              </button>
            </div>
          </div>
        ) : (
          /* ── Default empty state ── */
          <div>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className="w-full border border-dashed border-neutral-700 hover:border-neutral-500 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 py-10 bg-neutral-900/50"
            >
              {uploading ? (
                <div className="w-5 h-5 border border-neutral-600 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-6 h-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs text-neutral-500">Click or drag to upload</p>
                  <p className="text-[10px] text-neutral-700">JPG, PNG, WEBP — max 10 MB</p>
                </>
              )}
            </div>
            {/* Browse from media library */}
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2 border border-neutral-800 hover:border-neutral-600 text-xs text-neutral-500 hover:text-white transition-colors"
            >
              <GridIcon /> Browse from media library
            </button>
          </div>
        )
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function GridIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="4" height="4" rx="0.5"/>
      <rect x="7" y="1" width="4" height="4" rx="0.5"/>
      <rect x="1" y="7" width="4" height="4" rx="0.5"/>
      <rect x="7" y="7" width="4" height="4" rx="0.5"/>
    </svg>
  )
}
