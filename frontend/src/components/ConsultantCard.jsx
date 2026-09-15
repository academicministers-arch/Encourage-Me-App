import React from 'react'
import { Mail, Phone, Award, Sparkles } from 'lucide-react'

export default function ConsultantCard({ consultant }) {
  const specialties = (consultant.specialties || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

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
        <div className="flex items-center gap-1.5 text-xs text-ink/55">
          <Award size={13} className="text-brand-green shrink-0" />
          <span>{consultant.experience_summary}</span>
        </div>
      )}

      {consultant.bio && (
        <p className="text-sm text-ink/70 leading-relaxed line-clamp-3">{consultant.bio}</p>
      )}

      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {specialties.map((s) => (
            <span key={s} className="text-[11px] font-medium text-navy bg-surface px-2 py-1 rounded-full">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-1.5 pt-2 border-t border-black/5 mt-1">
        {consultant.contact_email && (
          <a
            href={`mailto:${consultant.contact_email}`}
            className="flex items-center gap-2 text-sm text-navy font-medium hover:underline"
          >
            <Mail size={14} className="text-brand-green shrink-0" />
            <span className="truncate">{consultant.contact_email}</span>
          </a>
        )}
        {consultant.contact_phone && (
          <a
            href={`tel:${consultant.contact_phone.replace(/\s/g, '')}`}
            className="flex items-center gap-2 text-sm text-navy font-medium hover:underline"
          >
            <Phone size={14} className="text-brand-green shrink-0" />
            <span>{consultant.contact_phone}</span>
          </a>
        )}
        {!consultant.contact_email && !consultant.contact_phone && (
          <p className="flex items-center gap-2 text-xs text-ink/40">
            <Sparkles size={13} /> Contact details coming soon
          </p>
        )}
      </div>
    </div>
  )
}
