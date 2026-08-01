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

const STATIC_GROUPS = [
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
      'Gym', 'Steam & Sauna',
    ],
  },
  {
    id: 'Commercial', label: 'Commercial',
    cats: ['Corporate Offices & Workspaces', 'Beauty Salons, Wellness & Retail'],
  },
  { id: 'Outdoor', label: 'Outdoor', cats: ['Fences, Gates & Compound Seating'] },
]

// ── SVG icons ─────────────────────────────────────────────────────────────────
const Icons = {
  Edit: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 2.5l2 2-7 7H3.5v-2l7-7z"/>
    </svg>
  ),
  Publish: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="7.5" r="5.5"/>
      <path d="M5 7.5l2 2 3-3"/>
    </svg>
  ),
  Unpublish: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="7.5" r="5.5"/>
      <path d="M5.5 5.5l4 4M9.5 5.5l-4 4"/>
    </svg>
  ),
  Star: ({ filled }) => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 1.5l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L1.7 5.7l4-.6 1.8-3.6z"/>
    </svg>
  ),
  Copy: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="7" height="8" rx="1"/>
      <path d="M10 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2"/>
    </svg>
  ),
  ExternalLink: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V9"/>
      <path d="M9 2h4v4M13 2L8 7"/>
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h11M5 4V2h5v2M6 7v5M9 7v5M3 4l1 9h7l1-9"/>
    </svg>
  ),
  Menu: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="7.5" cy="3.5" r="0.8" fill="currentColor"/>
      <circle cx="7.5" cy="7.5" r="0.8" fill="currentColor"/>
      <circle cx="7.5" cy="11.5" r="0.8" fill="currentColor"/>
    </svg>
  ),
}

// ── Action sheet (mobile + desktop ⋯ menu) ────────────────────────────────────
function ActionSheet({ project, onClose, onTogglePublish, onToggleFeatured, onDuplicate, onDelete }) {
  if (!project) return null
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/4 md:left-1/2 md:-translate-x-1/2 md:w-80 bg-[#111] border border-neutral-800 md:rounded overflow-hidden shadow-2xl shadow-black/80"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
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
        <div className="py-1">
          <Link to={`/projects/${project.id}`} onClick={onClose}
            className="flex items-center gap-3 px-5 py-3 text-sm text-white hover:bg-neutral-900 transition-colors w-full text-left">
            <Icons.Edit /> Edit Project
          </Link>

          <button onClick={() => { onTogglePublish(); onClose() }}
            className="flex items-center gap-3 px-5 py-3 text-sm w-full text-left hover:bg-neutral-900 transition-colors">
            {project.isPublished ? <Icons.Unpublish /> : <Icons.Publish />}
            <span className={project.isPublished ? 'text-neutral-400' : 'text-green-400'}>
              {project.isPublished ? 'Unpublish' : 'Publish'}
            </span>
          </button>

          <button onClick={() => { onToggleFeatured(); onClose() }}
            className="flex items-center gap-3 px-5 py-3 text-sm w-full text-left hover:bg-neutral-900 transition-colors">
            <span className={project.isFeatured ? 'text-yellow-400' : 'text-neutral-400'}><Icons.Star filled={project.isFeatured} /></span>
            <span className="text-neutral-300">{project.isFeatured ? 'Remove Featured' : 'Mark as Featured'}</span>
          </button>

          <button onClick={() => { onDuplicate(); onClose() }}
            className="flex items-center gap-3 px-5 py-3 text-sm text-neutral-300 w-full text-left hover:bg-neutral-900 transition-colors">
            <Icons.Copy /> Duplicate
          </button>

          {project.isPublished && (
            <a href={`${FRONTEND}/#works`} target="_blank" rel="noopener noreferrer" onClick={onClose}
              className="flex items-center gap-3 px-5 py-3 text-sm text-neutral-300 w-full text-left hover:bg-neutral-900 transition-colors">
              <Icons.ExternalLink /> View on site
            </a>
          )}

          <button onClick={() => { onDelete(); onClose() }}
            className="flex items-center gap-3 px-5 py-3 text-sm text-red-400 w-full text-left hover:bg-neutral-900 transition-colors">
            <Icons.Trash /> Delete
          </button>
        </div>

        <div className="px-5 pb-5 pt-2 border-t border-neutral-900">
          <button onClick={onClose}
            className="w-full py-2.5 border border-neutral-800 text-sm text-neutral-400 hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const [projects, setProjects]     = useState([])
  const [groups, setGroups]         = useState(STATIC_GROUPS)
  const [loading, setLoading]       = useState(true)
  const [activeGroup, setActiveGroup] = useState('All')
  const [activeSub, setActiveSub]   = useState(null)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [reordering, setReordering] = useState(false)
  const [sheetProject, setSheetProject] = useState(null)
  const [selected, setSelected]     = useState(new Set())
  const [bulkWorking, setBulkWorking] = useState(false)
  const { show } = useToast()
  const navigate = useNavigate()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/projects/admin/all'),
      api.get('/project-groups/admin/all').catch(() => ({ data: [] })),
    ])
      .then(([projRes, groupRes]) => {
        setProjects(projRes.data)
        if (groupRes.data?.length > 0) {
          const allGroup = { id: 'All', label: 'All', cats: [] }
          const apiGroups = groupRes.data.map(g => ({ id: g.label, label: g.label, cats: g.subcategories || [] }))
          setGroups([allGroup, ...apiGroups])
        }
      })
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const currentGroup = groups.find(g => g.id === activeGroup)
  const filtered = useMemo(() => {
    if (activeGroup === 'All') return projects
    if (activeSub) return projects.filter(p => p.category === activeSub || p.filter === activeSub)
    return projects.filter(p => currentGroup.cats.includes(p.category) || currentGroup.cats.includes(p.filter))
  }, [projects, activeGroup, activeSub, groups])

  const handleGroup = id => { setActiveGroup(id); setActiveSub(null); setOpenDropdown(null) }

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
    } catch (e) { show(e.message, 'error') }
    finally { setReordering(false) }
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

  // ── Bulk actions ─────────────────────────────────────────────────────────
  const toggleSelect = (id) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(p => p.id)))
  }
  const clearSelection = () => setSelected(new Set())

  const bulkPublish = async (value) => {
    setBulkWorking(true)
    try {
      await Promise.all([...selected].map(id => api.patch(`/projects/${id}`, { isPublished: value })))
      setProjects(ps => ps.map(p => selected.has(p.id) ? { ...p, isPublished: value } : p))
      show(`${selected.size} project(s) ${value ? 'published' : 'unpublished'}`)
      clearSelection()
    } catch (e) { show(e.message, 'error') }
    finally { setBulkWorking(false) }
  }

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} project(s)? This cannot be undone.`)) return
    setBulkWorking(true)
    try {
      await Promise.all([...selected].map(id => api.delete(`/projects/${id}`)))
      setProjects(ps => ps.filter(p => !selected.has(p.id)))
      show(`${selected.size} project(s) deleted`)
      clearSelection()
    } catch (e) { show(e.message, 'error') }
    finally { setBulkWorking(false) }
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${filtered.length} of ${projects.length}${reordering ? ' · saving…' : ''}`}
        action={<Link to="/projects/new"><Btn>+ New</Btn></Link>}
      />

      {/* ── Bulk toolbar — only visible when items are selected ── */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-40 flex items-center gap-3 px-4 md:px-8 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs">
          <span className="text-white font-medium">{selected.size} selected</span>
          <button onClick={() => bulkPublish(true)}  disabled={bulkWorking} className="flex items-center gap-1.5 px-3 py-1.5 border border-green-800 text-green-400 hover:border-green-600 transition-colors disabled:opacity-40">
            <Icons.Publish /> Publish
          </button>
          <button onClick={() => bulkPublish(false)} disabled={bulkWorking} className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors disabled:opacity-40">
            <Icons.Unpublish /> Unpublish
          </button>
          <button onClick={bulkDelete}               disabled={bulkWorking} className="flex items-center gap-1.5 px-3 py-1.5 border border-red-900 text-red-400 hover:border-red-700 transition-colors disabled:opacity-40">
            <Icons.Trash /> Delete
          </button>
          <button onClick={clearSelection} className="ml-auto text-neutral-600 hover:text-white transition-colors">✕ Clear</button>
        </div>
      )}

      {/* ── Group tabs ── */}
      <div className="border-b border-neutral-900 px-4 md:px-8">
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          {groups.map(g => (
            <div key={g.id} className="relative flex-shrink-0"
              onMouseEnter={() => g.cats.length > 0 && window.matchMedia('(hover: hover)').matches && setOpenDropdown(g.id)}
              onMouseLeave={() => window.matchMedia('(hover: hover)').matches && setOpenDropdown(null)}>
              <button
                onClick={() => {
                  if (g.cats.length > 0 && !window.matchMedia('(hover: hover)').matches) {
                    setOpenDropdown(prev => prev === g.id ? null : g.id)
                    setActiveGroup(g.id); setActiveSub(null)
                  } else { handleGroup(g.id) }
                }}
                className={`relative px-4 py-3 text-[11px] uppercase tracking-[0.18em] font-medium transition-colors whitespace-nowrap flex items-center gap-1
                  ${activeGroup === g.id ? 'text-white' : 'text-neutral-600 hover:text-neutral-300'}`}>
                {g.label}
                {g.cats.length > 0 && (
                  <svg className={`w-2 h-2 transition-transform duration-200 ${openDropdown === g.id ? 'rotate-180 opacity-80' : 'opacity-40'}`} viewBox="0 0 10 6" fill="none">
                    <path d="M1 1L5 5l4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {activeGroup === g.id && <span className="absolute bottom-0 left-0 right-0 h-px bg-white" />}
              </button>
              {g.cats.length > 0 && openDropdown === g.id && (
                <div className="absolute top-full right-0 mt-0 z-50">
                  <div className="bg-[#111111] border border-neutral-800 py-1 min-w-[200px] shadow-2xl shadow-black/80">
                    <button onClick={() => { handleGroup(g.id); setOpenDropdown(null) }}
                      className={`w-full text-left px-4 py-2.5 text-[10px] uppercase tracking-[0.12em] font-medium whitespace-nowrap transition-colors
                        ${activeGroup === g.id && !activeSub ? 'text-white bg-neutral-800/60' : 'text-neutral-500 hover:text-white hover:bg-neutral-800/40'}`}>
                      All {g.label}
                    </button>
                    {g.cats.map(cat => (
                      <button key={cat} onClick={() => { setActiveGroup(g.id); setActiveSub(cat); setOpenDropdown(null) }}
                        className={`w-full text-left px-4 py-2.5 text-[10px] uppercase tracking-[0.12em] font-medium whitespace-nowrap transition-colors
                          ${activeSub === cat ? 'text-white bg-neutral-800/60' : 'text-neutral-500 hover:text-white hover:bg-neutral-800/40'}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

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
                {/* Select-all header */}
                <div className="hidden md:flex items-center gap-4 px-1 py-2">
                  <input type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="accent-white w-3.5 h-3.5 flex-shrink-0 cursor-pointer"
                    title="Select all"
                  />
                  <span className="text-[10px] text-neutral-600 uppercase tracking-widest">
                    {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
                  </span>
                </div>

                {filtered.map(p => (
                  <SortableRow key={p.id} id={p.id}>

                    {/* ── Mobile: tap card → action sheet ── */}
                    <div className="flex md:hidden items-center gap-3 py-3 cursor-pointer active:bg-neutral-900/50 transition-colors"
                      onClick={() => setSheetProject(p)}>
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
                        <span className={`text-[10px] px-1.5 py-0.5 border ${
                          p.isPublished ? 'border-green-900 text-green-500' :
                          p.scheduledAt ? 'border-yellow-900 text-yellow-400' :
                          'border-neutral-800 text-neutral-600'}`}>
                          {p.isPublished ? 'Live' : p.scheduledAt ? 'Scheduled' : 'Draft'}
                        </span>
                        {/* Three-dot menu icon */}
                        <span className="text-neutral-600"><Icons.Menu /></span>
                      </div>
                    </div>

                    {/* ── Desktop: clean row, actions on checkbox select + ⋯ ── */}
                    <div className="hidden md:flex items-center gap-4 py-3.5">
                      <input type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        onClick={e => e.stopPropagation()}
                        className="accent-white w-3.5 h-3.5 flex-shrink-0 cursor-pointer"
                      />
                      <div className="w-14 h-10 flex-shrink-0 bg-neutral-900 overflow-hidden">
                        {p.coverImage
                          ? <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-neutral-700 text-[9px]">–</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{p.title}</p>
                        <p className="text-[10px] text-neutral-600 mt-0.5">
                          {p.category} · {p.year} · {timeAgo(p.updatedAt)}
                        </p>
                      </div>
                      {/* Status badge */}
                      <span className={`text-[10px] px-2 py-0.5 border flex-shrink-0 ${
                        p.isPublished ? 'border-green-900 text-green-400' :
                        p.scheduledAt ? 'border-yellow-900 text-yellow-400' :
                        'border-neutral-800 text-neutral-500'}`}>
                        {p.isPublished ? 'Published' :
                         p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString() :
                         'Draft'}
                      </span>
                      {p.isFeatured && (
                        <span className="text-yellow-400 flex-shrink-0" title="Featured"><Icons.Star filled /></span>
                      )}
                      {/* ⋯ menu button */}
                      <button
                        onClick={e => { e.stopPropagation(); setSheetProject(p) }}
                        className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-white border border-transparent hover:border-neutral-700 transition-colors"
                        title="Actions"
                      >
                        <Icons.Menu />
                      </button>
                    </div>

                  </SortableRow>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Action sheet — shared between mobile tap and desktop ⋯ */}
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
