import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { timeAgo } from '../lib/timeAgo'
import PageHeader from '../components/PageHeader'
import BarChart from '../components/BarChart'

function StatCard({ label, value, sub, to, accent }) {
  const inner = (
    <div className={`p-5 border transition-colors ${to ? 'hover:border-neutral-700 cursor-pointer' : ''} ${accent ? 'border-red-900/50 bg-red-950/20' : 'border-neutral-900'}`}>
      <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">{label}</p>
      <p className={`text-3xl font-medium ${accent ? 'text-red-400' : 'text-white'}`}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-neutral-600 mt-1">{sub}</p>}
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [recent, setRecent] = useState({ messages: [], projects: [], posts: [] })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(d => setStats(d.data))
      .catch(e => setError(e.message))

    api.get('/admin/analytics')
      .then(d => setAnalytics(d.data))
      .catch(() => {})

    // Load recent items in parallel
    Promise.allSettled([
      api.get('/contact?archived=false'),
      api.get('/projects/admin/all'),
      api.get('/blog/admin/all?limit=5'),
    ]).then(([msgs, projs, posts]) => {
      setRecent({
        messages: msgs.status === 'fulfilled' ? msgs.value.data.slice(0, 5) : [],
        projects: projs.status === 'fulfilled' ? projs.value.data.slice(0, 5) : [],
        posts:    posts.status === 'fulfilled' ? posts.value.data.slice(0, 5) : [],
      })
    })
  }, [])

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />

      <div className="p-6 md:p-8 space-y-8">
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-900">
          <StatCard label="Total Projects"     value={stats?.projects.total}       sub={`${stats?.projects.published ?? '—'} published`}  to="/projects" />
          <StatCard label="Featured Projects"  value={stats?.projects.featured}    sub="marked as featured"                                to="/projects" />
          <StatCard label="Blog Posts"         value={stats?.blog.total}           sub={`${stats?.blog.published ?? '—'} published`}       to="/blog" />
          <StatCard label="Testimonials"       value={stats?.testimonials.total}   sub={`${stats?.testimonials.published ?? '—'} published`} to="/testimonials" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-neutral-900">
          <StatCard label="Total Messages"     value={stats?.messages.total}       sub="in inbox"                                          to="/messages" />
          <StatCard label="Unread Messages"    value={stats?.messages.unread}      sub="awaiting response"                                 to="/messages" accent={stats?.messages.unread > 0} />
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '+ New Project',      to: '/projects/new' },
              { label: '+ Write Post',       to: '/blog/new' },
              { label: '+ Add Testimonial',  to: '/testimonials/new' },
              { label: '+ Add FAQ',          to: '/faq' },
            ].map(({ label, to }) => (
              <Link key={to} to={to}
                className="flex items-center justify-between px-4 py-3 border border-neutral-900 hover:border-neutral-700 text-xs text-neutral-400 hover:text-white transition-colors">
                {label}<span>→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Analytics charts */}
        {analytics && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-3">Activity</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-900">
              {/* Messages per week */}
              <div className="bg-[#0a0a0a] p-5">
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Messages / Week</p>
                <p className="text-xl font-medium text-white mb-4">
                  {analytics.messagesPerWeek.reduce((s, d) => s + d.count, 0)}
                  <span className="text-xs text-neutral-600 font-normal ml-1">last 8 wks</span>
                </p>
                <BarChart data={analytics.messagesPerWeek} color="#a78bfa" height={110} />
              </div>

              {/* Projects per month */}
              <div className="bg-[#0a0a0a] p-5">
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Projects Added / Month</p>
                <p className="text-xl font-medium text-white mb-4">
                  {analytics.projectsPerMonth.reduce((s, d) => s + d.count, 0)}
                  <span className="text-xs text-neutral-600 font-normal ml-1">last 6 mo</span>
                </p>
                <BarChart data={analytics.projectsPerMonth} color="#ffffff" height={110} />
              </div>

              {/* Blog posts per month */}
              <div className="bg-[#0a0a0a] p-5">
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Blog Posts / Month</p>
                <p className="text-xl font-medium text-white mb-4">
                  {analytics.postsPerMonth.reduce((s, d) => s + d.count, 0)}
                  <span className="text-xs text-neutral-600 font-normal ml-1">last 6 mo</span>
                </p>
                <BarChart data={analytics.postsPerMonth} color="#34d399" height={110} />
              </div>
            </div>
          </div>
        )}

        {/* Recent activity columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent messages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-widest text-neutral-600">Recent Messages</p>
              <Link to="/messages" className="text-[10px] text-neutral-500 hover:text-white">View all →</Link>
            </div>
            <div className="space-y-1">
              {recent.messages.length === 0 ? (
                <p className="text-xs text-neutral-700 py-4 text-center">No messages</p>
              ) : recent.messages.map(m => (
                <button key={m.id} onClick={() => navigate('/messages')}
                  className="w-full text-left px-3 py-2.5 border border-neutral-900 hover:border-neutral-700 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs truncate ${!m.isRead ? 'text-white font-medium' : 'text-neutral-400'}`}>{m.name}</p>
                    <span className="text-[9px] text-neutral-700 flex-shrink-0">{timeAgo(m.createdAt)}</span>
                  </div>
                  <p className="text-[10px] text-neutral-600 truncate mt-0.5">{m.subject || m.message}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recent projects */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-widest text-neutral-600">Recent Projects</p>
              <Link to="/projects" className="text-[10px] text-neutral-500 hover:text-white">View all →</Link>
            </div>
            <div className="space-y-1">
              {recent.projects.length === 0 ? (
                <p className="text-xs text-neutral-700 py-4 text-center">No projects</p>
              ) : recent.projects.map(p => (
                <Link key={p.id} to={`/projects/${p.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 border border-neutral-900 hover:border-neutral-700 transition-colors">
                  {p.coverImage && (
                    <div className="w-8 h-6 flex-shrink-0 bg-neutral-900 overflow-hidden">
                      <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{p.title}</p>
                    <p className="text-[10px] text-neutral-600">{timeAgo(p.updatedAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent blog posts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-widest text-neutral-600">Recent Posts</p>
              <Link to="/blog" className="text-[10px] text-neutral-500 hover:text-white">View all →</Link>
            </div>
            <div className="space-y-1">
              {recent.posts.length === 0 ? (
                <p className="text-xs text-neutral-700 py-4 text-center">No posts</p>
              ) : recent.posts.map(p => (
                <Link key={p.id} to={`/blog/${p.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 border border-neutral-900 hover:border-neutral-700 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{p.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] ${p.isPublished ? 'text-green-600' : 'text-neutral-600'}`}>
                        {p.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-[9px] text-neutral-700">{timeAgo(p.updatedAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
