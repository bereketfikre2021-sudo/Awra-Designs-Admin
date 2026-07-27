import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Btn from '../components/Btn'
import { useToast, ToastContainer } from '../components/Toast'

function SubcategoryInput({ value, onChange }) {
  const [input, setInput] = useState('')

  const add = () => {
    const trimmed = input.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setInput('')
  }

  const remove = (cat) => onChange(value.filter(c => c !== cat))

  const onKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); add() }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Type subcategory and press Enter…"
          className="flex-1 bg-[#0a0a0a] border border-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
        />
        <Btn variant="secondary" onClick={add}>Add</Btn>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map(cat => (
          <span key={cat} className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
            {cat}
            <button onClick={() => remove(cat)} className="text-neutral-600 hover:text-white transition-colors" aria-label={`Remove ${cat}`}>
              ×
            </button>
          </span>
        ))}
        {value.length === 0 && <p className="text-xs text-neutral-700">No subcategories yet.</p>}
      </div>
    </div>
  )
}

function GroupCard({ group, onSave, onDelete }) {
  const [label, setLabel] = useState(group.label)
  const [subcategories, setSubcategories] = useState(group.subcategories || [])
  const [saving, setSaving] = useState(false)
  const dirty = label !== group.label || JSON.stringify(subcategories) !== JSON.stringify(group.subcategories)

  const save = async () => {
    if (!label.trim()) return
    setSaving(true)
    await onSave(group.id, { label: label.trim(), subcategories })
    setSaving(false)
  }

  return (
    <div className="border border-neutral-800 bg-[#111] p-5 space-y-4">
      <div className="flex items-center gap-3">
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Group label (e.g. Residential)"
          className="flex-1 bg-[#0a0a0a] border border-neutral-800 px-3 py-2 text-sm font-medium text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
        />
        <Btn variant="secondary" onClick={() => onDelete(group.id)}>Delete</Btn>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-500 mb-2">Subcategories</p>
        <SubcategoryInput value={subcategories} onChange={setSubcategories} />
      </div>

      {dirty && (
        <div className="flex justify-end">
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Btn>
        </div>
      )}
    </div>
  )
}

export default function Categories() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const { show } = useToast()

  const load = () => {
    setLoading(true)
    api.get('/project-groups/admin/all')
      .then(d => setGroups(d.data))
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleSave = async (id, data) => {
    try {
      await api.put(`/project-groups/${id}`, data)
      setGroups(gs => gs.map(g => g.id === id ? { ...g, ...data } : g))
      show('Group updated')
    } catch (e) { show(e.message, 'error') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this group? This will not affect existing projects.')) return
    try {
      await api.delete(`/project-groups/${id}`)
      setGroups(gs => gs.filter(g => g.id !== id))
      show('Group deleted')
    } catch (e) { show(e.message, 'error') }
  }

  const handleAdd = async () => {
    setAdding(true)
    try {
      const d = await api.post('/project-groups', {
        label: 'New Group',
        subcategories: [],
        order: groups.length,
      })
      setGroups(gs => [...gs, d.data])
      show('Group created')
    } catch (e) { show(e.message, 'error') }
    finally { setAdding(false) }
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Manage project groups and subcategories shown on the frontend"
        action={<Btn onClick={handleAdd} disabled={adding}>{adding ? 'Creating…' : '+ New Group'}</Btn>}
      />

      <div className="p-4 md:p-8 max-w-2xl space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border border-neutral-700 border-t-white rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <p className="text-sm text-neutral-600 py-10 text-center">No groups yet. Create one above.</p>
        ) : (
          groups.map(g => (
            <GroupCard key={g.id} group={g} onSave={handleSave} onDelete={handleDelete} />
          ))
        )}
      </div>

      <ToastContainer />
    </div>
  )
}
