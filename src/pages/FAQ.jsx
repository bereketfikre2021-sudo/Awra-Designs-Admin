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
    <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute bottom-0 left-0 right-0 bg-[#111] border-t border-neutral-800 rounded-t-xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
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
        <div className="px-5 pb-8 pt-2">
          <button onClick={onClose} className="w-full py-3 border border-neutral-800 text-sm text-neutral-400 hover:text-white transition-colors">Cancel</button>
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

      <div className="p-4 md:p-8">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-5 h-5 border border-neutral-700 border-t-white rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-neutral-600 text-center py-20">
            No FAQ items yet. <button onClick={openNew} className="text-white underline">Add one</button>
          </p>
        ) : (
          <div className="divide-y divide-neutral-900">
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

                {/* Desktop: inline */}
                <div className="hidden md:flex items-start gap-4 py-5">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-[10px] text-neutral-600 border border-neutral-800 mt-0.5">{item.order}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white leading-snug">{item.question}</p>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{item.answer}</p>
                    {item.category && (
                      <span className="inline-block mt-2 text-[10px] uppercase tracking-widest text-neutral-600 border border-neutral-800 px-2 py-0.5">{item.category}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => togglePublish(item.id, !item.isPublished)}
                      className={`text-xs px-2 py-1 border transition-colors ${item.isPublished ? 'border-green-800 text-green-400' : 'border-neutral-800 text-neutral-500'}`}>
                      {item.isPublished ? 'Published' : 'Draft'}
                    </button>
                    <Btn variant="secondary" onClick={() => openEdit(item)}>Edit</Btn>
                    <Btn variant="danger" onClick={() => remove(item.id)}>Delete</Btn>
                  </div>
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
