import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Btn from '../components/Btn'
import Field, { Input, Textarea } from '../components/Field'
import ImageUpload from '../components/ImageUpload'
import SeoPreview from '../components/SeoPreview'
import DraftBanner from '../components/DraftBanner'
import RichTextEditor from '../components/RichTextEditor'
import { useToast, ToastContainer } from '../components/Toast'
import { useUnsavedWarning } from '../hooks/useUnsavedWarning'
import { useDraftAutosave } from '../hooks/useDraftAutosave'

const EMPTY = {
  title: '', excerpt: '', content: '', coverImage: '', category: '',
  tags: [], author: 'Awra Designs', readTime: '',
  isPublished: false, seoTitle: '', seoDesc: '', ogImage: '',
}

export default function BlogForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { show } = useToast()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [tagsInput, setTagsInput] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  useUnsavedWarning(isDirty)

  const draftKey = id ? null : 'blog-new-draft'
  const { restoreDraft, clearDraft } = useDraftAutosave(draftKey, { form, tagsInput }, isDirty)
  const [draftSavedAt, setDraftSavedAt] = useState(() => {
    if (id) return null
    try {
      const raw = localStorage.getItem('blog-new-draft')
      return raw ? JSON.parse(raw).savedAt : null
    } catch { return null }
  })

  useEffect(() => {
    if (!id) return
    api.get(`/blog/${id}`)
      .then(d => {
        setForm(d.data)
        setTagsInput((d.data.tags || []).join(', '))
      })
      .catch(e => show(e.message, 'error'))
  }, [id])

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setIsDirty(true) }

  const validate = () => {
    const e = {}
    if (!form.title.trim())    e.title    = 'Required'
    if (!form.excerpt.trim())  e.excerpt  = 'Required'
    // content is HTML — check it's not empty or just an empty paragraph
    const contentText = form.content.replace(/<[^>]*>/g, '').trim()
    if (!contentText)          e.content  = 'Required'
    if (!form.category.trim()) e.category = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const payload = {
      ...form,
      tags: tagsInput.split(',').map(s => s.trim()).filter(Boolean),
    }
    try {
      if (id) {
        await api.put(`/blog/${id}`, payload)
        show('Post updated')
      } else {
        await api.post('/blog', payload)
        show('Post created')
      }
      clearDraft()
      navigate('/blog')
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
        title={id ? 'Edit Post' : 'New Post'}
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => navigate('/blog')}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
          </div>
        }
      />
      {!id && draftSavedAt && (
        <DraftBanner
          savedAt={draftSavedAt}
          onRestore={() => {
            const d = restoreDraft()
            if (d) { setForm(d.form); setTagsInput(d.tagsInput || '') }
            setDraftSavedAt(null)
          }}
          onDiscard={() => { clearDraft(); setDraftSavedAt(null) }}
        />
      )}
      <form onSubmit={handleSubmit} className="p-8 max-w-3xl space-y-5">

        <Field label="Title" required error={errors.title}>
          <Input value={form.title} onChange={e => set('title', e.target.value)} error={errors.title} placeholder="Top Interior Design Trends for 2026" />
        </Field>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Category" required error={errors.category}>
            <Input value={form.category} onChange={e => set('category', e.target.value)} error={errors.category} placeholder="Interior Design" />
          </Field>
          <Field label="Read Time">
            <Input value={form.readTime || ''} onChange={e => set('readTime', e.target.value)} placeholder="5 min read" />
          </Field>
        </div>

        <Field label="Excerpt" required error={errors.excerpt}>
          <Textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} error={errors.excerpt} rows={2} placeholder="Short summary shown in the blog list…" />
        </Field>

        <Field label="Content" required error={errors.content}>
          <RichTextEditor
            value={form.content}
            onChange={v => set('content', v)}
            placeholder="Full article content…"
            error={errors.content}
          />
          {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content}</p>}
        </Field>

        {/* Cover image upload */}
        <ImageUpload
          label="Cover Image"
          value={form.coverImage || ''}
          onChange={v => set('coverImage', v)}
        />

        <div className="grid grid-cols-2 gap-5">
          <Field label="Author">
            <Input value={form.author || ''} onChange={e => set('author', e.target.value)} placeholder="Awra Designs" />
          </Field>
          <Field label="Tags (comma-separated)">
            <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="design, interior, tips" />
          </Field>
        </div>

        {/* SEO section */}
        <div className="border-t border-neutral-900 pt-5 space-y-4">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest">SEO</p>
          <Field label="SEO Title">
            <Input value={form.seoTitle || ''} onChange={e => set('seoTitle', e.target.value)} placeholder="Page title for search engines" />
          </Field>
          <Field label="Meta Description">
            <Textarea value={form.seoDesc || ''} onChange={e => set('seoDesc', e.target.value)} rows={2} placeholder="150-character description for search results" />
          </Field>
          {/* OG image upload */}
          <ImageUpload
            label="OG / Social Sharing Image"
            value={form.ogImage || ''}
            onChange={v => set('ogImage', v)}
          />
          {/* Live SEO preview */}
          <SeoPreview
            title={form.seoTitle || form.title}
            description={form.seoDesc || form.excerpt}
            slug={form.slug || ''}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer pt-2">
          <input type="checkbox" checked={form.isPublished} onChange={e => set('isPublished', e.target.checked)} className="accent-white" />
          <span className="text-xs text-neutral-400">Publish immediately</span>
        </label>

      </form>
      <ToastContainer />
    </div>
  )
}
