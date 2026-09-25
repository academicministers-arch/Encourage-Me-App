import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ShieldCheck, Loader2, Smartphone, MessageCircle, Mail, Phone } from 'lucide-react'
import api from '../api/axios.js'
import { SkeletonBlock } from '../components/Skeleton.jsx'

const TIER_LABELS = {
  basic: {
    title: 'Basic Plan',
    tagline: 'Simple, real conversations — support and connection when you need someone to talk to.',
  },
  premium: {
    title: 'Premium Plan',
    tagline: 'Our most experienced specialists, for deeper, ongoing support.',
  },
}

function formatUGX(amount) {
  return `UGX ${amount.toLocaleString()}`
}

function LockedTierCard({ tier, price, count, onUnlock, purchasing }) {
  const label = TIER_LABELS[tier]
  return (
    <div className="bg-white rounded-xl2 shadow-card p-6 md:p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-brand-greenLight flex items-center justify-center mx-auto mb-4">
        <Lock size={20} className="text-brand-green" />
      </div>
      <h3 className="font-display text-lg font-bold text-navy mb-1">{label.title}</h3>
      <p className="text-sm text-ink/55 max-w-sm mx-auto mb-4">{label.tagline}</p>
      <p className="text-xs text-ink/40 mb-5">
        {count} {count === 1 ? 'consultant' : 'consultants'} available in this plan
      </p>
      <button
        onClick={() => onUnlock(tier)}
        disabled={purchasing === tier}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-green text-white text-sm font-semibold hover:bg-brand-greenDark transition-colors disabled:opacity-60 focus-ring"
      >
        {purchasing === tier ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Redirecting to payment…
          </>
        ) : (
          <>Unlock for {formatUGX(price)}</>
        )}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-ink/40 mt-3">
        <Smartphone size={12} /> Pay with MTN or Airtel Mobile Money, via Flutterwave
      </p>
    </div>
  )
}

function ConsultantCard({ consultant, onMessage }) {
  const specialties = (consultant.specialties || '').split(',').map((s) => s.trim()).filter(Boolean)

  return (
    <div className="bg-white rounded-xl2 shadow-card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full overflow-hidden bg-navy flex items-center justify-center text-white font-display font-bold text-lg shrink-0">
          {consultant.photo_url ? (
            <img src={consultant.photo_url} alt={consultant.name} className="h-full w-full object-cover" />
          ) : (
            <span>{consultant.name?.[0]?.toUpperCase() || '?'}</span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-display font-bold text-navy leading-snug truncate">{consultant.name}</h3>
          <p className="text-xs text-brand-green font-semibold">{consultant.title}</p>
        </div>
      </div>

      {consultant.experience_summary && (
        <p className="text-xs text-ink/55">{consultant.experience_summary}</p>
      )}
      {consultant.bio && (
        <p className="text-sm text-ink/70 leading-relaxed line-clamp-3">{consultant.bio}</p>
      )}
      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {specialties.map((s) => (
            <span key={s} className="text-[11px] font-medium text-navy bg-surface px-2 py-1 rounded-full">{s}</span>
          ))}
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-black/5 mt-1">
        {consultant.can_chat && (
          <button
            onClick={() => onMessage(consultant.id)}
            className="w-full flex items-center justify-center gap-2 bg-brand-green text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-brand-greenDark transition-colors focus-ring"
          >
            <MessageCircle size={15} /> Message
          </button>
        )}
        {consultant.contact_email && (
          <a href={`mailto:${consultant.contact_email}`} className="flex items-center gap-2 text-sm text-navy font-medium hover:underline">
            <Mail size={14} className="text-brand-green shrink-0" />
            <span className="truncate">{consultant.contact_email}</span>
          </a>
        )}
        {consultant.contact_phone && (
          <a href={`tel:${consultant.contact_phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-sm text-navy font-medium hover:underline">
            <Phone size={14} className="text-brand-green shrink-0" />
            <span>{consultant.contact_phone}</span>
          </a>
        )}
      </div>
    </div>
  )
}

export default function Consultation() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    api.get('/api/consultants')
      .then((res) => setGroups(res.data))
      .catch(() => setError('Could not load consultants right now. Please try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleUnlock(tier) {
    setError('')
    setPurchasing(tier)
    try {
      const res = await api.post('/api/consultants/purchase', { plan_tier: tier })
      window.location.href = res.data.payment_link
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not start payment. Please try again.')
      setPurchasing(null)
    }
  }

  function handleMessage(consultantId) {
    navigate(`/consultation/chat/${consultantId}`)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Consultation</h1>
        <p className="text-ink/55 mt-1">
          Connect directly with mental health consultants and specialists for real, one-on-one support.
        </p>
      </div>

      <div className="bg-brand-greenLight rounded-xl2 p-4 flex items-start gap-3">
        <ShieldCheck size={18} className="text-brand-green shrink-0 mt-0.5" />
        <p className="text-sm text-navy/80 leading-relaxed">
          Crisis helplines always remain completely free — see the{' '}
          <a href="/support" className="font-semibold underline">Support Organizations</a> page any time.
          Consultation plans below are for direct, ongoing sessions with individual professionals.
        </p>
      </div>

      {error && (
        <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
      )}

      {loading ? (
        <div className="space-y-4">
          <SkeletonBlock className="h-48 w-full" />
          <SkeletonBlock className="h-48 w-full" />
        </div>
      ) : (
        <div className="space-y-10">
          {groups?.map((group) => (
            <div key={group.tier}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold text-navy">{TIER_LABELS[group.tier].title}</h2>
                {!group.locked && <span className="text-xs text-ink/40 font-medium">{group.count} consultants</span>}
              </div>

              {group.locked ? (
                <LockedTierCard tier={group.tier} price={group.price} count={group.count} onUnlock={handleUnlock} purchasing={purchasing} />
              ) : group.consultants.length === 0 ? (
                <div className="bg-white rounded-xl2 shadow-card p-8 text-center text-sm text-ink/50">
                  No consultants have been added to this plan yet — check back soon.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.consultants.map((c) => (
                    <ConsultantCard key={c.id} consultant={c} onMessage={handleMessage} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
