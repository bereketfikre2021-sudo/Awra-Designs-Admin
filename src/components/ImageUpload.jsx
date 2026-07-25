import { useState, useRef } from 'react'

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
 */
export default function ImageUpload({ value, onChange, alt, onAltChange, label, required }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const upload = async (file) => {
    setError('')
    setUploading(true)
    const token = localStorage.getItem('token')
    const form = new FormData()
    form.append('image', file)
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

      {value ? (
        <div className="space-y-2">
          <div className="relative group w-full">
            <img src={value} alt={alt || 'Preview'} className="w-full max-h-56 object-cover border border-neutral-800 bg-neutral-900" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button type="button" onClick={() => inputRef.current?.click()}
                className="px-3 py-1.5 bg-white text-[#0a0a0a] text-xs font-medium">
                Replace
              </button>
              <button type="button" onClick={clear}
                className="px-3 py-1.5 border border-white text-white text-xs font-medium">
                Remove
              </button>
            </div>
          </div>
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
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
