import { useState, useEffect, useMemo } from 'react'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Btn from '../components/Btn'
import { useToast, ToastContainer } from '../components/Toast'
import { useUnread } from '../context/UnreadContext'

// ── Message detail panel (used as both desktop side-pane and mobile overlay) ──
function MessageDetail({ msg, showArchived, onMarkRead, onArchive, onDelete, onClose }) {
  const [replying, setReplying] = useState(false)
  const [replySubject, setReplySubject] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [replyError, setReplyError] = useState('')
  const [replySuccess, setReplySuccess] = useState(false)
  const { show } = useToast()

  // Reset reply form when message changes
  useEffect(() => {
    setReplying(false)
    setReplySubject(msg?.subject ? `Re: ${msg.subject}` : 'Re: Your enquiry')
    setReplyBody('')
    setReplyError('')
    setReplySuccess(false)
  }, [msg?.id])

  const sendReply = async () => {
    if (!replySubject.trim() || !replyBody.trim()) {
      setReplyError('Subject and message are required.')
      return
    }
    setSending(true)
    setReplyError('')
    try {
      const d = await api.post(`/contact/${msg.id}/reply`, {
        subject: replySubject,
        body: replyBody,
      })
      if (d.mailto) {
        // No Resend key — open mailto fallback
        window.location.href = d.mailto
        setReplying(false)
        return
      }
      setReplySuccess(true)
      setReplying(false)
      show(`Reply sent to ${msg.email}`)
    } catch (e) {
      setReplyError(e.message)
    } finally {
      setSending(false)
    }
  }

  if (!msg) return null

  return (
    <div className="flex-1 overflow-y-auto p-5 md:p-8">
      <div className="max-w-xl">
        {/* Back button — mobile only */}
        <button onClick={onClose} className="md:hidden flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white mb-5 transition-colors">
          ← Back
        </button>

        <div className="flex items-start justify-between mb-5 gap-3">
          <div>
            <h2 className="text-base font-medium text-white">{msg.name}</h2>
            <p className="text-xs text-neutral-500 mt-1">{msg.email}{msg.phone ? ` · ${msg.phone}` : ''}</p>
            <p className="text-xs text-neutral-600 mt-0.5">{new Date(msg.createdAt).toLocaleString()}</p>
          </div>
          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-1.5">
            <Btn variant="secondary" onClick={() => onMarkRead(!msg.isRead)}>
              {msg.isRead ? 'Unread' : 'Read'}
            </Btn>
            <Btn variant="secondary" onClick={() => onArchive(!showArchived)}>
              {showArchived ? 'Unarchive' : 'Archive'}
            </Btn>
            <Btn variant="danger" onClick={onDelete}>Delete</Btn>
          </div>
        </div>

        {msg.subject && <p className="text-sm font-medium text-neutral-300 mb-4">{msg.subject}</p>}
        <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap border-t border-neutral-900 pt-4">{msg.message}</p>

        {/* Reply section */}
        <div className="mt-6 pt-4 border-t border-neutral-900">
          {replySuccess ? (
            <p className="text-xs text-green-400">✓ Reply sent to {msg.email}</p>
          ) : replying ? (
            <div className="space-y-3">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Reply to {msg.name}</p>
              <input
                type="text"
                value={replySubject}
                onChange={e => setReplySubject(e.target.value)}
                placeholder="Subject"
                className="w-full bg-[#0a0a0a] border border-neutral-800 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
              <textarea
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                rows={6}
                placeholder={`Hi ${msg.name},\n\nThank you for reaching out…`}
                className="w-full bg-[#0a0a0a] border border-neutral-800 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 resize-y"
              />
              {replyError && <p className="text-xs text-red-400">{replyError}</p>}
              <div className="flex items-center gap-2">
                <Btn onClick={sendReply} disabled={sending}>
                  {sending ? 'Sending…' : `Send to ${msg.email}`}
                </Btn>
                <Btn variant="secondary" onClick={() => { setReplying(false); setReplyError('') }}>
                  Cancel
                </Btn>
                <a href={`mailto:${msg.email}?subject=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(replyBody)}`}
                  className="ml-auto text-[10px] text-neutral-600 hover:text-white transition-colors">
                  Open in mail app →
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Btn onClick={() => setReplying(true)}>Reply</Btn>
              {msg.phone && (
                <a href={`tel:${msg.phone}`} className="text-xs text-neutral-400 hover:text-white transition-colors">
                  Call →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Messages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [selected, setSelected] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [mobileDetail, setMobileDetail] = useState(false) // show detail overlay on mobile
  const { show } = useToast()
  const { refresh: refreshUnread } = useUnread()

  const load = () => {
    setLoading(true)
    api.get(`/contact?archived=${showArchived}`)
      .then(d => setMessages(d.data))
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [showArchived])

  const filtered = useMemo(() => {
    const q = searchInput.trim().toLowerCase()
    if (!q) return messages
    return messages.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.subject || '').toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    )
  }, [messages, searchInput])

  const markRead = async (id, isRead) => {
    try {
      await api.patch(`/contact/${id}`, { isRead })
      setMessages(ms => ms.map(m => m.id === id ? { ...m, isRead } : m))
      if (selected?.id === id) setSelected(s => ({ ...s, isRead }))
      refreshUnread()
    } catch (e) { show(e.message, 'error') }
  }

  const archive = async (id, isArchived) => {
    try {
      await api.patch(`/contact/${id}`, { isArchived })
      setMessages(ms => ms.filter(m => m.id !== id))
      if (selected?.id === id) { setSelected(null); setMobileDetail(false) }
      refreshUnread()
      show(isArchived ? 'Archived' : 'Unarchived')
    } catch (e) { show(e.message, 'error') }
  }

  const remove = async (id) => {
    if (!confirm('Permanently delete?')) return
    try {
      await api.delete(`/contact/${id}`)
      setMessages(ms => ms.filter(m => m.id !== id))
      if (selected?.id === id) { setSelected(null); setMobileDetail(false) }
      refreshUnread()
      show('Deleted')
    } catch (e) { show(e.message, 'error') }
  }

  const openMessage = msg => {
    setSelected(msg)
    setMobileDetail(true)
    if (!msg.isRead) markRead(msg.id, true)
  }

  // Bulk
  const toggleSelect = id => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const selectAll    = () => selectedIds.size === filtered.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(filtered.map(m => m.id)))

  const bulkMarkRead = async () => {
    await Promise.all([...selectedIds].map(id => api.patch(`/contact/${id}`, { isRead: true })))
    setMessages(ms => ms.map(m => selectedIds.has(m.id) ? { ...m, isRead: true } : m))
    setSelectedIds(new Set()); refreshUnread(); show(`${selectedIds.size} marked as read`)
  }
  const bulkArchive = async () => {
    if (!confirm(`Archive ${selectedIds.size} messages?`)) return
    await Promise.all([...selectedIds].map(id => api.patch(`/contact/${id}`, { isArchived: true })))
    setMessages(ms => ms.filter(m => !selectedIds.has(m.id)))
    if (selectedIds.has(selected?.id)) { setSelected(null); setMobileDetail(false) }
    setSelectedIds(new Set()); refreshUnread(); show(`${selectedIds.size} archived`)
  }
  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} messages?`)) return
    await Promise.all([...selectedIds].map(id => api.delete(`/contact/${id}`)))
    setMessages(ms => ms.filter(m => !selectedIds.has(m.id)))
    if (selectedIds.has(selected?.id)) { setSelected(null); setMobileDetail(false) }
    setSelectedIds(new Set()); refreshUnread(); show(`${selectedIds.size} deleted`)
  }

  const unread  = messages.filter(m => !m.isRead).length
  const hasBulk = selectedIds.size > 0

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-80px)]">
      <PageHeader
        title="Messages"
        subtitle={`${unread} unread`}
        action={
          <button onClick={() => { setShowArchived(a => !a); setSelectedIds(new Set()); setSelected(null); setMobileDetail(false) }}
            className="text-xs text-neutral-500 hover:text-white transition-colors">
            {showArchived ? 'Inbox' : 'Archived'}
          </button>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-900 bg-neutral-950 flex-shrink-0">
        <input type="checkbox" checked={filtered.length > 0 && selectedIds.size === filtered.length}
          onChange={selectAll} className="accent-white cursor-pointer" />
        {hasBulk ? (
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            <span className="text-xs text-neutral-400 flex-shrink-0">{selectedIds.size} selected</span>
            <Btn variant="secondary" onClick={bulkMarkRead}>Read</Btn>
            <Btn variant="secondary" onClick={bulkArchive}>{showArchived ? 'Unarchive' : 'Archive'}</Btn>
            <Btn variant="danger" onClick={bulkDelete}>Delete</Btn>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-neutral-600 hover:text-white flex-shrink-0">Cancel</button>
          </div>
        ) : (
          <div className="relative flex-1 max-w-xs">
            <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search…"
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white px-3 py-1.5 focus:border-neutral-600 transition-colors placeholder-neutral-600" />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">✕</button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Message list */}
        <div className={`w-full md:w-72 lg:w-80 flex-shrink-0 border-r border-neutral-900 overflow-y-auto ${mobileDetail ? 'hidden md:block' : 'block'}`}>
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-5 h-5 border border-neutral-700 border-t-white rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-neutral-600 text-center py-12">{searchInput ? 'No results' : 'No messages'}</p>
          ) : filtered.map(m => (
            <div key={m.id} className={`flex items-start gap-2 px-3 py-3 border-b border-neutral-900 transition-colors ${selected?.id === m.id ? 'bg-neutral-900' : 'hover:bg-neutral-900/50'}`}>
              <input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggleSelect(m.id)}
                onClick={e => e.stopPropagation()} className="accent-white cursor-pointer mt-1 flex-shrink-0" />
              <button className="flex-1 text-left min-w-0" onClick={() => openMessage(m)}>
                <div className="flex items-start justify-between gap-1">
                  <p className={`text-xs truncate ${!m.isRead ? 'font-semibold text-white' : 'text-neutral-400'}`}>{m.name}</p>
                  <span className="text-[9px] text-neutral-700 flex-shrink-0">{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-[10px] text-neutral-500 truncate mt-0.5">{m.subject || m.email}</p>
                <p className="text-[10px] text-neutral-700 truncate">{m.message}</p>
              </button>
            </div>
          ))}
        </div>

        {/* Detail — desktop side pane / mobile full overlay */}
        <div className={`flex-1 min-w-0 overflow-y-auto ${mobileDetail ? 'block' : 'hidden md:block'}`}>
          {selected ? (
            <MessageDetail
              msg={selected}
              showArchived={showArchived}
              onMarkRead={isRead => markRead(selected.id, isRead)}
              onArchive={isArchived => archive(selected.id, isArchived)}
              onDelete={() => remove(selected.id)}
              onClose={() => { setMobileDetail(false) }}
            />
          ) : (
            <div className="hidden md:flex items-center justify-center h-full">
              <p className="text-sm text-neutral-600">Select a message to read</p>
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}
