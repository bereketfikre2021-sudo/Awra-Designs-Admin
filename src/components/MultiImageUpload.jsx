import { useState, useRef } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { compressImage } from '../lib/compressImage'
import MediaPickerModal from './MediaPickerModal'

const API = import.meta.env.VITE_API_URL || '/api'

function SortableThumb({ url, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  return (
    <div ref={setNodeRef} style={style} className="relative group w-24 h-24 select-none">
      {/* drag area */}
      <div {...attributes} {...listeners} className="w-full h-full cursor-grab active:cursor-grabbing">
        <img src={url} alt="" className="w-full h-full object-cover border border-neutral-800" />
      </div>
      <button type="button" onClick={() => onRemove(index)}
        className="absolute top-1 right-1 w-5 h-5 bg-red-900/90 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        aria-label="Remove">×</button>
      <span className="absolute bottom-1 left-1 text-[9px] text-white bg-black/60 px-1">{index + 1}</span>
    </div>
  )
}

/**
 * Multi-image upload with drag-to-reorder preview.
 */
export default function MultiImageUpload({ value = [], onChange, label, max = 10 }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const inputRef = useRef(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const upload = async (files) => {
    setError('')
    setUploading(true)
    const token = localStorage.getItem('token')
    const form = new FormData()
    const compressed = await Promise.all(Array.from(files).map(f => compressImage(f)))
    compressed.forEach(f => form.append('images', f))
    try {
      const res = await fetch(`${API}/upload/multiple`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed')
      onChange([...value, ...data.data.urls].slice(0, max))
    } catch (e) { setError(e.message) } finally { setUploading(false) }
  }

  const remove = (idx) => onChange(value.filter((_, i) => i !== idx))

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = value.indexOf(active.id)
      const newIndex = value.indexOf(over.id)
      onChange(arrayMove(value, oldIndex, newIndex))
    }
  }

  const handleMediaSelect = (urls) => {
    // Merge, deduplicate, respect max
    const merged = [...new Set([...value, ...urls])].slice(0, max)
    onChange(merged)
  }

  return (
    <div>
      {label && <label className="block text-xs font-medium text-neutral-400 mb-1.5">{label}</label>}
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { if (e.target.files?.length) upload(e.target.files); e.target.value = '' }} />

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleMediaSelect}
        multi
        maxSelect={max - value.length > 0 ? max - value.length : 0}
      />

      {value.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={value} strategy={rectSortingStrategy}>
            <div className="flex flex-wrap gap-2 mb-3">
              {value.map((url, i) => (
                <SortableThumb key={url} url={url} index={i} onRemove={remove} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {value.length < max && (
        <div className="space-y-1.5">
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.length) upload(e.dataTransfer.files) }}
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-neutral-700 hover:border-neutral-500 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 py-8 bg-neutral-900/50"
          >
            {uploading ? (
              <div className="w-5 h-5 border border-neutral-600 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-xs text-neutral-500">Add images ({value.length}/{max}) · drag to reorder</p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 border border-neutral-800 hover:border-neutral-600 text-xs text-neutral-500 hover:text-white transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="1" width="4" height="4" rx="0.5"/>
              <rect x="7" y="1" width="4" height="4" rx="0.5"/>
              <rect x="1" y="7" width="4" height="4" rx="0.5"/>
              <rect x="7" y="7" width="4" height="4" rx="0.5"/>
            </svg>
            Browse from media library
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
