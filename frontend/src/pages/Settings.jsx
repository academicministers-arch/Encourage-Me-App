import React, { useEffect, useState } from 'react'
import { Bell, Lock, Shield, Trash2, Save, Download } from 'lucide-react'
import api from '../api/axios.js'
import { useAuth } from '../context/AuthContext.jsx'

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-xl2 shadow-card p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <Icon size={18} className="text-brand-green" />
        <h2 className="font-display font-bold text-navy">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function Settings() {
  const { logout } = useAuth()
  const [settings, setSettings] = useState(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState('')

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    api.get('/api/settings').then((res) => setSettings(res.data))
  }, [])

  async function saveSettings(patch) {
    setSavingSettings(true)
    setSettingsMsg('')
    try {
      const res = await api.put('/api/settings', patch)
      setSettings(res.data)
      setSettingsMsg('Preferences saved.')
      setTimeout(() => setSettingsMsg(''), 2000)
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPwMsg('')
    setPwSaving(true)
    try {
      await api.post('/api/auth/change-password', pwForm)
      setPwMsg('Password updated successfully.')
      setPwForm({ current_password: '', new_password: '' })
    } catch (err) {
      setPwMsg(err.response?.data?.detail || 'Could not update password.')
    } finally {
      setPwSaving(false)
    }
  }

  async function handleDeleteAccount() {
    await api.delete('/api/auth/account')
    logout()
  }

  async function handleExport(format) {
    const res = await api.get(`/api/export/${format}`, { responseType: 'blob' })
    const mime = format === 'csv' ? 'text/csv' : 'application/json'
    const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }))
    const link = document.createElement('a')
    link.href = url
    link.download = `encourage-me-data.${format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  if (!settings) return null

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Settings</h1>
        <p className="text-ink/55 mt-1">Manage reminders, security, and your account.</p>
      </div>

      <Section icon={Bell} title="Notifications">
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-ink/75">Daily reminders</span>
            <input
              type="checkbox"
              checked={settings.notifications_enabled}
              onChange={(e) => saveSettings({ notifications_enabled: e.target.checked })}
              className="w-4 h-4 accent-brand-green"
            />
          </label>
          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1.5">Reminder time</label>
            <input
              type="time"
              value={settings.reminder_time}
              onChange={(e) => saveSettings({ reminder_time: e.target.value })}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1.5">Frequency</label>
            <select
              value={settings.reminder_frequency}
              onChange={(e) => saveSettings({ reminder_frequency: e.target.value })}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
            >
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays only</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          {(savingSettings || settingsMsg) && (
            <p className="text-xs text-brand-green font-medium">{savingSettings ? 'Saving…' : settingsMsg}</p>
          )}
        </div>
      </Section>

      <Section icon={Lock} title="Change Password">
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password"
            placeholder="Current password"
            value={pwForm.current_password}
            onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
          <input
            type="password"
            placeholder="New password"
            value={pwForm.new_password}
            onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
          {pwMsg && <p className="text-xs font-medium text-brand-green">{pwMsg}</p>}
          <button
            type="submit"
            disabled={pwSaving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-navy text-white text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-60 focus-ring"
          >
            <Save size={15} /> {pwSaving ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </Section>

      <Section icon={Download} title="Export Your Data">
        <p className="text-sm text-ink/60 mb-4">
          Download everything you've logged — check-ins, journal entries, and favorites — in a
          format you can keep or move elsewhere.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-navy text-white text-sm font-semibold hover:bg-navy-light transition-colors focus-ring"
          >
            <Download size={15} /> Download JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-green text-white text-sm font-semibold hover:bg-brand-greenDark transition-colors focus-ring"
          >
            <Download size={15} /> Download CSV
          </button>
        </div>
      </Section>

      <Section icon={Shield} title="Privacy & Account">
        <p className="text-sm text-ink/60 mb-4">
          Your emotional data is private and only visible to you. Deleting your account permanently
          removes all check-ins, journal entries, and favorites.
        </p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
          >
            <Trash2 size={15} /> Delete account
          </button>
        ) : (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 space-y-3">
            <p className="text-sm text-red-700 font-medium">This action can't be undone. Are you sure?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
              >
                Yes, delete my account
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-lg bg-white text-ink/60 text-xs font-semibold border border-black/10"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}
