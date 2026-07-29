import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Btn from '../components/Btn'
import Field, { Input, Textarea, Select } from '../components/Field'
import ImageUpload from '../components/ImageUpload'
import MultiImageUpload from '../components/MultiImageUpload'
import SeoPreview from '../components/SeoPreview'
import DraftBanner from '../components/DraftBanner'
import { useToast, ToastContainer } from '../components/Toast'
import { useUnsavedWarning } from '../hooks/useUnsavedWarning'
import { useDraftAutosave } from '../hooks/useDraftAutosave'

const EMPTY = {
  title: '', category: '', filter: '', shortDescription: '', description: '',
  coverImage: '', galleryImages: [], client: '', year: '', type: '',
  services: [], isFeatured: false, isPublished: false, order: 0,
  seoTitle: '', seoDesc: '',
}

const FILTER_GROUPS = [
  {
    label: 'Architecture',
    options: [
      'Architectural Layouts & Spatial Programming',
      'Renovations & Transformations',
      'Facades & Exterior 3D Designs',
    ],
  },
  {
    label: 'Residential',
    options: [
      'Lounges & Family Rooms',
      'Master Bedrooms & Suites',
      "Kids' Bedrooms & Nurseries",
      'Luxury Bathrooms & Powder Rooms',
      'Terraces & Verandas',
      'Islamic Luxury Interiors',
      'Gym',
      'Steam & Sauna',
    ],
  },
  {
    label: 'Commercial',
    options: [
      'Corporate Offices & Workspaces',
      'Beauty Salons, Wellness & Retail',
    ],
  },
  {
    label: 'Outdoor',
    options: [
      'Fences, Gates & Compound Seating',
    ],
  },
]

export default function ProjectForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { show } = useToast()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [servicesInput, setServicesInput] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  useUnsavedWarning(isDirty)

  // Draft autosave — only for new projects (no id)
  const draftKey = id ? null : 'project-new-draft'
  const { hasDraft, restoreDraft, clearDraft } = useDraftAutosave(draftKey, { form, servicesInput }, isDirty)
  const [draftSavedAt, setDraftSavedAt] = useState(() => {
    if (id) return null
    try {
      const raw = localStorage.getItem('project-new-draft')
      return raw ? JSON.parse(raw).savedAt : null
    } catch { return null }
  })

  useEffect(() => {
    if (!id) return
    api.get(`/projects/${id}`)
      .then(d => {
        setForm(d.data)
        setServicesInput((d.data.services || []).join(', '))
      })
      .catch(e => show(e.message, 'error'))
  }, [id])

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setIsDirty(true) }

  const validate = () => {
    const e = {}
    if (!form.title.trim())            e.title = 'Required'
    if (!form.category.trim())         e.category = 'Required'
    if (!form.filter.trim())           e.filter = 'Required'
    if (!form.shortDescription.trim()) e.shortDescription = 'Required'
    if (!form.description.trim())      e.description = 'Required'
    if (!form.coverImage.trim())       e.coverImage = 'Cover image is required'
    if (!form.year.trim())             e.year = 'Required'
    if (!form.type.trim())             e.type = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const payload = {
      ...form,
      services: servicesInput.split(',').map(s => s.trim()).filter(Boolean),
    }
    try {
      if (id) {
        await api.put(`/projects/${id}`, payload)
        show('Project updated')
      } else {
        await api.post('/projects', payload)
        show('Project created')
      }
      clearDraft()
      navigate('/projects')
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
        title={id ? 'Edit Project' : 'New Project'}
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => navigate('/projects')}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
          </div>
        }
      />
      {!id && draftSavedAt && (
        <DraftBanner
          savedAt={draftSavedAt}
          onRestore={() => {
            const d = restoreDraft()
            if (d) { setForm(d.form); setServicesInput(d.servicesInput || '') }
            setDraftSavedAt(null)
          }}
          onDiscard={() => { clearDraft(); setDraftSavedAt(null) }}
        />
      )}
      <form onSubmit={handleSubmit} className="p-8 max-w-3xl space-y-6">

        {/* Basic info */}
        <div className="grid grid-cols-2 gap-5">
          <Field label="Title" required error={errors.title}>
            <Input value={form.title} onChange={e => set('title', e.target.value)} error={errors.title} placeholder="Grand Lobby" />
          </Field>
          <Field label="Year" required error={errors.year}>
            <Input value={form.year} onChange={e => set('year', e.target.value)} error={errors.year} placeholder="2024" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Category" required error={errors.filter}>
            <select
              value={form.filter}
              onChange={e => { set('filter', e.target.value); set('category', e.target.value) }}
              className={`w-full bg-[#0a0a0a] border px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500 transition-colors
                ${errors.filter ? 'border-red-500' : 'border-neutral-800'}`}
            >
              <option value="">Select category…</option>
              {FILTER_GROUPS.map(group => (
                <optgroup key={group.label} label={`── ${group.label} ──`}>
                  {group.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Type" required error={errors.type}>
            <Input value={form.type} onChange={e => set('type', e.target.value)} error={errors.type} placeholder="Residential / Commercial" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Client">
            <Input value={form.client || ''} onChange={e => set('client', e.target.value)} placeholder="Client name" />
          </Field>
        </div>

        <Field label="Short Description" required error={errors.shortDescription}>
          <div className="relative">
            <Textarea value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} error={errors.shortDescription} rows={2} placeholder="One-line summary shown in cards" />
            {form.description && !form.shortDescription && (
              <button
                type="button"
                onClick={() => {
                  // Strip HTML tags (in case description has any), then take first sentence
                  const plain = form.description.replace(/<[^>]*>/g, '').trim()
                  const match = plain.match(/^.+?[.!?](?:\s|$)/)
                  const sentence = match ? match[0].trim() : plain.slice(0, 160).trim()
                  set('shortDescription', sentence)
                }}
                className="mt-1.5 text-[10px] text-neutral-500 hover:text-white transition-colors flex items-center gap-1"
              >
                <span>↑</span> Auto-generate from description
              </button>
            )}
            {form.shortDescription && (
              <p className={`text-[10px] mt-1 ${form.shortDescription.length > 160 ? 'text-yellow-500' : 'text-neutral-700'}`}>
                {form.shortDescription.length}/160 chars
              </p>
            )}
          </div>
        </Field>

        <Field label="Full Description" required error={errors.description}>
          <Textarea value={form.description} onChange={e => set('description', e.target.value)} error={errors.description} rows={5} placeholder="Detailed project description…" />
        </Field>

        {/* Cover image upload */}
        <div>
          <ImageUpload
            label="Cover Image"
            required
            value={form.coverImage}
            onChange={v => set('coverImage', v)}
          />
          {errors.coverImage && <p className="mt-1 text-xs text-red-500">{errors.coverImage}</p>}
        </div>

        {/* Gallery images upload */}
        <MultiImageUpload
          label="Gallery Images"
          value={form.galleryImages || []}
          onChange={v => set('galleryImages', v)}
          max={10}
        />

        <Field label="Services (comma-separated)">
          <Input value={servicesInput} onChange={e => setServicesInput(e.target.value)} placeholder="Architecture, Interior, Finishing" />
        </Field>

        {/* SEO section */}
        <div className="border-t border-neutral-900 pt-5 space-y-4">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest">SEO</p>
          <Field label="SEO Title">
            <Input
              value={form.seoTitle || ''}
              onChange={e => set('seoTitle', e.target.value)}
              placeholder={form.title || 'Page title for search engines'}
            />
            <p className={`text-[10px] mt-1 ${(form.seoTitle || form.title).length > 60 ? 'text-yellow-500' : 'text-neutral-700'}`}>
              {(form.seoTitle || form.title).length}/60 chars
            </p>
          </Field>
          <Field label="Meta Description">
            <Textarea
              value={form.seoDesc || ''}
              onChange={e => set('seoDesc', e.target.value)}
              rows={2}
              placeholder={form.shortDescription || '150-character description for search results'}
            />
          </Field>
          <SeoPreview
            title={form.seoTitle || form.title}
            description={form.seoDesc || form.shortDescription}
            slug={form.slug || ''}
            section="projects"
          />
        </div>

        <div className="flex items-center gap-6 pt-2">
          <Field label="Display Order">
            <Input type="number" value={form.order} onChange={e => set('order', parseInt(e.target.value) || 0)} min="0" className="w-24" />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer mt-5">
            <input type="checkbox" checked={form.isPublished} onChange={e => set('isPublished', e.target.checked)} className="accent-white" />
            <span className="text-xs text-neutral-400">Published</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer mt-5">
            <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} className="accent-white" />
            <span className="text-xs text-neutral-400">Featured</span>
          </label>
        </div>

      </form>
      <ToastContainer />
    </div>
  )
}
