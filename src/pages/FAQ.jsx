import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Btn from '../components/Btn'
import Field, { Input, Textarea } from '../components/Field'
import { useToast, ToastContainer } from '../components/Toast'
import { EditIcon, TrashIcon, PublishIcon, UnpublishIcon } from '../components/Icons'

const EMPTY = { question: '', answer: '', category: '', order: 0, isPublished: true }

function ActionSheet({ item, onClose, onEdit, onTogglePublish, onDelete }) {
  if (!item) return null
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/4 md:left-1/2 md:-translate-x-1/2 md:w-72 bg-[#111] border border-neutral-800 md:rounded overflow-hidden shadow-2xl shadow-black/80"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-neutral-700 rounded-full" />
        </div>
        <div className="px-5 py-3 border-b border-neutral-900">
          <p className="text-sm font-medium text-white line-clamp-2">{item.question}</p>
          {item.category && <p className="text-[10px] text-neutral-500 mt-0.5">{item.category}</p>}
        </div>
        <div className="py-1">
          <button onClick={() => { onEdit(); onClose() }}
            className="flex items-center gap-3 px-5 py-3.5 text-sm text-white hover:bg-neutral-900 transition-colors w-full text-left">
            <EditIcon /> Edit
          </button>
          <button onClick={() => { onTogglePublish(); onClose() }}
            className="flex items-center gap-3 px-5 py-3.5 text-sm w-full text-left hover:bg-neutral-900 transition-colors">
            {item.isPublished ? <UnpublishIcon /> : <PublishIcon />}
            <span className={item.isPublished ? 'text-neutral-400' : 'text-green-400'}>
              {item.isPublished ? 'Hide from site' : 'Show on site'}
            </span>
          </button>
          <button onClick={() => { onDelete(); onClose() }}
            className="flex items-center gap-3 px-5 py-3.5 text-sm text-red-400 w-full text-left hover:bg-neutral-900 transition-colors">
            <TrashIcon /> Delete
          </button>
        </div>
        <div className="px-5 pb-5 pt-2 border-t border-neutral-900">
          <button onClick={onClose} className="w-full py-2.5 border border-neutral-800 text-sm text-neutral-400 hover:text-white transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  const { show } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [sheetItem, setSheetItem] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [bulkWorking, setBulkWorking] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/faq/admin/all')
      .then(d => setItems(d.data))
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openNew  = () => { setForm({ ...EMPTY, order: items.length }); setErrors({}); setEditing('new') }
  const openEdit = item => { setForm({ ...item }); setErrors({}); setEditing(item.id) }
  const cancel   = () => { setEditing(null); setErrors({}) }
  const set      = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.question.trim()) e.question = 'Required'
    if (!form.answer.trim())   e.answer   = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      if (editing === 'new') {
        const d = await api.post('/faq', form)
        setItems(prev => [...prev, d.data])
        show('FAQ item created')
      } else {
        const d = await api.put(`/faq/${editing}`, form)
        setItems(prev => prev.map(i => i.id === editing ? d.data : i))
        show('FAQ item updated')
      }
      setEditing(null)
    } catch (err) {
      show(err.message, 'error')
    } finally { setSaving(false) }
  }

  const togglePublish = async (id, isPublished) => {
    try {
      await api.patch(`/faq/${id}`, { isPublished })
      setItems(prev => prev.map(i => i.id === id ? { ...i, isPublished } : i))
      show('Updated')
    } catch (err) { show(err.message, 'error') }
  }

  const remove = async id => {
    if (!confirm('Delete this FAQ item?')) return
    try {
      await api.delete(`/faq/${id}`)
      setItems(prev => prev.filter(i => i.id !== id))
      show('Deleted')
    } catch (err) { show(err.message, 'error') }
  }

  // ── Bulk actions ─────────────────────────────────────────────────────────
  const toggleSelect = (id) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleSelectAll = () => {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map(i => i.id)))
  }
  const clearSelection = () => setSelected(new Set())

  const bulkPublish = async (value) => {
    setBulkWorking(true)
    try {
      await Promise.all([...selected].map(id => api.patch(`/faq/${id}`, { isPublished: value })))
      setItems(ps => ps.map(p => selected.has(p.id) ? { ...p, isPublished: value } : p))
      show(`${selected.size} item(s) ${value ? 'published' : 'unpublished'}`)
      clearSelection()
    } catch (e) { show(e.message, 'error') }
    finally { setBulkWorking(false) }
  }

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} item(s)? This cannot be undone.`)) return
    setBulkWorking(true)
    try {
      await Promise.all([...selected].map(id => api.delete(`/faq/${id}`)))
      setItems(ps => ps.filter(p => !selected.has(p.id)))
      show(`${selected.size} item(s) deleted`)
      clearSelection()
    } catch (e) { show(e.message, 'error') }
    finally { setBulkWorking(false) }
  }

  // ── Form view ─────────────────────────────────────────────────────────────
  if (editing !== null) {
    return (
      <div>
        <PageHeader
          title={editing === 'new' ? 'New FAQ Item' : 'Edit FAQ Item'}
          action={
            <div className="flex gap-2">
              <Btn variant="secondary" onClick={cancel}>Cancel</Btn>
              <Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
            </div>
          }
        />
        <form onSubmit={handleSave} className="p-4 md:p-8 max-w-2xl space-y-5">
          <Field label="Question" required error={errors.question}>
            <Textarea value={form.question} onChange={e => set('question', e.target.value)}
              error={errors.question} rows={2} placeholder="What services does Awra Designs offer?" />
          </Field>
          <Field label="Answer" required error={errors.answer}>
            <Textarea value={form.answer} onChange={e => set('answer', e.target.value)}
              error={errors.answer} rows={5} placeholder="We offer architecture, interior design…" />
          </Field>
          <div className="grid grid-cols-2 gap-5">
            <Field label="Category">
              <Input value={form.category || ''} onChange={e => set('category', e.target.value)} placeholder="General, Pricing…" />
            </Field>
            <Field label="Display Order">
              <Input type="number" min="0" value={form.order} onChange={e => set('order', parseInt(e.target.value) || 0)} />
            </Field>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublished} onChange={e => set('isPublished', e.target.checked)} className="accent-white" />
            <span className="text-xs text-neutral-400">Published (visible on website)</span>
          </label>
        </form>
        <ToastContainer />
      </div>
    )
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="FAQ" subtitle={`${items.length} items`}
        action={<Btn onClick={openNew}>+ New Question</Btn>} />

      {/* ── Bulk toolbar — only visible when items are selected ── */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-40 flex items-center gap-3 px-4 md:px-8 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs">
          <span className="text-white font-medium">{selected.size} selected</span>
          <button onClick={() => bulkPublish(true)}  disabled={bulkWorking} className="flex items-center gap-1.5 px-3 py-1.5 border border-green-800 text-green-400 hover:border-green-600 transition-colors disabled:opacity-40">
            <PublishIcon /> Publish
          </button>
          <button onClick={() => bulkPublish(false)} disabled={bulkWorking} className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors disabled:opacity-40">
            <UnpublishIcon /> Unpublish
          </button>
          <button onClick={bulkDelete}               disabled={bulkWorking} className="flex items-center gap-1.5 px-3 py-1.5 border border-red-900 text-red-400 hover:border-red-700 transition-colors disabled:opacity-40">
            <TrashIcon /> Delete
          </button>
          <button onClick={clearSelection} className="ml-auto text-neutral-600 hover:text-white transition-colors">✕ Clear</button>
        </div>
      )}

      <div className="p-4 md:p-8">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-5 h-5 border border-neutral-700 border-t-white rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-neutral-600 text-center py-20">
            No FAQ items yet. <button onClick={openNew} className="text-white underline">Add one</button>
          </p>
        ) : (
          <div className="divide-y divide-neutral-900">
            {/* Select-all header */}
            <div className="hidden md:flex items-center gap-4 px-1 py-2">
              <input type="checkbox"
                checked={items.length > 0 && selected.size === items.length}
                onChange={toggleSelectAll}
                className="accent-white w-3.5 h-3.5 flex-shrink-0 cursor-pointer"
                title="Select all"
              />
              <span className="text-[10px] text-neutral-600 uppercase tracking-widest">
                {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
              </span>
            </div>

            {items.map(item => (
              <div key={item.id}>
                {/* Mobile: tap → sheet */}
                <div className="flex md:hidden items-start gap-3 py-3 cursor-pointer active:bg-neutral-900/50"
                  onClick={() => setSheetItem(item)}>
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-[10px] text-neutral-600 border border-neutral-800 mt-0.5">{item.order}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white line-clamp-2">{item.question}</p>
                    {item.category && <span className="text-[10px] text-neutral-600">{item.category}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 border ${item.isPublished ? 'border-green-900 text-green-500' : 'border-neutral-800 text-neutral-600'}`}>
                      {item.isPublished ? 'Live' : 'Hidden'}
                    </span>
                    <svg className="w-3.5 h-3.5 text-neutral-600" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" d="M4 5h8M4 8h8M4 11h8" />
                    </svg>
                  </div>
                </div>

                {/* Desktop: clean row — status + ⋯ menu only */}
                <div className="hidden md:flex items-center gap-4 py-3.5">
                  <input type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    onClick={e => e.stopPropagation()}
                    className="accent-white w-3.5 h-3.5 flex-shrink-0 cursor-pointer"
                  />
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-[10px] text-neutral-600 border border-neutral-800">{item.order}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white leading-snug truncate">{item.question}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{item.answer}</p>
                    {item.category && (
                      <span className="inline-block mt-1 text-[10px] uppercase tracking-widest text-neutral-600 border border-neutral-800 px-2 py-0.5">{item.category}</span>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 border flex-shrink-0 ${item.isPublished ? 'border-green-900 text-green-400' : 'border-neutral-800 text-neutral-500'}`}>
                    {item.isPublished ? 'Published' : 'Hidden'}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); setSheetItem(item) }}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-white border border-transparent hover:border-neutral-700 transition-colors"
                    title="Actions"
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <circle cx="7.5" cy="3.5" r="0.8" fill="currentColor"/>
                      <circle cx="7.5" cy="7.5" r="0.8" fill="currentColor"/>
                      <circle cx="7.5" cy="11.5" r="0.8" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ActionSheet
        item={sheetItem}
        onClose={() => setSheetItem(null)}
        onEdit={() => sheetItem && openEdit(sheetItem)}
        onTogglePublish={() => sheetItem && togglePublish(sheetItem.id, !sheetItem.isPublished)}
        onDelete={() => sheetItem && remove(sheetItem.id)}
      />
      <ToastContainer />
    </div>
  )
}
