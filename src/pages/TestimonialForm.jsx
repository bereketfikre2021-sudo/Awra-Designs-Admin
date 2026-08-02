import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Btn from '../components/Btn'
import Field, { Input, Textarea } from '../components/Field'
import ImageUpload from '../components/ImageUpload'
import { useToast, ToastContainer } from '../components/Toast'
import { useUnsavedWarning } from '../hooks/useUnsavedWarning'

const EMPTY = {
  clientName: '', position: '', company: '', text: '',
  imageUrl: '', rating: '', isFeatured: false, isPublished: false, order: 0,
}

export default function TestimonialForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { show } = useToast()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  useUnsavedWarning(isDirty)

  useEffect(() => {
    if (!id) return
    api.get(`/testimonials/${id}`)
      .then(d => setForm(d.data))
      .catch(e => show(e.message, 'error'))
  }, [id])

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setIsDirty(true) }

  const validate = () => {
    const e = {}
    if (!form.clientName.trim()) e.clientName = 'Required'
    if (!form.position.trim())   e.position   = 'Required'
    if (!form.text.trim())       e.text        = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      if (id) {
        await api.put(`/testimonials/${id}`, form)
        show('Testimonial updated')
      } else {
        await api.post('/testimonials', form)
        show('Testimonial created')
      }
      navigate('/testimonials')
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
        title={id ? 'Edit Testimonial' : 'New Testimonial'}
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => navigate('/testimonials')}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
          </div>
        }
      />
      <form onSubmit={handleSubmit} className="p-8 max-w-2xl space-y-5">

        <div className="grid grid-cols-2 gap-5">
          <Field label="Client Name" required error={errors.clientName}>
            <Input value={form.clientName} onChange={e => set('clientName', e.target.value)} error={errors.clientName} placeholder="Alemu Bekele" />
          </Field>
          <Field label="Position" required error={errors.position}>
            <Input value={form.position} onChange={e => set('position', e.target.value)} error={errors.position} placeholder="Business Owner" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Company">
            <Input value={form.company || ''} onChange={e => set('company', e.target.value)} placeholder="Company name (optional)" />
          </Field>
          <Field label="Rating (1–5)">
            <Input
              type="number" min="1" max="5"
              value={form.rating || ''}
              onChange={e => set('rating', e.target.value ? parseInt(e.target.value) : '')}
              placeholder="5"
            />
          </Field>
        </div>

        <Field label="Testimonial Text" required error={errors.text}>
          <Textarea value={form.text} onChange={e => set('text', e.target.value)} error={errors.text} rows={5} placeholder="Their work exceeded every expectation…" />
        </Field>

        {/* Client photo upload */}
        <ImageUpload
          label="Client Photo"
          variant="avatar"
          value={form.imageUrl || ''}
          onChange={v => set('imageUrl', v)}
        />

        <div className="flex items-center gap-6 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublished} onChange={e => set('isPublished', e.target.checked)} className="accent-white" />
            <span className="text-xs text-neutral-400">Published</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} className="accent-white" />
            <span className="text-xs text-neutral-400">Featured</span>
          </label>
          <Field label="Order">
            <Input type="number" value={form.order} onChange={e => set('order', parseInt(e.target.value) || 0)} min="0" className="w-20" />
          </Field>
        </div>

      </form>
      <ToastContainer />
    </div>
  )
}
