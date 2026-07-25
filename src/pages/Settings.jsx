import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Btn from '../components/Btn'
import Field, { Input } from '../components/Field'
import { useToast, ToastContainer } from '../components/Toast'
import { useUnsavedWarning } from '../hooks/useUnsavedWarning'

const SECTIONS = [
  {
    title: 'Site Info',
    keys: [
      { key: 'site_name',    label: 'Site Name' },
      { key: 'site_tagline', label: 'Tagline' },
      { key: 'proof_text',   label: 'Proof Text (e.g. "100+ spaces")' },
    ],
  },
  {
    title: 'Contact Details',
    keys: [
      { key: 'contact_phone',    label: 'Phone Number' },
      { key: 'contact_email',    label: 'Email Address' },
      { key: 'contact_location', label: 'Location' },
      { key: 'whatsapp_number',  label: 'WhatsApp Number (digits only, e.g. 251923814125)' },
      { key: 'google_maps_url',  label: 'Google Maps URL' },
    ],
  },
  {
    title: 'Social Media',
    keys: [
      { key: 'instagram_url', label: 'Instagram URL' },
      { key: 'facebook_url',  label: 'Facebook URL' },
      { key: 'telegram_url',  label: 'Telegram URL' },
      { key: 'tiktok_url',    label: 'TikTok URL' },
    ],
  },
]

export default function Settings() {
  const { show } = useToast()
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  useUnsavedWarning(isDirty)

  // Password change
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    api.get('/settings')
      .then(d => setSettings(d.data))
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  const set = (key, value) => {
    setSettings(p => ({ ...p, [key]: value }))
    setIsDirty(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const d = await api.put('/settings', settings)
      setSettings(d.data)
      setIsDirty(false)
      show('Settings saved')
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError('Passwords do not match')
      return
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters')
      return
    }
    setPwSaving(true)
    try {
      await api.patch('/settings/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      show('Password changed successfully')
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      setPwError(err.message)
    } finally {
      setPwSaving(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-5 h-5 border border-neutral-700 border-t-white rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Site-wide configuration"
        action={<Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Btn>}
      />

      <form onSubmit={handleSave} className="p-8 max-w-2xl space-y-10">
        {SECTIONS.map(section => (
          <div key={section.title}>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4 pb-2 border-b border-neutral-900">
              {section.title}
            </p>
            <div className="space-y-4">
              {section.keys.map(({ key, label }) => (
                <Field key={key} label={label}>
                  <Input
                    value={settings[key] || ''}
                    onChange={e => set(key, e.target.value)}
                    placeholder={label}
                  />
                </Field>
              ))}
            </div>
          </div>
        ))}
      </form>

      {/* Change Password */}
      <div className="px-8 pb-12 max-w-2xl">
        <div className="border-t border-neutral-900 pt-8">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">Change Password</p>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Field label="Current Password">
              <Input
                type="password"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                placeholder="••••••••"
              />
            </Field>
            <Field label="New Password">
              <Input
                type="password"
                value={pwForm.newPassword}
                onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                placeholder="Min. 8 characters"
              />
            </Field>
            <Field label="Confirm New Password">
              <Input
                type="password"
                value={pwForm.confirm}
                onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                placeholder="Repeat new password"
              />
            </Field>
            {pwError && <p className="text-xs text-red-500">{pwError}</p>}
            <Btn type="submit" variant="secondary" disabled={pwSaving}>
              {pwSaving ? 'Updating…' : 'Update Password'}
            </Btn>
          </form>
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}
