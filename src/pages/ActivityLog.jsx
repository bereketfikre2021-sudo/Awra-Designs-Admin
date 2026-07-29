import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import { timeAgo } from '../lib/timeAgo'

const ACTION_COLORS = {
  created:          'text-green-400',
  updated:          'text-blue-400',
  deleted:          'text-red-400',
  published:        'text-green-400',
  unpublished:      'text-yellow-400',
  featured:         'text-purple-400',
  unfeatured:       'text-neutral-400',
  replied:          'text-blue-400',
  archived:         'text-neutral-400',
  password_changed: 'text-yellow-400',
}

const ENTITY_LABELS = {
  project:         'Project',
  blog_post:       'Blog Post',
  testimonial:     'Testimonial',
  faq:             'FAQ',
  about:           'About',
  contact_message: 'Message',
  setting:         'Settings',
  project_group:   'Category',
  media:           'Media',
}

const FILTERS = ['all', 'project', 'blog_post', 'testimonial', 'contact_message', 'setting']

function formatAction(entry) {
  const entity = ENTITY_LABELS[entry.entity] || entry.entity
  const name   = entry.entityName ? `"${entry.entityName}"` : ''
  return `${entity} ${name} ${entry.action}`
}

export default function ActivityLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    const entity = filter === 'all' ? '' : `&entity=${filter}`
    api.get(`/admin/activity?page=${page}&limit=50${entity}`)
      .then(d => { setLogs(d.data); setPagination(d.pagination) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, filter])

  useEffect(load, [load])

  const handleFilter = (f) => { setFilter(f); setPage(1) }

  return (
    <div>
      <PageHeader
        title="Activity Log"
        subtitle={pagination ? `${pagination.total} entries` : ''}
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide border-b border-neutral-900 px-4 md:px-8">
        {FILTERS.map(f => (
          <button key={f} onClick={() => handleFilter(f)}
            className={`relative flex-shrink-0 px-4 py-3 text-[10px] uppercase tracking-[0.18em] font-medium transition-colors whitespace-nowrap
              ${filter === f ? 'text-white' : 'text-neutral-600 hover:text-neutral-300'}`}>
            {f === 'all' ? 'All' : ENTITY_LABELS[f] || f}
            {filter === f && <span className="absolute bottom-0 left-0 right-0 h-px bg-white" />}
          </button>
        ))}
      </div>

      <div className="p-4 md:p-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border border-neutral-700 border-t-white rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-neutral-600 text-center py-20">No activity yet.</p>
        ) : (
          <>
            <div className="divide-y divide-neutral-900">
              {logs.map(entry => (
                <div key={entry.id} className="flex items-start gap-4 py-3">
                  {/* Action badge */}
                  <span className={`flex-shrink-0 text-[10px] uppercase tracking-widest font-medium w-24 pt-0.5 ${ACTION_COLORS[entry.action] || 'text-neutral-400'}`}>
                    {entry.action}
                  </span>

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white">{formatAction(entry)}</p>
                    {entry.adminEmail && (
                      <p className="text-[10px] text-neutral-600 mt-0.5">by {entry.adminEmail}</p>
                    )}
                  </div>

                  {/* Time */}
                  <span className="flex-shrink-0 text-[10px] text-neutral-700">
                    {timeAgo(entry.createdAt)}
                  </span>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-900">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-xs text-neutral-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-[10px] text-neutral-600">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="text-xs text-neutral-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
