import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Btn from '../components/Btn'
import Field, { Input, Textarea } from '../components/Field'
import MultiImageUpload from '../components/MultiImageUpload'
import { useToast, ToastContainer } from '../components/Toast'
import { useUnsavedWarning } from '../hooks/useUnsavedWarning'

const API = import.meta.env.VITE_API_URL || '/api'

// Portrait photo uploader for team members
function MemberPhotoUpload({ value, name, onChange }) {
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
    } catch (e) { setError(e.message) }
    finally { setUploading(false) }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5">Member Photo</label>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { if (e.target.files?.[0]) upload(e.target.files[0]); e.target.value = '' }} />

      {/* Portrait preview box — 3:4 aspect, fixed width */}
      <div
        className="relative w-32 cursor-pointer group border border-neutral-800 bg-neutral-900 overflow-hidden"
        style={{ aspectRatio: '3/4' }}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.[0]) upload(e.dataTransfer.files[0]) }}
      >
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border border-neutral-600 border-t-white rounded-full animate-spin" />
          </div>
        ) : value ? (
          <>
            <img src={value} alt={name || 'Member'} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <span className="text-white text-[11px] font-medium">Replace</span>
              <button type="button"
                onClick={e => { e.stopPropagation(); onChange('') }}
                className="text-red-400 text-[11px] hover:text-red-300">Remove</button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-neutral-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px]">Upload photo</span>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

const FALLBACK_TEAM = [
  { name: 'Tesfahun Tsegaye', nameAm: 'ተስፋሁን ፀጋዬ', role: 'Founder & Lead Architect', roleAm: 'መስራች እና ዋና አርክቴክት', imageUrl: '/images/The Team/Tesfahun Tsegaye.webp', order: 0 },
  { name: 'Sarah Bekele',     nameAm: 'ሣራ በቀለ',     role: 'Lead Interior Designer',  roleAm: 'ዋና ኢንቴሪየር ዲዛይነር',   imageUrl: '/images/The Team/Sarah Bekele.webp',  order: 1 },
  { name: 'Daniel Haile',     nameAm: 'ዳንኤል ሃይሌ',   role: 'Senior Architect',         roleAm: 'ሲኒየር አርክቴክት',         imageUrl: '/images/The Team/Daniel Haile.webp',  order: 2 },
  { name: 'Bereket Fikre',    nameAm: 'በረከት ፍቅሬ',   role: 'Brand Designer',           roleAm: 'ብራንድ ዲዛይነር',          imageUrl: '/images/The Team/Bereket Fikre.webp', order: 3 },
]

const EMPTY_MEMBER = { name: '', nameAm: '', role: '', roleAm: '', imageUrl: '', order: 0 }

export default function About() {
  const { show } = useToast()
  const [aboutId, setAboutId] = useState(null)
  const [form, setForm] = useState({
    headline1: '', headline2: '', tagline: '',
    mission: '', vision: '', slideImages: [],
  })
  const [members, setMembers] = useState([])
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  useUnsavedWarning(isDirty)

  useEffect(() => {
    api.get('/about/admin/all')
      .then(d => {
        const active = d.data.find(a => a.isActive) || d.data[0]
        if (active) {
          setAboutId(active.id)
          setForm({
            headline1: active.headline1 || '',
            headline2: active.headline2 || '',
            tagline:   active.tagline   || '',
            mission:   active.mission   || '',
            vision:    active.vision    || '',
            slideImages: active.slideImages || [],
          })
          // If DB has no team members, pre-populate with the hardcoded fallback
          // so the admin can see, edit and save them properly
          setMembers(
            active.teamMembers?.length > 0
              ? active.teamMembers
              : FALLBACK_TEAM
          )
        }
      })
      .catch(e => show(e.message, 'error'))
  }, [])

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setIsDirty(true) }
  const setMember = (i, k, v) => { setMembers(ms => ms.map((m, idx) => idx === i ? { ...m, [k]: v } : m)); setIsDirty(true) }
  const addMember = () => { setMembers(ms => [...ms, { ...EMPTY_MEMBER, order: ms.length }]); setIsDirty(true) }
  const removeMember = (i) => { setMembers(ms => ms.filter((_, idx) => idx !== i)); setIsDirty(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, teamMembers: members }
    try {
      if (aboutId) {
        await api.put(`/about/${aboutId}`, payload)
      } else {
        await api.post('/about', payload)
      }
      show('About section saved')
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setSaving(false)
      setIsDirty(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="About Section"
        subtitle="Manage the About page content"
        action={<Btn onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Btn>}
      />
      <form onSubmit={handleSubmit} className="p-8 max-w-3xl space-y-5">

        <div className="grid grid-cols-2 gap-5">
          <Field label="Headline" required className="col-span-2">
            <Textarea
              value={`${form.headline1}${form.headline2 ? '\n' + form.headline2 : ''}`}
              onChange={e => {
                const lines = e.target.value.split('\n')
                set('headline1', lines[0] || '')
                set('headline2', lines[1] ?? '')
              }}
              rows={2}
              placeholder={"We design spaces\nthat outlast trends."}
            />
          </Field>
        </div>

        <Field label="Tagline / Introduction" required>
          <Textarea value={form.tagline} onChange={e => set('tagline', e.target.value)} rows={3} placeholder="At Awra Designs, we create…" />
        </Field>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Mission">
            <Textarea value={form.mission || ''} onChange={e => set('mission', e.target.value)} rows={3} placeholder="Our mission…" />
          </Field>
          <Field label="Vision">
            <Textarea value={form.vision || ''} onChange={e => set('vision', e.target.value)} rows={3} placeholder="Our vision…" />
          </Field>
        </div>

        {/* About section slide images */}
        <MultiImageUpload
          label="About Section Images (Slideshow)"
          value={form.slideImages || []}
          onChange={v => set('slideImages', v)}
          max={10}
        />

        {/* Team Members */}
        <div className="border-t border-neutral-900 pt-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Team Members</p>
            <Btn variant="secondary" onClick={addMember} type="button">+ Add Member</Btn>
          </div>

          <div className="space-y-4">
            {members.map((m, i) => (
              <div key={i} className="p-4 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Member {i + 1}</span>
                  <Btn variant="danger" type="button" onClick={() => removeMember(i)}>Remove</Btn>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name (EN)">
                    <Input value={m.name} onChange={e => setMember(i, 'name', e.target.value)} placeholder="Tesfahun Tsegaye" />
                  </Field>
                  <Field label="Name (AM)">
                    <Input value={m.nameAm || ''} onChange={e => setMember(i, 'nameAm', e.target.value)} placeholder="ተስፋሁን ፀጋዬ" />
                  </Field>
                  <Field label="Role (EN)">
                    <Input value={m.role} onChange={e => setMember(i, 'role', e.target.value)} placeholder="Lead Architect" />
                  </Field>
                  <Field label="Role (AM)">
                    <Input value={m.roleAm || ''} onChange={e => setMember(i, 'roleAm', e.target.value)} placeholder="ዋና አርክቴክት" />
                  </Field>
                </div>

                {/* Member photo — portrait aspect ratio preview */}
                <MemberPhotoUpload
                  value={m.imageUrl || ''}
                  name={m.name}
                  onChange={v => setMember(i, 'imageUrl', v)}
                />

                <Field label="Display Order">
                  <Input type="number" value={m.order} onChange={e => setMember(i, 'order', parseInt(e.target.value) || 0)} min="0" className="w-24" />
                </Field>
              </div>
            ))}

            {members.length === 0 && (
              <p className="text-xs text-neutral-600 text-center py-6 border border-dashed border-neutral-800">
                No team members yet. Click "+ Add Member" to add one.
              </p>
            )}
          </div>
        </div>

      </form>
      <ToastContainer />
    </div>
  )
}
