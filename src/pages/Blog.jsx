import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Btn from '../components/Btn'
import { useToast, ToastContainer } from '../components/Toast'
import { timeAgo } from '../lib/timeAgo'
import { EditIcon, TrashIcon, CopyIcon, ExternalLinkIcon, PublishIcon, UnpublishIcon, CloseIcon } from '../components/Icons'

const FRONTEND = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'

function ActionSheet({ post, onClose, onTogglePublish, onDuplicate, onDelete }) {
  if (!post) return null
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/4 md:left-1/2 md:-translate-x-1/2 md:w-80 bg-[#111] border border-neutral-800 md:rounded overflow-hidden shadow-2xl shadow-black/80"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-neutral-700 rounded-full" />
        </div>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-neutral-900">
          {post.coverImage && (
            <div className="w-12 h-9 flex-shrink-0 bg-neutral-900 overflow-hidden">
              <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{post.title}</p>
            <p className="text-[10px] text-neutral-500">{post.category}</p>
          </div>
        </div>
        <div className="py-1">
          <Link to={`/blog/${post.id}`} onClick={onClose}
            className="flex items-center gap-3 px-5 py-3.5 text-sm text-white hover:bg-neutral-900 transition-colors">
            <EditIcon /> Edit Post
          </Link>
          <button onClick={() => { onTogglePublish(); onClose() }}
            className="flex items-center gap-3 px-5 py-3.5 text-sm w-full text-left hover:bg-neutral-900 transition-colors">
            {post.isPublished ? <UnpublishIcon /> : <PublishIcon />}
            <span className={post.isPublished ? 'text-neutral-400' : 'text-green-400'}>
              {post.isPublished ? 'Unpublish' : 'Publish'}
            </span>
          </button>
          <button onClick={() => { onDuplicate(); onClose() }}
            className="flex items-center gap-3 px-5 py-3.5 text-sm text-neutral-300 w-full text-left hover:bg-neutral-900 transition-colors">
            <CopyIcon /> Duplicate
          </button>
          {post.isPublished && (
            <a href={`${FRONTEND}/#blog`} target="_blank" rel="noopener noreferrer" onClick={onClose}
              className="flex items-center gap-3 px-5 py-3.5 text-sm text-neutral-300 w-full text-left hover:bg-neutral-900 transition-colors">
              <ExternalLinkIcon /> View on site
            </a>
          )}
          <button onClick={() => { onDelete(); onClose() }}
            className="flex items-center gap-3 px-5 py-3.5 text-sm text-red-400 w-full text-left hover:bg-neutral-900 transition-colors">
            <TrashIcon /> Delete
          </button>
        </div>
        <div className="px-5 pb-5 pt-2 border-t border-neutral-900">
          <button onClick={onClose} className="w-full py-2.5 border border-neutral-800 text-sm text-neutral-400 hover:text-white transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sheetPost, setSheetPost] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [bulkWorking, setBulkWorking] = useState(false)
  const { show } = useToast()

  const load = (p = 1, q = search) => {
    setLoading(true)
    const qs = new URLSearchParams({ page: p, limit: 20 })
    if (q) qs.set('search', q)
    api.get(`/blog/admin/all?${qs}`)
      .then(d => { setPosts(d.data); setPagination(d.pagination) })
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load(page, search) }, [page, search])

  // clear selection when page or search changes
  useEffect(() => { setSelected(new Set()) }, [page, search])

  const handleSearch = e => { e.preventDefault(); setPage(1); setSearch(searchInput) }
  const clearSearch  = () => { setSearchInput(''); setSearch(''); setPage(1) }

  const toggle = async (id, isPublished) => {
    try {
      await api.patch(`/blog/${id}`, { isPublished })
      setPosts(ps => ps.map(p => p.id === id ? { ...p, isPublished } : p))
      show('Updated')
    } catch (e) { show(e.message, 'error') }
  }

  const remove = async (id) => {
    if (!confirm('Delete this post?')) return
    try {
      await api.delete(`/blog/${id}`)
      setPosts(ps => ps.filter(p => p.id !== id))
      show('Deleted')
    } catch (e) { show(e.message, 'error') }
  }

  const duplicate = async (id) => {
    try {
      const d = await api.get(`/blog/${id}`)
      const src = d.data
      const payload = { ...src, title: `${src.title} (Copy)`, isPublished: false, publishedAt: null }
      delete payload.id; delete payload.slug; delete payload.createdAt; delete payload.updatedAt
      const r = await api.post('/blog', payload)
      setPosts(ps => [r.data, ...ps])
      show('Duplicated')
    } catch (e) { show(e.message, 'error') }
  }

  // ── Bulk actions ─────────────────────────────────────────────────────────
  const toggleSelect = (id) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleSelectAll = () => {
    if (selected.size === posts.length) setSelected(new Set())
    else setSelected(new Set(posts.map(p => p.id)))
  }
  const clearSelection = () => setSelected(new Set())

  const bulkPublish = async (value) => {
    setBulkWorking(true)
    try {
      await Promise.all([...selected].map(id => api.patch(`/blog/${id}`, { isPublished: value })))
      setPosts(ps => ps.map(p => selected.has(p.id) ? { ...p, isPublished: value } : p))
      show(`${selected.size} item(s) ${value ? 'published' : 'unpublished'}`)
      clearSelection()
    } catch (e) { show(e.message, 'error') }
    finally { setBulkWorking(false) }
  }

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} item(s)? This cannot be undone.`)) return
    setBulkWorking(true)
    try {
      await Promise.all([...selected].map(id => api.delete(`/blog/${id}`)))
      setPosts(ps => ps.filter(p => !selected.has(p.id)))
      show(`${selected.size} item(s) deleted`)
      clearSelection()
    } catch (e) { show(e.message, 'error') }
    finally { setBulkWorking(false) }
  }

  return (
    <div>
      <PageHeader
        title="Blog"
        subtitle={pagination ? `${pagination.total} posts` : ''}
        action={<Link to="/blog/new"><Btn>+ New Post</Btn></Link>}
      />

      {/* ── Bulk toolbar — only visible when items are selected ── */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-40 flex items-center gap-3 px-4 md:px-8 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs">
          <span className="text-white font-medium">{selected.size} selected</span>
          <button onClick={() => bulkPublish(true)}  disabled={bulkWorking} className="flex items-center gap-1.5 px-3 py-1.5 border border-green-800 text-green-400 hover:border-green-600 transition-colors disabled:opacity-40">
            <PublishIcon /> Publish
          </button>
          <button onClick={() => bulkPublish(false)} disabled={bulkWorking} className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors disabled:opacity-40">
            <UnpublishIcon /> Unpublish
          </button>
          <button onClick={bulkDelete}               disabled={bulkWorking} className="flex items-center gap-1.5 px-3 py-1.5 border border-red-900 text-red-400 hover:border-red-700 transition-colors disabled:opacity-40">
            <TrashIcon /> Delete
          </button>
          <button onClick={clearSelection} className="ml-auto text-neutral-600 hover:text-white transition-colors">✕ Clear</button>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 md:px-8 py-3 border-b border-neutral-900">
        <div className="relative flex-1 max-w-xs">
          <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search posts…"
            className="w-full bg-neutral-900 border border-neutral-800 text-sm text-white px-3 py-1.5 pr-7 focus:border-neutral-600 transition-colors placeholder-neutral-600" />
          {searchInput && (
            <button type="button" onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"><CloseIcon /></button>
          )}
        </div>
        <Btn type="submit" variant="secondary">Search</Btn>
      </form>

      <div className="p-4 md:p-8">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-5 h-5 border border-neutral-700 border-t-white rounded-full animate-spin" /></div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-neutral-600 text-center py-20">
            {search ? `No posts matching "${search}"` : 'No blog posts yet.'}
          </p>
        ) : (
          <>
            <div className="divide-y divide-neutral-900">
              {/* Select-all header */}
              <div className="hidden md:flex items-center gap-4 px-1 py-2">
                <input type="checkbox"
                  checked={posts.length > 0 && selected.size === posts.length}
                  onChange={toggleSelectAll}
                  className="accent-white w-3.5 h-3.5 flex-shrink-0 cursor-pointer"
                  title="Select all"
                />
                <span className="text-[10px] text-neutral-600 uppercase tracking-widest">
                  {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
                </span>
              </div>

              {posts.map(p => (
                <div key={p.id}>
                  {/* Mobile: tap → sheet */}
                  <div className="flex md:hidden items-center gap-3 py-3 cursor-pointer active:bg-neutral-900/50"
                    onClick={() => setSheetPost(p)}>
                    {p.coverImage && (
                      <div className="w-12 h-9 flex-shrink-0 bg-neutral-900 overflow-hidden">
                        <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{p.title}</p>
                      <p className="text-[10px] text-neutral-600 truncate">{p.category} · {p.readTime || '—'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 border ${p.isPublished ? 'border-green-900 text-green-500' : 'border-neutral-800 text-neutral-600'}`}>
                        {p.isPublished ? 'Live' : 'Draft'}
                      </span>
                      <svg className="w-3.5 h-3.5 text-neutral-600" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" d="M4 5h8M4 8h8M4 11h8" />
                      </svg>
                    </div>
                  </div>

                  {/* Desktop: clean row — status + ⋯ menu only */}
                  <div className="hidden md:flex items-center gap-4 py-3.5">
                    <input type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      onClick={e => e.stopPropagation()}
                      className="accent-white w-3.5 h-3.5 flex-shrink-0 cursor-pointer"
                    />
                    {p.coverImage && (
                      <div className="w-14 h-10 flex-shrink-0 bg-neutral-900 overflow-hidden">
                        <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {p.category} · {p.readTime || '—'} · {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : 'Not published'} · edited {timeAgo(p.updatedAt)}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 border flex-shrink-0 ${p.isPublished ? 'border-green-900 text-green-400' : 'border-neutral-800 text-neutral-500'}`}>
                      {p.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); setSheetPost(p) }}
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-white border border-transparent hover:border-neutral-700 transition-colors"
                      title="Actions"
                    >
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <circle cx="7.5" cy="3.5" r="0.8" fill="currentColor"/>
                        <circle cx="7.5" cy="7.5" r="0.8" fill="currentColor"/>
                        <circle cx="7.5" cy="11.5" r="0.8" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-neutral-900">
                <Btn variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
                <span className="text-xs text-neutral-500">{page} / {pagination.pages}</span>
                <Btn variant="secondary" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</Btn>
              </div>
            )}
          </>
        )}
      </div>

      <ActionSheet
        post={sheetPost}
        onClose={() => setSheetPost(null)}
        onTogglePublish={() => sheetPost && toggle(sheetPost.id, !sheetPost.isPublished)}
        onDuplicate={() => sheetPost && duplicate(sheetPost.id)}
        onDelete={() => sheetPost && remove(sheetPost.id)}
      />
      <ToastContainer />
    </div>
  )
}
