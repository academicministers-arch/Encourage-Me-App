import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, ShieldAlert, HeartHandshake } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/axios.js'
import { SkeletonBlock } from '../components/Skeleton.jsx'

const EMPTY_FORM = {
  name: '', description: '', category: '', country: 'Uganda', location: '', phone: '', phone_note: '', email: '', website: '', emergency: false,
}

function OrganizationForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isEdit = !!initial?.id

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) {
      setError('Organization name is required.')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/api/admin/organizations/${form.id}`, form)
      } else {
        await api.post('/api/admin/organizations', form)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save this organization.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl2 shadow-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-navy">{isEdit ? 'Edit Support Organization' : 'Add Support Organization'}</h3>
        <button type="button" onClick={onCancel} className="text-ink/40 hover:text-ink/70 p-1 rounded-lg focus-ring">
          <X size={18} />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Organization name</label>
          <input
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Country</label>
          <input
            value={form.country}
            onChange={(e) => update('country', e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink/60 mb-1.5">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Category</label>
          <input
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Location</label>
          <input
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Phone note</label>
          <input
            value={form.phone_note}
            onChange={(e) => update('phone_note', e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Email</label>
          <input
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Website</label>
          <input
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.emergency}
          onChange={(e) => update('emergency', e.target.checked)}
          className="w-4 h-4 accent-brand-green"
        />
        <span className="text-sm text-ink/70">Mark as crisis/emergency support</span>
      </label>

      {error && (
        <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 rounded-lg bg-brand-green text-white text-sm font-semibold hover:bg-brand-greenDark transition-colors disabled:opacity-60 focus-ring"
      >
        {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add organization'}
      </button>
    </form>
  )
}

export default function AdminOrganizations() {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  function load() {
    setLoading(true)
    api.get('/api/admin/organizations')
      .then((res) => setOrganizations(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleDelete(id) {
    if (!window.confirm('Remove this support organization? This cannot be undone.')) return
    await api.delete(`/api/admin/organizations/${id}`)
    load()
  }

  if (!user?.is_admin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <ShieldAlert size={36} className="mx-auto text-red-400 mb-3" />
        <h1 className="font-display text-lg font-bold text-navy mb-1.5">Admins only</h1>
        <p className="text-sm text-ink/55">You don't have access to this page.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Manage Support Organizations</h1>
          <p className="text-ink/55 mt-1">Add, edit, or remove organizations shown on the Support page.</p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-green text-white text-sm font-semibold hover:bg-brand-greenDark transition-colors focus-ring"
        >
          <Plus size={16} /> Add Organization
        </button>
      </div>

      {editing && (
        <OrganizationForm
          initial={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          <SkeletonBlock className="h-20 w-full" />
          <SkeletonBlock className="h-20 w-full" />
        </div>
      ) : organizations.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-card p-8 text-center text-sm text-ink/50">
          No support organizations added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {organizations.map((org) => (
            <div key={org.id} className="bg-white rounded-xl2 shadow-card p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-navy truncate">{org.name}</p>
                  {org.emergency && (
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                      emergency
                    </span>
                  )}
                  {!org.emergency && (
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-brand-greenLight text-brand-green">
                      support
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink/50 truncate">{org.country} • {org.category || 'General support'}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setEditing(org)}
                  className="p-2 rounded-lg text-ink/40 hover:text-brand-green hover:bg-brand-greenLight transition-colors focus-ring"
                  aria-label="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(org.id)}
                  className="p-2 rounded-lg text-ink/40 hover:text-red-500 hover:bg-red-50 transition-colors focus-ring"
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
