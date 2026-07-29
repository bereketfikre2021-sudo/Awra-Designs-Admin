import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUnread } from '../context/UnreadContext'

const links = [
  { to: '/',            label: 'Dashboard',    icon: '▦' },
  { to: '/projects',    label: 'Projects',     icon: '◉' },
  { to: '/categories',  label: 'Categories',   icon: '⊞' },
  { to: '/media',       label: 'Media',        icon: '⊡' },
  { to: '/about',       label: 'About',        icon: '◌' },
  { to: '/testimonials',label: 'Testimonials', icon: '❝' },
  { to: '/faq',         label: 'FAQ',          icon: '?' },
  { to: '/blog',        label: 'Blog',         icon: '◈' },
  { to: '/messages',    label: 'Messages',     icon: '◻', badge: true },
  { to: '/activity',    label: 'Activity',     icon: '◎' },
  { to: '/team',        label: 'Team',         icon: '◑', adminOnly: true },
  { to: '/settings',    label: 'Settings',     icon: '⚙' },
]

export default function Layout() {
  const { admin, logout } = useAuth()
  const { unread } = useUnread()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const closeSidebar = () => setSidebarOpen(false)

  const visibleLinks = links.filter(l => !l.adminOnly || admin?.role === 'admin')

  const SidebarContent = () => (
    <>
      <div className="px-5 py-6 border-b border-neutral-900 flex items-center justify-between">
        <span className="text-sm font-medium text-white tracking-wide">Awra Admin</span>
        <button onClick={closeSidebar} className="md:hidden text-neutral-500 hover:text-white text-lg leading-none">✕</button>
      </div>

      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        {visibleLinks.map(({ to, label, icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors mb-0.5 ${
                isActive ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'
              }`
            }
          >
            <span className="w-4 text-center text-base leading-none">{icon}</span>
            <span className="flex-1">{label}</span>
            {badge && unread > 0 && (
              <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full px-1">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-neutral-900">
        {/* Avatar + name */}
        <div className="flex items-center gap-2.5 mb-3">
          {admin?.avatar
            ? <img src={admin.avatar} alt={admin.name} className="w-7 h-7 rounded-full object-cover border border-neutral-700 flex-shrink-0" />
            : <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-medium text-neutral-400 flex-shrink-0">
                {admin?.name ? admin.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'}
              </div>
          }
          <div className="min-w-0">
            <p className="text-xs text-white truncate">{admin?.name || 'Admin'}</p>
            <p className="text-[10px] text-neutral-600 uppercase tracking-wider">{admin?.role || 'admin'}</p>
          </div>
        </div>
        <p className="text-[10px] text-neutral-700 truncate mb-2">{admin?.email}</p>
        <button
          onClick={handleLogout}
          className="w-full text-left text-xs text-neutral-500 hover:text-white transition-colors py-1"
        >
          Sign out →
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">

      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 flex-shrink-0 border-r border-neutral-900 flex-col">
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay sidebar ───────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" onClick={closeSidebar} />
          {/* Panel */}
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0a0a0a] border-r border-neutral-900 flex flex-col z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-neutral-900 sticky top-0 bg-[#0a0a0a] z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-neutral-400 hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
              <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-sm font-medium text-white">Awra Admin</span>
          {unread > 0 && (
            <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full px-1">
              {unread}
            </span>
          )}
        </div>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
