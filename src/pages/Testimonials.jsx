import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Btn from '../components/Btn'
import SortableRow from '../components/SortableRow'
import { useToast, ToastContainer } from '../components/Toast'
import { EditIcon, TrashIcon, PublishIcon, UnpublishIcon, StarIcon } from '../components/Icons'

function ActionSheet({ item, onClose, onTogglePublish, onToggleFeatured, onDelete }) {
  if (!item) return null
  return (
    <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute bottom-0 left-0 right-0 bg-[#111] border-t border-neutral-800 rounded-t-xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-neutral-700 rounded-full" />
        </div>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-neutral-900">
          {item.imageUrl && (
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-neutral-900">
              <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{item.clientName}</p>
            <p className="text-[10px] text-neutral-500">{item.position}</p>
          </div>
        </div>
        <div className="py-1">
          <Link to={`/testimonials/${item.id}`} onClick={onClose}
            className="flex items-center gap-3 px-5 py-3.5 text-sm text-white hover:bg-neutral-900 transition-colors">
            <EditIcon /> Edit
          </Link>
          <button onClick={() => { onTogglePublish(); onClose() }}
            className="flex items-center gap-3 px-5 py-3.5 text-sm w-full text-left hover:bg-neutral-900 transition-colors">
            {item.isPublished ? <UnpublishIcon /> : <PublishIcon />}
            <span className={item.isPublished ? 'text-neutral-400' : 'text-green-400'}>
              {item.isPublished ? 'Unpublish' : 'Publish'}
            </span>
          </button>
          <button onClick={() => { onToggleFeatured(); onClose() }}
            className="flex items-center gap-3 px-5 py-3.5 text-sm w-full text-left hover:bg-neutral-900 transition-colors">
            <span className={item.isFeatured ? 'text-yellow-400' : 'text-neutral-400'}><StarIcon filled={item.isFeatured} /></span>
            <span className="text-neutral-300">{item.isFeatured ? 'Remove Featured' : 'Mark as Featured'}</span>
          </button>
          <button onClick={() => { onDelete(); onClose() }}
            className="flex items-center gap-3 px-5 py-3.5 text-sm text-red-400 w-full text-left hover:bg-neutral-900 transition-colors">
            <TrashIcon /> Delete
          </button>
        </div>
        <div className="px-5 pb-8 pt-2">
          <button onClick={onClose} className="w-full py-3 border border-neutral-800 text-sm text-neutral-400 hover:text-white transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function Testimonials() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sheetItem, setSheetItem] = useState(null)
  const { show } = useToast()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const load = () => {
    api.get('/testimonials/admin/all')
      .then(d => setItems(d.data))
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = items.findIndex(i => i.id === active.id)
    const newIdx  = items.findIndex(i => i.id === over.id)
    const reordered = arrayMove(items, oldIdx, newIdx)
    setItems(reordered)
    setSaving(true)
    try {
      await Promise.all(reordered.map((t, idx) => api.patch(`/testimonials/${t.id}`, { order: idx })))
      show('Order saved')
    } catch (e) { show(e.message, 'error') } finally { setSaving(false) }
  }

  const toggle = async (id, field, value) => {
    try {
      await api.patch(`/testimonials/${id}`, { [field]: value })
      setItems(ts => ts.map(t => t.id === id ? { ...t, [field]: value } : t))
      show('Updated')
    } catch (e) { show(e.message, 'error') }
  }

  const remove = async (id) => {
    if (!confirm('Delete this testimonial?')) return
    try {
      await api.delete(`/testimonials/${id}`)
      setItems(ts => ts.filter(t => t.id !== id))
      show('Deleted')
    } catch (e) { show(e.message, 'error') }
  }

  return (
    <div>
      <PageHeader
        title="Testimonials"
        subtitle={`${items.length} total${saving ? ' · saving…' : ''}`}
        action={<Link to="/testimonials/new"><Btn>+ New</Btn></Link>}
      />
      <div className="p-4 md:p-8">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-5 h-5 border border-neutral-700 border-t-white rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-neutral-600 text-center py-20">No testimonials yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-neutral-900">
                {items.map(t => (
                  <SortableRow key={t.id} id={t.id}>
                    {/* Mobile: tap to open sheet */}
                    <div className="flex md:hidden items-center gap-3 py-3 cursor-pointer active:bg-neutral-900/50"
                      onClick={() => setSheetItem(t)}>
                      {t.imageUrl && (
                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-neutral-900">
                          <img src={t.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{t.clientName}</p>
                        <p className="text-[10px] text-neutral-600 truncate">{t.position}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 border ${t.isPublished ? 'border-green-900 text-green-500' : 'border-neutral-800 text-neutral-600'}`}>
                          {t.isPublished ? 'Live' : 'Draft'}
                        </span>
                        {t.isFeatured && <span className="text-yellow-400"><StarIcon filled /></span>}
                        <svg className="w-3.5 h-3.5 text-neutral-600" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" d="M4 5h8M4 8h8M4 11h8" />
                        </svg>
                      </div>
                    </div>

                    {/* Desktop: inline actions */}
                    <div className="hidden md:flex items-start gap-4 py-5">
                      {t.imageUrl && (
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-neutral-900">
                          <img src={t.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{t.clientName}</p>
                        <p className="text-xs text-neutral-500">{t.position}{t.company ? ` · ${t.company}` : ''}</p>
                        <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{t.text}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => toggle(t.id, 'isPublished', !t.isPublished)}
                          className={`text-xs px-2 py-1 border transition-colors ${t.isPublished ? 'border-green-800 text-green-400' : 'border-neutral-800 text-neutral-500'}`}>
                          {t.isPublished ? 'Published' : 'Draft'}
                        </button>
                        <button onClick={() => toggle(t.id, 'isFeatured', !t.isFeatured)}
                          className={`flex items-center justify-center px-2 py-1 border transition-colors ${t.isFeatured ? 'border-yellow-800 text-yellow-400' : 'border-neutral-800 text-neutral-500'}`}>
                          <StarIcon filled={t.isFeatured} />
                        </button>
                        <Link to={`/testimonials/${t.id}`}><Btn variant="secondary">Edit</Btn></Link>
                        <Btn variant="danger" onClick={() => remove(t.id)}>Delete</Btn>
                      </div>
                    </div>
                  </SortableRow>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <ActionSheet
        item={sheetItem}
        onClose={() => setSheetItem(null)}
        onTogglePublish={() => sheetItem && toggle(sheetItem.id, 'isPublished', !sheetItem.isPublished)}
        onToggleFeatured={() => sheetItem && toggle(sheetItem.id, 'isFeatured', !sheetItem.isFeatured)}
        onDelete={() => sheetItem && remove(sheetItem.id)}
      />
      <ToastContainer />
    </div>
  )
}
