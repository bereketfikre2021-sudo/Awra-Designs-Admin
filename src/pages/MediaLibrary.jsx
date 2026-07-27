import { useState, useEffect, useCallback } from 'react'
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
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)  // { url, publicId }
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(null)
  const { show } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    api.get('/upload/media')
      .then(d => setMedia(d.data))
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const copy = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  const handleDelete = async () => {
    if (!selected) return
    if (!confirm('Delete this image from Cloudinary? This cannot be undone.')) return
    setDeleting(true)
    try {
      await api.delete('/upload/media', { publicId: selected.publicId })
      setMedia(m => m.filter(i => i.publicId !== selected.publicId))
      setSelected(null)
      show('Image deleted')
    } catch (e) { show(e.message, 'error') }
    finally { setDeleting(false) }
  }

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

  return (
    <div>
      <PageHeader
        title="Media Library"
        subtitle={`${media.length} images in Cloudinary`}
        action={
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-colors">
              {uploading ? 'Uploading…' : '+ Upload Images'}
            </span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border border-neutral-700 border-t-white rounded-full animate-spin" />
        </div>
      ) : media.length === 0 ? (
        <p className="text-sm text-neutral-600 text-center py-20">No images uploaded yet.</p>
      ) : (
        <div className="p-4 md:p-8">
          {/* Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-1">
            {media.map(img => (
              <button
                key={img.publicId}
                onClick={() => setSelected(selected?.publicId === img.publicId ? null : img)}
                className={`relative aspect-square overflow-hidden border-2 transition-all ${
                  selected?.publicId === img.publicId
                    ? 'border-white'
                    : 'border-transparent hover:border-neutral-600'
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover bg-neutral-900" loading="lazy" />
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="mt-6 border border-neutral-800 p-5 flex flex-col sm:flex-row gap-5 bg-[#111]">
              <div className="flex-shrink-0 w-32 aspect-square overflow-hidden bg-neutral-900 border border-neutral-800">
                <img src={selected.url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-3 min-w-0">
                <p className="text-xs text-neutral-400 font-mono break-all">{selected.url}</p>
                <div className="flex flex-wrap gap-4 text-[10px] text-neutral-600">
                  <span>{selected.format?.toUpperCase()}</span>
                  <span>{selected.width} × {selected.height}</span>
                  <span>{formatBytes(selected.bytes)}</span>
                  <span>{new Date(selected.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Btn variant="secondary" onClick={() => copy(selected.url)}>
                    {copied === selected.url ? '✓ Copied' : 'Copy URL'}
                  </Btn>
                  <a href={selected.url} target="_blank" rel="noopener noreferrer">
                    <Btn variant="secondary">Open ↗</Btn>
                  </a>
                  <Btn variant="danger" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting…' : 'Delete'}
                  </Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <ToastContainer />
    </div>
  )
}
