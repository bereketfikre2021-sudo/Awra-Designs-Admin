import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import Btn from '../components/Btn'
import Field, { Input } from '../components/Field'
import { useToast, ToastContainer } from '../components/Toast'
import { useUnsavedWarning } from '../hooks/useUnsavedWarning'

const API = import.meta.env.VITE_API_URL || '/api'

const TABS = ['Profile', 'Site', 'Contact', 'Social', 'Business', 'Appearance', 'Notifications', 'Security']

export default function Settings() {
  const { admin, updateProfile } = useAuth()
  const { show } = useToast()
  const avatarInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('Profile')

  // ── Profile ────────────────────────────────────────────────────────────────
  const [profileName,     setProfileName]     = useState(admin?.name   || '')
  const [profileAvatar,   setProfileAvatar]   = useState(admin?.avatar || '')
  const [profileSaving,   setProfileSaving]   = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const uploadAvatar = async (file) => {
    setAvatarUploading(true)
    const token = localStorage.getItem('token')
    const form = new FormData()
    form.append('image', file)
    try {
      const res = await fetch(`${API}/upload/single`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await res.json()
      if (data.success) setProfileAvatar(data.data.url)
    } catch {}
    finally { setAvatarUploading(false) }
  }

  const saveProfile = async () => {
    setProfileSaving(true)
    try {
      const d = await api.put('/admins/me', { name: profileName, avatar: profileAvatar })
      updateProfile(d.data)
      show('Profile updated')
    } catch (e) { show(e.message, 'error') }
    finally { setProfileSaving(false) }
  }

  // ── Site settings ──────────────────────────────────────────────────────────
  const [settings, setSettings] = useState({})
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [isDirty,  setIsDirty]  = useState(false)
  useUnsavedWarning(isDirty)

  // ── Password ───────────────────────────────────────────────────────────────
  const [pwForm,   setPwForm]   = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError,  setPwError]  = useState('')

  useEffect(() => {
    api.get('/settings')
      .then(d => setSettings(d.data))
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  const set = (key, value) => { setSettings(p => ({ ...p, [key]: value })); setIsDirty(true) }

  const handleSave = async (e) => {
    e?.preventDefault()
    setSaving(true)
    try {
      const d = await api.put('/settings', settings)
      setSettings(d.data); setIsDirty(false); show('Settings saved')
    } catch (err) { show(err.message, 'error') }
    finally { setSaving(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.newPassword !== pwForm.confirm) { setPwError('Passwords do not match'); return }
    if (pwForm.newPassword.length < 8) { setPwError('Min. 8 characters'); return }
    setPwSaving(true)
    try {
      await api.patch('/settings/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      show('Password changed')
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) { setPwError(err.message) }
    finally { setPwSaving(false) }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-5 h-5 border border-neutral-700 border-t-white rounded-full animate-spin" />
    </div>
  )

  // Which tabs show a Save button
  const showSave = ['Site', 'Contact', 'Social', 'Business', 'Appearance', 'Notifications'].includes(activeTab)

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Site-wide configuration"
        action={showSave ? <Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn> : null}
      />

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-neutral-900 px-6 md:px-8">
        <div className="flex gap-0 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] whitespace-nowrap border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? 'border-white text-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-xl">

        {/* ── Profile tab ──────────────────────────────────────────────────── */}
        {activeTab === 'Profile' && (
          <div className="space-y-6">
            <SectionLabel>Avatar</SectionLabel>
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                {profileAvatar
                  ? <img src={profileAvatar} alt={profileName} className="w-16 h-16 rounded-full object-cover border border-neutral-800" />
                  : <div className="w-16 h-16 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-lg font-medium text-neutral-400">
                      {profileName ? profileName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'}
                    </div>
                }
                {avatarUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <div className="w-4 h-4 border border-neutral-400 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]); e.target.value = '' }} />
                <button type="button" onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="text-xs border border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-white px-3 py-1.5 transition-colors disabled:opacity-40">
                  {avatarUploading ? 'Uploading…' : profileAvatar ? 'Change photo' : 'Upload photo'}
                </button>
                {profileAvatar && (
                  <button type="button" onClick={() => setProfileAvatar('')}
                    className="ml-2 text-xs text-neutral-600 hover:text-red-400 transition-colors">
                    Remove
                  </button>
                )}
                <p className="text-[10px] text-neutral-600 mt-1">Shown in the sidebar</p>
              </div>
            </div>

            <SectionLabel>Display Name</SectionLabel>
            <div className="space-y-3">
              <Field label="Name">
                <Input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Your name" />
              </Field>
              <p className="text-[10px] text-neutral-600">
                Role: <span className="text-neutral-400 uppercase tracking-wider">{admin?.role || 'admin'}</span>
              </p>
              <Btn onClick={saveProfile} disabled={profileSaving} type="button">
                {profileSaving ? 'Saving…' : 'Save Profile'}
              </Btn>
            </div>
          </div>
        )}

        {/* ── Site tab ─────────────────────────────────────────────────────── */}
        {activeTab === 'Site' && (
          <form onSubmit={handleSave} className="space-y-4">
            <SectionLabel>Site Identity</SectionLabel>
            <p className="text-xs text-neutral-600 -mt-2 mb-2">Name, tagline and proof text shown on the homepage</p>
            <Field label="Site Name">
              <Input value={settings.site_name || ''} onChange={e => set('site_name', e.target.value)} placeholder="Awra Designs" />
            </Field>
            <Field label="Tagline">
              <Input value={settings.site_tagline || ''} onChange={e => set('site_tagline', e.target.value)} placeholder="Architecture · Interior · Finishing" />
            </Field>
            <Field label="Proof Text">
              <Input value={settings.proof_text || ''} onChange={e => set('proof_text', e.target.value)} placeholder="100+ spaces completed across Ethiopia" />
            </Field>
          </form>
        )}

        {/* ── Contact tab ──────────────────────────────────────────────────── */}
        {activeTab === 'Contact' && (
          <form onSubmit={handleSave} className="space-y-4">
            <SectionLabel>Contact Details</SectionLabel>
            <p className="text-xs text-neutral-600 -mt-2 mb-2">Shown in the Contact section and floating CTA</p>
            <Field label="Phone Number">
              <Input value={settings.contact_phone || ''} onChange={e => set('contact_phone', e.target.value)} placeholder="+251 92 381 4125" />
            </Field>
            <Field label="WhatsApp Number">
              <Input value={settings.whatsapp_number || ''} onChange={e => set('whatsapp_number', e.target.value)} placeholder="251923814125 (digits only)" />
            </Field>
            <Field label="Email Address">
              <Input value={settings.contact_email || ''} onChange={e => set('contact_email', e.target.value)} placeholder="info@awradesigns.com" />
            </Field>
            <Field label="Location">
              <Input value={settings.contact_location || ''} onChange={e => set('contact_location', e.target.value)} placeholder="Addis Ababa, Ethiopia" />
            </Field>
            <Field label="Google Maps URL">
              <Input value={settings.google_maps_url || ''} onChange={e => set('google_maps_url', e.target.value)} placeholder="https://maps.google.com/..." />
            </Field>
          </form>
        )}

        {/* ── Social tab ───────────────────────────────────────────────────── */}
        {activeTab === 'Social' && (
          <form onSubmit={handleSave} className="space-y-4">
            <SectionLabel>Social Media Links</SectionLabel>
            <p className="text-xs text-neutral-600 -mt-2 mb-2">Shown in the footer. Leave blank to hide an icon.</p>
            <Field label="Instagram URL">
              <Input value={settings.instagram_url || ''} onChange={e => set('instagram_url', e.target.value)} placeholder="https://www.instagram.com/awradesigns/" />
            </Field>
            <Field label="Facebook URL">
              <Input value={settings.facebook_url || ''} onChange={e => set('facebook_url', e.target.value)} placeholder="https://web.facebook.com/..." />
            </Field>
            <Field label="Telegram URL">
              <Input value={settings.telegram_url || ''} onChange={e => set('telegram_url', e.target.value)} placeholder="https://t.me/AwraDesigns" />
            </Field>
            <Field label="TikTok URL">
              <Input value={settings.tiktok_url || ''} onChange={e => set('tiktok_url', e.target.value)} placeholder="https://www.tiktok.com/@awrainteriors" />
            </Field>
          </form>
        )}

        {/* ── Business tab ─────────────────────────────────────────────────── */}
        {activeTab === 'Business' && (
          <form onSubmit={handleSave} className="space-y-4">
            <SectionLabel>Brand Identity</SectionLabel>
            <p className="text-xs text-neutral-600 -mt-2 mb-2">Text shown in the footer and navbar</p>
            <Field label="Established Year">
              <Input value={settings.est_year || ''} onChange={e => set('est_year', e.target.value)} placeholder="2019" />
            </Field>
            <Field label="Copyright Name">
              <Input value={settings.copyright_name || ''} onChange={e => set('copyright_name', e.target.value)} placeholder="Awra Finishing & Interior" />
            </Field>
            <Field label="Studio Disciplines">
              <Input value={settings.disciplines || ''} onChange={e => set('disciplines', e.target.value)} placeholder="Architecture · Interior · Finishing" />
            </Field>
            <Field label="Hero Label">
              <Input value={settings.hero_label || ''} onChange={e => set('hero_label', e.target.value)} placeholder="Addis Ababa's Architecture & Interior Studio" />
            </Field>
          </form>
        )}

        {/* ── Appearance tab ───────────────────────────────────────────────── */}
        {activeTab === 'Appearance' && (
          <form onSubmit={handleSave} className="space-y-4">
            <SectionLabel>Branding Assets</SectionLabel>
            <p className="text-xs text-neutral-600 -mt-2 mb-2">URLs for logo and sharing images. Leave blank to use the default files.</p>
            <Field label="Logo URL">
              <Input value={settings.logo_url || ''} onChange={e => set('logo_url', e.target.value)} placeholder="https://... (leave blank to use default)" />
            </Field>
            {settings.logo_url && (
              <div className="flex items-center gap-3 p-3 border border-neutral-900 bg-neutral-900/30">
                <img src={settings.logo_url} alt="Logo preview" className="h-8 w-auto object-contain" />
                <span className="text-[10px] text-neutral-600">Logo preview</span>
              </div>
            )}
            <SectionLabel>SEO &amp; Sharing</SectionLabel>
            <Field label="Default OG / Share Image URL">
              <Input value={settings.og_image_url || ''} onChange={e => set('og_image_url', e.target.value)} placeholder="https://... (shown when sharing site links)" />
            </Field>
            {settings.og_image_url && (
              <div className="border border-neutral-900 overflow-hidden">
                <img src={settings.og_image_url} alt="OG image preview" className="w-full h-32 object-cover" />
                <p className="text-[10px] text-neutral-600 p-2">Share image preview</p>
              </div>
            )}
          </form>
        )}

        {/* ── Notifications tab ────────────────────────────────────────────── */}
        {activeTab === 'Notifications' && (
          <form onSubmit={handleSave} className="space-y-4">
            <SectionLabel>Email Notifications</SectionLabel>
            <p className="text-xs text-neutral-600 -mt-2 mb-2">Where to send alerts when a new contact message arrives</p>
            <Field label="Notification Email">
              <Input
                type="email"
                value={settings.notification_email || ''}
                onChange={e => set('notification_email', e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Reply-From Email">
              <Input
                value={settings.reply_from_email || ''}
                onChange={e => set('reply_from_email', e.target.value)}
                placeholder="Awra Designs <noreply@awradesigns.com>"
              />
            </Field>
            <SectionLabel>Email Provider</SectionLabel>
            <p className="text-xs text-neutral-600 -mt-2 mb-2">
              Resend API key for sending emails. Get yours at{' '}
              <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-neutral-400 underline underline-offset-2">resend.com</a>
            </p>
            <Field label="Resend API Key">
              <Input
                type="password"
                value={settings.resend_api_key || ''}
                onChange={e => set('resend_api_key', e.target.value)}
                placeholder="re_••••••••••••••••"
              />
            </Field>
            <p className="text-[10px] text-neutral-600">The key is stored encrypted and never shown in full after saving.</p>
          </form>
        )}

        {/* ── Security tab ─────────────────────────────────────────────────── */}
        {activeTab === 'Security' && (
          <div className="space-y-6">
            <SectionLabel>Change Password</SectionLabel>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Field label="Current Password">
                <Input type="password" value={pwForm.currentPassword}
                  onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} placeholder="••••••••" />
              </Field>
              <Field label="New Password">
                <Input type="password" value={pwForm.newPassword}
                  onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min. 8 characters" />
              </Field>
              <Field label="Confirm New Password">
                <Input type="password" value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" />
              </Field>
              {pwError && <p className="text-xs text-red-500">{pwError}</p>}
              <Btn type="submit" variant="secondary" disabled={pwSaving}>
                {pwSaving ? 'Updating…' : 'Update Password'}
              </Btn>
            </form>
          </div>
        )}

      </div>
      <ToastContainer />
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500 pb-2 border-b border-neutral-900">
      {children}
    </p>
  )
}
