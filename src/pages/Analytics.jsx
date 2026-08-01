import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import BarChart from '../components/BarChart'
import { UserIcon, ClockIcon, ArrowReturnIcon, ActivityIcon, DatabaseIcon } from '../components/Icons'

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className={`p-5 border ${accent ? 'border-green-900/40 bg-green-950/10' : 'border-neutral-900'}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] uppercase tracking-widest text-neutral-500">{label}</p>
        {icon && <span className="text-neutral-600">{icon}</span>}
      </div>
      <p className={`text-3xl font-medium tabular-nums ${accent ? 'text-green-400' : 'text-white'}`}>
        {value ?? <span className="text-neutral-700">—</span>}
      </p>
      {sub && <p className="text-[10px] text-neutral-600 mt-1">{sub}</p>}
    </div>
  )
}

// ── Horizontal bar ────────────────────────────────────────────────────────────
function HBar({ label, count, pct, color = 'bg-white' }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-300 truncate max-w-[140px]">{label}</span>
        <span className="text-neutral-500 tabular-nums ml-2">{count} <span className="text-neutral-700">({pct}%)</span></span>
      </div>
      <div className="h-1 bg-neutral-900 rounded-full overflow-hidden">
        <div className={`h-full ${color} opacity-70 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Section row ───────────────────────────────────────────────────────────────
function SectionRow({ section, views, avgDuration, avgScroll, max }) {
  const pct = max ? Math.round((views / max) * 100) : 0
  return (
    <div className="flex items-center gap-4 py-2.5 border-b border-neutral-900 last:border-b-0">
      <span className="w-20 text-[11px] uppercase tracking-wider text-neutral-400 capitalize">{section}</span>
      <div className="flex-1 h-1 bg-neutral-900 rounded-full overflow-hidden">
        <div className="h-full bg-white opacity-60 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-xs text-white tabular-nums">{views}</span>
      <span className="w-16 text-right text-[10px] text-neutral-600">{avgDuration}s avg</span>
      <span className="w-14 text-right text-[10px] text-neutral-600">{avgScroll}% scroll</span>
    </div>
  )
}

// ── Status dot ────────────────────────────────────────────────────────────────
function StatusDot({ ok }) {
  return <span className={`inline-block w-2 h-2 rounded-full mr-2 ${ok ? 'bg-green-400' : 'bg-red-400'}`} />
}

function fmtDuration(secs) {
  if (!secs) return '0s'
  if (secs < 60) return `${secs}s`
  return `${Math.floor(secs / 60)}m ${secs % 60}s`
}

const SOURCE_COLORS = {
  direct:   'bg-white',
  google:   'bg-blue-400',
  bing:     'bg-cyan-400',
  social:   'bg-purple-400',
  referral: 'bg-yellow-400',
}
const DEVICE_COLORS = { desktop: 'bg-white', mobile: 'bg-blue-400', tablet: 'bg-purple-400' }

export default function Analytics() {
  const [overview,     setOverview]     = useState(null)
  const [visitors,     setVisitors]     = useState([])
  const [sections,     setSections]     = useState([])
  const [sources,      setSources]      = useState([])
  const [devices,      setDevices]      = useState(null)
  const [countries,    setCountries]    = useState([])
  const [conversions,  setConversions]  = useState([])
  const [live,         setLive]         = useState(null)
  const [health,       setHealth]       = useState(null)
  const [period,       setPeriod]       = useState('7d')
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [ov, sec, src, dev, ctr, conv, lv, hlth] = await Promise.allSettled([
        api.get('/analytics/overview'),
        api.get('/analytics/sections'),
        api.get('/analytics/sources'),
        api.get('/analytics/devices'),
        api.get('/analytics/countries'),
        api.get('/analytics/conversions'),
        api.get('/analytics/live'),
        api.get('/analytics/health'),
      ])
      if (ov.status    === 'fulfilled') setOverview(ov.value.data)
      if (sec.status   === 'fulfilled') setSections(sec.value.data)
      if (src.status   === 'fulfilled') setSources(src.value.data)
      if (dev.status   === 'fulfilled') setDevices(dev.value.data)
      if (ctr.status   === 'fulfilled') setCountries(ctr.value.data)
      if (conv.status  === 'fulfilled') setConversions(conv.value.data)
      if (lv.status    === 'fulfilled') setLive(lv.value.data)
      if (hlth.status  === 'fulfilled') setHealth(hlth.value.data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  const loadVisitors = useCallback(async (p) => {
    try {
      const d = await api.get(`/analytics/visitors?period=${p}`)
      setVisitors(d.data)
    } catch {}
  }, [])

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => { loadVisitors(period) }, [period, loadVisitors])

  // Live auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(async () => {
      try { const d = await api.get('/analytics/live'); setLive(d.data) } catch {}
    }, 30_000)
    return () => clearInterval(t)
  }, [])

  const maxSection = sections.length ? Math.max(...sections.map(s => s.views)) : 1
  const totalConvEvents = conversions.reduce((s, c) => s + c.count, 0)

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Self-hosted · PostgreSQL"
        action={
          <button onClick={loadAll} className="text-xs text-neutral-500 hover:text-white border border-neutral-800 hover:border-neutral-600 px-3 py-1.5 transition-colors">
            ↻ Refresh
          </button>
        }
      />

      {error && <p className="mx-4 md:mx-8 mt-4 text-xs text-red-400">{error}</p>}

      {loading && !overview ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border border-neutral-700 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="p-4 md:p-8 space-y-8">

          {/* ── Live strip ── */}
          {live && (
            <div className="flex flex-wrap items-center gap-6 px-5 py-3 border border-neutral-800 bg-neutral-950">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-white font-medium">{live.activeVisitors} active</span>
                <span className="text-[10px] text-neutral-500">right now</span>
              </div>
              <span className="text-[10px] text-neutral-600">{live.activeSessions} sessions in last 5 min</span>
              {live.recentEvents?.[0] && (
                <span className="text-[10px] text-neutral-500 ml-auto">
                  Last: <span className="text-neutral-400">{live.recentEvents[0].section || 'unknown'}</span>
                  {' '}· {live.recentEvents[0].device} · {live.recentEvents[0].source}
                </span>
              )}
            </div>
          )}

          {/* ── Overview stat cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-neutral-900">
            <StatCard label="Total Visitors"   value={overview?.total?.toLocaleString()}   sub="all time"            icon={<UserIcon />} />
            <StatCard label="Unique Visitors"  value={overview?.unique?.toLocaleString()}  sub="distinct"            icon={<UserIcon />} />
            <StatCard label="Sessions"         value={overview?.totalSessions?.toLocaleString()} sub="all time"      icon={<ActivityIcon />} />
            <StatCard label="Avg Duration"     value={fmtDuration(overview?.avgDuration)}  sub="per session"         icon={<ClockIcon />} />
            <StatCard label="Bounce Rate"      value={overview?.bounceRate != null ? `${overview.bounceRate}%` : null} sub="single-page" icon={<ArrowReturnIcon />} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-900">
            <StatCard label="New Today"      value={overview?.newToday?.toLocaleString()}  accent={overview?.newToday > 0} />
            <StatCard label="This Week"      value={overview?.thisWeek?.toLocaleString()} />
            <StatCard label="This Month"     value={overview?.thisMonth?.toLocaleString()} />
            <StatCard label="Conversions"    value={overview?.conversionCount?.toLocaleString()} sub="events tracked" />
          </div>

          {/* ── Visitors chart ── */}
          <div className="border border-neutral-900 p-5">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Visitors</p>
              <div className="flex gap-1">
                {['7d','30d','12m'].map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={`px-3 py-1 text-[10px] uppercase tracking-wider border transition-colors
                      ${period === p ? 'border-white text-white' : 'border-neutral-800 text-neutral-600 hover:border-neutral-600 hover:text-neutral-300'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {visitors.length > 0 ? (
              <BarChart data={visitors.map(v => ({ label: v.label, count: v.count }))} color="#ffffff" height={140} />
            ) : (
              <div className="h-32 flex items-center justify-center text-xs text-neutral-700">No data yet</div>
            )}
          </div>

          {/* ── Sources + Devices ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-neutral-900 p-5 space-y-4">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Traffic Sources</p>
              {sources.length ? sources.map(s => (
                <HBar key={s.source} label={s.source || 'direct'} count={s.count} pct={s.pct}
                  color={SOURCE_COLORS[s.source] || 'bg-neutral-400'} />
              )) : <p className="text-xs text-neutral-700">No data yet</p>}
            </div>

            <div className="border border-neutral-900 p-5 space-y-4">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Devices</p>
              {devices?.devices?.length ? devices.devices.map(d => (
                <HBar key={d.name} label={d.name} count={d.count} pct={d.pct}
                  color={DEVICE_COLORS[d.name?.toLowerCase()] || 'bg-neutral-400'} />
              )) : <p className="text-xs text-neutral-700">No data yet</p>}
              <div className="pt-3 border-t border-neutral-900 space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-neutral-600">Browsers</p>
                {devices?.browsers?.slice(0,4).map(b => (
                  <HBar key={b.name} label={b.name} count={b.count} pct={b.pct} color="bg-blue-400" />
                ))}
              </div>
            </div>
          </div>

          {/* ── Section popularity ── */}
          <div className="border border-neutral-900 p-5">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">Section Engagement</p>
            {sections.length ? (
              <div>
                <div className="hidden md:flex items-center gap-4 pb-2 border-b border-neutral-900 text-[10px] uppercase tracking-wider text-neutral-600">
                  <span className="w-20">Section</span>
                  <span className="flex-1">Popularity</span>
                  <span className="w-12 text-right">Views</span>
                  <span className="w-16 text-right">Duration</span>
                  <span className="w-14 text-right">Scroll</span>
                </div>
                {sections.map(s => (
                  <SectionRow key={s.section} {...s} max={maxSection} />
                ))}
              </div>
            ) : <p className="text-xs text-neutral-700">No section data yet</p>}
          </div>

          {/* ── Countries + Conversions ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-neutral-900 p-5">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">Top Countries</p>
              {countries.length ? (
                <div className="space-y-2">
                  {countries.slice(0,10).map(c => (
                    <div key={c.country} className="flex items-center justify-between text-xs">
                      <span className="text-neutral-300">{c.country || 'Unknown'}</span>
                      <span className="text-neutral-500 tabular-nums">{c.count}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-neutral-700">No location data yet</p>}
            </div>

            <div className="border border-neutral-900 p-5">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">Conversions</p>
              {conversions.length ? (
                <div className="space-y-3">
                  {conversions.map(c => (
                    <div key={c.type} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-300 capitalize">{c.type.replace(/_/g, ' ')}</span>
                        <span className="text-neutral-400 tabular-nums">
                          {c.count} <span className="text-neutral-700">· {c.rate}% rate</span>
                        </span>
                      </div>
                      <div className="h-1 bg-neutral-900 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 opacity-60 rounded-full"
                          style={{ width: `${totalConvEvents ? Math.round((c.count / totalConvEvents) * 100) : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-neutral-700">No conversion events yet</p>}
            </div>
          </div>

          {/* ── System health ── */}
          {health && (
            <div className="border border-neutral-900 p-5">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">System Health</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <p className="text-[10px] text-neutral-600 mb-1">Database</p>
                  <p className="text-xs text-white flex items-center">
                    <StatusDot ok={health.database === 'ok'} />
                    {health.database}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-600 mb-1">Uptime</p>
                  <p className="text-xs text-white">{fmtDuration(health.uptime)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-600 mb-1">Memory Used</p>
                  <p className="text-xs text-white">{health.memoryUsedMB} MB</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-600 mb-1">Memory Total</p>
                  <p className="text-xs text-white">{health.memoryTotalMB} MB</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-600 mb-1">Node</p>
                  <p className="text-xs text-white">{health.nodeVersion}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-600 mb-1">Environment</p>
                  <p className="text-xs text-white capitalize">{health.environment}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
