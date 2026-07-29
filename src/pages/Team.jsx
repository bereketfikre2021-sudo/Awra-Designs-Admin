import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import Btn from '../components/Btn'
import Field, { Input } from '../components/Field'
import { useToast, ToastContainer } from '../components/Toast'

const API = import.meta.env.VITE_API_URL || '/api'

const ROLE_COLORS = {
  admin:  'text-white border-white/30',
  editor: 'text-neutral-400 border-neutral-700',
}

function Avatar({ src, name, size = 10 }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  return src
    ? <img src={src} alt={name} className={`w-${size} h-${size} rounded-full object-cover border border-neutral-800`} />
    : <div className={`w-${size} h-${size} rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-medium text-neutral-400`}>
        {initials}
      </div>
}

function AvatarUpload({ value, name, onChange }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const upload = async (file) => {
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
      if (data.success) onChange(data.data.url)
    } catch {}
    finally { setUploading(false) }
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar src={value} name={name} size={12} />
      <div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { if (e.target.files?.[0]) upload(e.target.files[0]); e.target.value = '' }} />
        <button type="button" onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-600 px-3 py-1.5 transition-colors disabled:opacity-40">
          {uploading ? 'Uploading…' : value ? 'Change photo' : 'Upload photo'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')}
            className="ml-2 text-xs text-neutral-600 hover:text-red-400 transition-colors">Remove</button>
        )}
      </div>
    </div>
  )
}

function MemberCard({ member, isSelf, isOnlyAdmin, onUpdate, onDelete }) {
  const [editing, setEditing]   = useState(false)
  const [name, setName]         = useState(member.name)
  const [role, setRole]         = useState(member.role)
  const [avatar, setAvatar]     = useState(member.avatar || '')
  const [saving, setSaving]     = useState(false)
  const { show } = useToast()

  const save = async () => {
    setSaving(true)
    try {
      const d = await api.put(`/admins/${member.id}`, { name, role, avatar })
      onUpdate(d.data)
      setEditing(false)
      show('Account updated')
    } catch (e) { show(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className="border border-neutral-800 bg-[#111] p-5">
      {editing ? (
        <div className="space-y-4">
          <AvatarUpload value={avatar} name={name} onChange={setAvatar} />
          <Field label="Name">
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
          </Field>
          <Field label="Role">
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500">
              <option value="editor">Editor — can manage content, cannot manage admins</option>
              <option value="admin">Admin — full access</option>
            </select>
          </Field>
          <div className="flex gap-2">
            <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
            <Btn variant="secondary" onClick={() => {
              setName(member.name); setRole(member.role); setAvatar(member.avatar || ''); setEditing(false)
            }}>Cancel</Btn>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar src={member.avatar} name={member.name} size={10} />
            <div>
              <p className="text-sm font-medium text-white">{member.name} {isSelf && <span className="text-[10px] text-neutral-500 ml-1">(you)</span>}</p>
              <p className="text-xs text-neutral-500">{member.email}</p>
              <span className={`inline-block mt-1 text-[10px] uppercase tracking-widest border px-1.5 py-0.5 ${ROLE_COLORS[member.role] || ROLE_COLORS.editor}`}>
                {member.role}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Btn variant="secondary" onClick={() => setEditing(true)}>Edit</Btn>
            {!isSelf && !(member.role === 'admin' && isOnlyAdmin) && (
              <Btn variant="danger" onClick={() => onDelete(member.id)}>Delete</Btn>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Team() {
  const { admin } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding]   = useState(false)
  const [newForm, setNewForm] = useState({ name: '', email: '', password: '', role: 'editor', avatar: '' })
  const [creating, setCreating] = useState(false)
  const { show } = useToast()

  useEffect(() => {
    api.get('/admins')
      .then(d => setMembers(d.data))
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleUpdate = (updated) => setMembers(ms => ms.map(m => m.id === updated.id ? updated : m))

  const handleDelete = async (id) => {
    if (!confirm('Delete this account?')) return
    try {
      await api.delete(`/admins/${id}`)
      setMembers(ms => ms.filter(m => m.id !== id))
      show('Account deleted')
    } catch (e) { show(e.message, 'error') }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const d = await api.post('/admins', newForm)
      setMembers(ms => [...ms, d.data])
      setNewForm({ name: '', email: '', password: '', role: 'editor', avatar: '' })
      setAdding(false)
      show('Account created')
    } catch (e) { show(e.message, 'error') }
    finally { setCreating(false) }
  }

  const adminCount  = members.filter(m => m.role === 'admin').length
  const isOnlyAdmin = adminCount === 1

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle={`${members.length} account${members.length !== 1 ? 's' : ''}`}
        action={
          admin?.role === 'admin'
            ? <Btn onClick={() => setAdding(a => !a)}>{adding ? 'Cancel' : '+ Add Account'}</Btn>
            : null
        }
      />

      {/* Add account form */}
      {adding && (
        <form onSubmit={handleCreate} className="mx-4 md:mx-8 mb-4 border border-neutral-800 bg-[#111] p-5 space-y-4">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest">New Account</p>
          <AvatarUpload value={newForm.avatar} name={newForm.name} onChange={v => setNewForm(f => ({ ...f, avatar: v }))} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name" required>
              <Input value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            </Field>
            <Field label="Email" required>
              <Input type="email" value={newForm.email} onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))} placeholder="email@awradesigns.com" />
            </Field>
            <Field label="Password" required>
              <Input type="password" value={newForm.password} onChange={e => setNewForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" />
            </Field>
            <Field label="Role">
              <select value={newForm.role} onChange={e => setNewForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500">
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
          </div>
          <div className="text-[11px] text-neutral-600 space-y-0.5">
            <p><span className="text-neutral-400">Admin</span> — full access including managing accounts, categories, settings</p>
            <p><span className="text-neutral-400">Editor</span> — can manage projects, blog, testimonials, FAQ, messages</p>
          </div>
          <Btn type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create Account'}</Btn>
        </form>
      )}

      <div className="p-4 md:p-8 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border border-neutral-700 border-t-white rounded-full animate-spin" />
          </div>
        ) : members.map(m => (
          <MemberCard
            key={m.id}
            member={m}
            isSelf={m.id === admin?.id}
            isOnlyAdmin={isOnlyAdmin}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <ToastContainer />
    </div>
  )
}
