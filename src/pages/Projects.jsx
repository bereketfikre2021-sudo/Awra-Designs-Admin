import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Btn from '../components/Btn'
import SortableRow from '../components/SortableRow'
import { useToast, ToastContainer } from '../components/Toast'
import { timeAgo } from '../lib/timeAgo'

const FRONTEND = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'

const GROUPS = [
  { id: 'All', label: 'All', cats: [] },
  {
    id: 'Architecture', label: 'Architecture',
    cats: [
      'Architectural Layouts & Spatial Programming',
      'Renovations & Transformations',
      'Facades & Exterior 3D Designs',
    ],
  },
  {
    id: 'Residential', label: 'Residential',
    cats: [
      'Lounges & Family Rooms', 'Master Bedrooms & Suites',
      "Kids' Bedrooms & Nurseries", 'Luxury Bathrooms & Powder Rooms',
      'Terraces & Verandas', 'Islamic Luxury Interiors',
    ],
  },
  {
    id: 'Commercial', label: 'Commercial',
    cats: ['Corporate Offices & Workspaces', 'Beauty Salons, Wellness & Retail'],
  },
  { id: 'Outdoor', label: 'Outdoor', cats: ['Fences, Gates & Compound Seating'] },
]

// ── Mobile action sheet ───────────────────────────────────────────────────────
function ActionSheet({ project, onClose, onTogglePublish, onToggleFeatured, onDuplicate, onDelete }) {
  if (!project) return null
  return (
    <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />
      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-[#111] border-t border-neutral-800 rounded-t-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-neutral-700 rounded-full" />
        </div>

        {/* Project info */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-neutral-900">
          {project.coverImage && (
            <div className="w-12 h-9 bg-neutral-900 overflow-hidden flex-shrink-0">
              <img src={project.coverImage} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{project.title}</p>
            <p className="text-[10px] text-neutral-500 truncate">{project.category}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="py-2">
          <Link to={`/projects/${project.id}`} onClick={onClose}
            className="flex items-center gap-3 px-5 py-3.5 text-sm text-white hover:bg-neutral-900 transition-colors w-full text-left">
            <span className="w-5 text-center text-base">✏️</span> Edit Project
          </Link>

          <button onClick={() => { onTogglePublish(); onClose() }}
            className="flex items-center gap-3 px-5 py-3.5 text-sm w-full text-left hover:bg-neutral-900 transition-colors">
            <span className="w-5 text-center">{project.isPublished ? '🔴' : '🟢'}</span>
            <span className={project.isPublished ? 'text-neutral-400' : 'text-green-400'}>
              {project.isPublished ? 'Unpublish' : 'Publish'}
            </span>
          </button>

          <button onClick={() => { onToggleFeatured(); onClose() }}
            className="flex items-center gap-3 px-5 py-3.5 text-sm w-full text-left hover:bg-neutral-900 transition-colors">
            <span className="w-5 text-center">{project.isFeatured ? '⭐' : '☆'}</span>
            <span className="text-neutral-300">
              {project.isFeatured ? 'Remove Featured' : 'Mark as Featured'}
            </span>
          </button>

          <button onClick={() => { onDuplicate(); onClose() }}
            className="flex items-center gap-3 px-5 py-3.5 text-sm text-neutral-300 w-full text-left hover:bg-neutral-900 transition-colors">
            <span className="w-5 text-center">📋</span> Duplicate
          </button>

          {project.isPublished && (
            <a href={`${FRONTEND}/#works`} target="_blank" rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center gap-3 px-5 py-3.5 text-sm text-neutral-300 w-full text-left hover:bg-neutral-900 transition-colors">
              <span className="w-5 text-center">↗</span> View on site
            </a>
          )}

          <button onClick={() => { onDelete(); onClose() }}
            className="flex items-center gap-3 px-5 py-3.5 text-sm text-red-400 w-full text-left hover:bg-neutral-900 transition-colors">
            <span className="w-5 text-center">🗑</span> Delete
          </button>
        </div>

        <div className="pb-safe px-5 pb-6 pt-2">
          <button onClick={onClose}
            className="w-full py-3 border border-neutral-800 text-sm text-neutral-400 hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeGroup, setActiveGroup] = useState('All')
  const [activeSub, setActiveSub] = useState(null)
  const [reordering, setReordering] = useState(false)
  const [sheetProject, setSheetProject] = useState(null)
  const { show } = useToast()
  const navigate = useNavigate()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const load = () => {
    setLoading(true)
    api.get('/projects/admin/all')
      .then(d => setProjects(d.data))
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const currentGroup = GROUPS.find(g => g.id === activeGroup)
  const filtered = useMemo(() => {
    if (activeGroup === 'All') return projects
    if (activeSub) return projects.filter(p => p.category === activeSub || p.filter === activeSub)
    return projects.filter(p => currentGroup.cats.includes(p.category) || currentGroup.cats.includes(p.filter))
  }, [projects, activeGroup, activeSub])

  const handleGroup = id => { setActiveGroup(id); setActiveSub(null) }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = filtered.findIndex(p => p.id === active.id)
    const newIdx  = filtered.findIndex(p => p.id === over.id)
    const reordered = arrayMove(filtered, oldIdx, newIdx)
    setProjects(prev => {
      const map = Object.fromEntries(reordered.map((p, i) => [p.id, i]))
      return prev.map(p => map[p.id] !== undefined ? { ...p, order: map[p.id] } : p)
    })
    setReordering(true)
    try {
      await Promise.all(reordered.map((p, idx) => api.patch(`/projects/${p.id}`, { order: idx })))
      show('Order saved')
    } catch (e) { show(e.message, 'error') } finally { setReordering(false) }
  }

  const toggle = async (id, field, value) => {
    try {
      await api.patch(`/projects/${id}`, { [field]: value })
      setProjects(ps => ps.map(p => p.id === id ? { ...p, [field]: value } : p))
      show('Updated')
    } catch (e) { show(e.message, 'error') }
  }

  const remove = async (id) => {
    if (!confirm('Delete this project?')) return
    try {
      await api.delete(`/projects/${id}`)
      setProjects(ps => ps.filter(p => p.id !== id))
      show('Deleted')
    } catch (e) { show(e.message, 'error') }
  }

  const duplicate = async (id) => {
    try {
      const src = projects.find(p => p.id === id)
      if (!src) return
      const payload = { ...src, title: `${src.title} (Copy)`, isPublished: false, isFeatured: false, order: projects.length }
      delete payload.id; delete payload.slug; delete payload.createdAt; delete payload.updatedAt
      const d = await api.post('/projects', payload)
      setProjects(ps => [...ps, d.data])
      show('Duplicated')
    } catch (e) { show(e.message, 'error') }
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${filtered.length} of ${projects.length}${reordering ? ' · saving…' : ''}`}
        action={<Link to="/projects/new"><Btn>+ New</Btn></Link>}
      />

      {/* Group tabs */}
      <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide border-b border-neutral-900 px-4 md:px-8">
        {GROUPS.map(g => (
          <button key={g.id} onClick={() => handleGroup(g.id)}
            className={`relative flex-shrink-0 px-4 py-3 text-[10px] uppercase tracking-[0.18em] font-medium transition-colors whitespace-nowrap
              ${activeGroup === g.id ? 'text-white' : 'text-neutral-600 hover:text-neutral-300'}`}>
            {g.label}
            {activeGroup === g.id && <span className="absolute bottom-0 left-0 right-0 h-px bg-white" />}
          </button>
        ))}
      </div>

      {/* Sub chips */}
      {activeGroup !== 'All' && currentGroup?.cats.length > 0 && (
        <div className="flex items-center gap-2 px-4 md:px-8 py-2 overflow-x-auto scrollbar-hide border-b border-neutral-900">
          <button onClick={() => setActiveSub(null)}
            className={`flex-shrink-0 px-3 py-1 text-[10px] uppercase tracking-[0.14em] border transition-colors whitespace-nowrap
              ${!activeSub ? 'border-white text-white' : 'border-neutral-800 text-neutral-600 hover:border-neutral-600 hover:text-neutral-300'}`}>
            All {currentGroup.label}
          </button>
          {currentGroup.cats.map(cat => (
            <button key={cat} onClick={() => setActiveSub(prev => prev === cat ? null : cat)}
              className={`flex-shrink-0 px-3 py-1 text-[10px] uppercase tracking-[0.14em] border transition-colors whitespace-nowrap
                ${activeSub === cat ? 'border-white text-white' : 'border-neutral-800 text-neutral-600 hover:border-neutral-600 hover:text-neutral-300'}`}>
              {cat.split(' ').slice(0,3).join(' ')}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 md:p-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border border-neutral-700 border-t-white rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-neutral-600">
              {projects.length === 0
                ? <><span>No projects. </span><Link to="/projects/new" className="text-white underline">Create one</Link></>
                : 'No projects in this category.'}
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filtered.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-neutral-900">
                {filtered.map(p => (
                  <SortableRow key={p.id} id={p.id}>
                    {/* ── Mobile card (< md): tap → action sheet ── */}
                    <div
                      className="flex md:hidden items-center gap-3 py-3 cursor-pointer active:bg-neutral-900/50 transition-colors"
                      onClick={() => setSheetProject(p)}
                    >
                      <div className="w-12 h-9 flex-shrink-0 bg-neutral-900 overflow-hidden">
                        {p.coverImage
                          ? <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{p.title}</p>
                        <p className="text-[10px] text-neutral-600 truncate">{p.category}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 border ${p.isPublished ? 'border-green-900 text-green-500' : 'border-neutral-800 text-neutral-600'}`}>
                          {p.isPublished ? 'Live' : 'Draft'}
                        </span>
                        <svg className="w-3.5 h-3.5 text-neutral-600" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" d="M4 5h8M4 8h8M4 11h8" />
                        </svg>
                      </div>
                    </div>

                    {/* ── Desktop row (md+): inline actions ── */}
                    <div className="hidden md:flex items-center gap-4 py-4">
                      <div className="w-14 h-10 flex-shrink-0 bg-neutral-900 overflow-hidden">
                        {p.coverImage
                          ? <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-neutral-700 text-[9px]">–</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{p.title}</p>
                        <p className="text-[10px] text-neutral-600 mt-0.5">
                          {p.category} · {p.year} · edited {timeAgo(p.updatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => toggle(p.id, 'isPublished', !p.isPublished)}
                          className={`text-xs px-2 py-1 border transition-colors ${p.isPublished ? 'border-green-800 text-green-400 hover:border-green-600' : 'border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}>
                          {p.isPublished ? 'Published' : 'Draft'}
                        </button>
                        <button onClick={() => toggle(p.id, 'isFeatured', !p.isFeatured)}
                          className={`text-xs px-2 py-1 border transition-colors ${p.isFeatured ? 'border-yellow-800 text-yellow-400 hover:border-yellow-600' : 'border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}>
                          {p.isFeatured ? '★ Featured' : '☆ Feature'}
                        </button>
                        <Link to={`/projects/${p.id}`}><Btn variant="secondary">Edit</Btn></Link>
                        <Btn variant="ghost" onClick={() => duplicate(p.id)}>Duplicate</Btn>
                        {p.isPublished && (
                          <a href={`${FRONTEND}/#works`} target="_blank" rel="noopener noreferrer">
                            <Btn variant="ghost">View ↗</Btn>
                          </a>
                        )}
                        <Btn variant="danger" onClick={() => remove(p.id)}>Delete</Btn>
                      </div>
                    </div>
                  </SortableRow>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Mobile action sheet */}
      <ActionSheet
        project={sheetProject}
        onClose={() => setSheetProject(null)}
        onTogglePublish={() => sheetProject && toggle(sheetProject.id, 'isPublished', !sheetProject.isPublished)}
        onToggleFeatured={() => sheetProject && toggle(sheetProject.id, 'isFeatured', !sheetProject.isFeatured)}
        onDuplicate={() => sheetProject && duplicate(sheetProject.id)}
        onDelete={() => sheetProject && remove(sheetProject.id)}
      />

      <ToastContainer />
    </div>
  )
}
