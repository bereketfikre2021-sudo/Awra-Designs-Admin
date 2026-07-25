import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Btn from '../components/Btn'
import Field, { Input, Textarea } from '../components/Field'
import ImageUpload from '../components/ImageUpload'
import { useToast, ToastContainer } from '../components/Toast'
import { useUnsavedWarning } from '../hooks/useUnsavedWarning'

const EMPTY_MEMBER = { name: '', nameAm: '', role: '', roleAm: '', imageUrl: '', order: 0 }

export default function About() {
  const { show } = useToast()
  const [aboutId, setAboutId] = useState(null)
  const [form, setForm] = useState({
    headline1: '', headline2: '', tagline: '',
    mission: '', vision: '', imageUrl: '',
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
            imageUrl:  active.imageUrl  || '',
          })
          setMembers(active.teamMembers || [])
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
          <Field label="Headline Line 1" required>
            <Input value={form.headline1} onChange={e => set('headline1', e.target.value)} placeholder="We design spaces" />
          </Field>
          <Field label="Headline Line 2" required>
            <Input value={form.headline2} onChange={e => set('headline2', e.target.value)} placeholder="that outlast trends." />
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

        {/* About section image */}
        <ImageUpload
          label="About Section Image"
          value={form.imageUrl || ''}
          onChange={v => set('imageUrl', v)}
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

                {/* Member photo upload */}
                <ImageUpload
                  label="Member Photo"
                  value={m.imageUrl || ''}
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
