import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, ShieldAlert, Receipt, HeartHandshake } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/axios.js'
import { SkeletonBlock } from '../components/Skeleton.jsx'

const EMPTY_FORM = {
  name: '', title: '', bio: '', specialties: '', experience_summary: '',
  plan_tier: 'basic', photo_url: '', contact_email: '', contact_phone: '', is_active: true,
  password: '',
}

function ConsultantForm({ initial, onCancel, onSaved }) {
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
    if (!form.name.trim() || !form.title.trim()) {
      setError('Name and title are required.')
      return
    }
    setSaving(true)
    try {
      // An empty password field means "don't change it" — sending an
      // empty string would fail the backend's minimum-length check, so
      // we omit the field entirely in that case rather than send "".
      const payload = { ...form }
      if (!payload.password) delete payload.password

      if (isEdit) {
        await api.put(`/api/admin/consultants/${form.id}`, payload)
      } else {
        await api.post('/api/admin/consultants', payload)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save this consultant.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl2 shadow-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-navy">{isEdit ? 'Edit Consultant' : 'Add Consultant'}</h3>
        <button type="button" onClick={onCancel} className="text-ink/40 hover:text-ink/70 p-1 rounded-lg focus-ring">
          <X size={18} />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Full name</label>
          <input
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Title / credentials</label>
          <input
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="e.g. Clinical Psychologist"
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink/60 mb-1.5">Bio</label>
        <textarea
          value={form.bio}
          onChange={(e) => update('bio', e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Specialties (comma-separated)</label>
          <input
            value={form.specialties}
            onChange={(e) => update('specialties', e.target.value)}
            placeholder="Anxiety, Grief, Relationships"
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Experience summary</label>
          <input
            value={form.experience_summary}
            onChange={(e) => update('experience_summary', e.target.value)}
            placeholder="e.g. 8 years in private practice"
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Plan tier</label>
          <select
            value={form.plan_tier}
            onChange={(e) => update('plan_tier', e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          >
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Photo URL (optional)</label>
          <input
            value={form.photo_url}
            onChange={(e) => update('photo_url', e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Contact email</label>
          <input
            value={form.contact_email}
            onChange={(e) => update('contact_email', e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Contact phone</label>
          <input
            value={form.contact_phone}
            onChange={(e) => update('contact_phone', e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink/60 mb-1.5">
          Chat login password {form.id && <span className="text-ink/35 font-normal">(leave blank to keep unchanged)</span>}
        </label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          placeholder="At least 6 characters"
          className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
        />
        <p className="text-xs text-ink/45 mt-1.5">
          Setting this lets the consultant log in at /consultant/login using their Contact email above,
          and reply to users in-app. Leave blank if this consultant only wants to be reached by email/phone.
        </p>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => update('is_active', e.target.checked)}
          className="w-4 h-4 accent-brand-green"
        />
        <span className="text-sm text-ink/70">Visible to users</span>
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
        {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add consultant'}
      </button>
    </form>
  )
}

export default function AdminConsultants() {
  const { user } = useAuth()
  const [consultants, setConsultants] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | 'new' | consultant object
  const [showPurchases, setShowPurchases] = useState(false)

  function load() {
    setLoading(true)
    Promise.all([
      api.get('/api/admin/consultants'),
      api.get('/api/admin/purchases'),
    ]).then(([c, p]) => {
      setConsultants(c.data)
      setPurchases(p.data)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleDelete(id) {
    if (!window.confirm('Remove this consultant? This cannot be undone.')) return
    await api.delete(`/api/admin/consultants/${id}`)
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
          <h1 className="font-display text-2xl font-bold text-navy">Manage Consultants</h1>
          <p className="text-ink/55 mt-1">Add, edit, or remove consultants shown on the Consultation page.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowPurchases((s) => !s)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-black/10 text-sm font-semibold text-navy hover:border-brand-green transition-colors focus-ring"
          >
            <Receipt size={16} /> {showPurchases ? 'Hide' : 'View'} Payments
          </button>
          <button
            onClick={() => window.location.assign('/admin/organizations')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-black/10 text-sm font-semibold text-navy hover:border-brand-green transition-colors focus-ring"
          >
            <HeartHandshake size={16} /> Manage Organizations
          </button>
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-green text-white text-sm font-semibold hover:bg-brand-greenDark transition-colors focus-ring"
          >
            <Plus size={16} /> Add Consultant
          </button>
        </div>
      </div>

      {editing && (
        <ConsultantForm
          initial={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}

      {showPurchases && (
        <div className="bg-white rounded-xl2 shadow-card p-5 overflow-x-auto">
          <h3 className="font-display font-bold text-navy mb-3">Recent Payments</h3>
          {purchases.length === 0 ? (
            <p className="text-sm text-ink/50">No payments yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink/40 uppercase tracking-wide">
                  <th className="pb-2 pr-4">User</th>
                  <th className="pb-2 pr-4">Plan</th>
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} className="border-t border-black/5">
                    <td className="py-2 pr-4">{p.user_name || p.user_email || '—'}</td>
                    <td className="py-2 pr-4 capitalize">{p.plan_tier}</td>
                    <td className="py-2 pr-4">{p.currency} {p.amount.toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        p.status === 'successful' ? 'bg-brand-greenLight text-brand-green'
                          : p.status === 'failed' ? 'bg-red-50 text-red-600'
                          : 'bg-surface text-ink/50'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 text-ink/50">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <SkeletonBlock className="h-20 w-full" />
          <SkeletonBlock className="h-20 w-full" />
        </div>
      ) : consultants.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-card p-8 text-center text-sm text-ink/50">
          No consultants added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {consultants.map((c) => (
            <div key={c.id} className="bg-white rounded-xl2 shadow-card p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-navy truncate">{c.name}</p>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-surface text-ink/50">
                    {c.plan_tier}
                  </span>
                  {!c.is_active && (
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                      hidden
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink/50 truncate">{c.title}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setEditing(c)}
                  className="p-2 rounded-lg text-ink/40 hover:text-brand-green hover:bg-brand-greenLight transition-colors focus-ring"
                  aria-label="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
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
