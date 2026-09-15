import React, { useState } from 'react'
import { HeartHandshake, Phone, MessageCircle, Globe2, X } from 'lucide-react'

const ICONS = {
  'Mental Health Uganda (MHU)': Phone,
  'FIDA Uganda': Phone,
  'Find a Helpline': Globe2,
}

export default function CrisisBanner({ crisisSupport }) {
  const [dismissed, setDismissed] = useState(false)
  if (!crisisSupport || dismissed) return null

  const immediateResources = (crisisSupport.resources || []).filter(
    (resource) => resource.type === 'immediate'
  )
  if (!immediateResources.length) return null

  return (
    <div className="bg-white border-2 border-brand-green/30 rounded-xl2 shadow-card p-6 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-ink/30 hover:text-ink/60 p-1 rounded-lg focus-ring"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      <div className="flex gap-3 items-start pr-6">
        <div className="w-10 h-10 rounded-full bg-brand-greenLight flex items-center justify-center shrink-0">
          <HeartHandshake size={20} className="text-brand-green" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display font-bold text-navy mb-1">You're not alone in this</h3>
          <p className="text-sm text-ink/70 leading-relaxed">{crisisSupport.message}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mt-5">
        {immediateResources.map((r) => {
          const Icon = ICONS[r.name] || Phone
          return (
            <div key={r.name} className="bg-surface rounded-lg p-4 flex flex-col gap-1.5">
              <Icon size={16} className="text-brand-green" />
              <p className="text-xs font-semibold text-navy">{r.name}</p>
              <p className="text-xs text-ink/55">{r.detail}</p>
              <p className="text-[10px] text-ink/35 uppercase tracking-wide">{r.region}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
