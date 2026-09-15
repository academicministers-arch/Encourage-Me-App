import React, { useEffect, useState } from 'react'
import { Phone, Mail, Globe, MapPin, ShieldAlert, HeartHandshake } from 'lucide-react'
import api from '../api/axios.js'
import { SkeletonBlock } from '../components/Skeleton.jsx'

function OrgCard({ org }) {
  return (
    <div className="bg-white rounded-xl2 shadow-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-bold text-navy leading-snug">{org.name}</h3>
        {org.emergency ? (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
            <ShieldAlert size={11} /> Crisis Support
          </span>
        ) : (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-brand-green bg-brand-greenLight px-2 py-1 rounded-full">
            <HeartHandshake size={11} /> Support
          </span>
        )}
      </div>

      <p className="text-xs font-semibold text-ink/40 uppercase tracking-wide">{org.category}</p>
      <p className="text-sm text-ink/70 leading-relaxed">{org.description}</p>

      <div className="space-y-2 pt-2 border-t border-black/5 mt-1">
        <div className="flex items-start gap-2 text-sm text-ink/70">
          <MapPin size={15} className="text-brand-green shrink-0 mt-0.5" />
          <span>{org.location}</span>
        </div>

        {org.phone && (
          <div className="flex items-start gap-2 text-sm">
            <Phone size={15} className="text-brand-green shrink-0 mt-0.5" />
            <a href={`tel:${org.phone.replace(/\s/g, '')}`} className="text-navy font-medium hover:underline">
              {org.phone}
            </a>
          </div>
        )}
        {org.phone_note && (
          <p className="text-xs text-ink/45 pl-6 -mt-1">{org.phone_note}</p>
        )}

        {org.email && (
          <div className="flex items-start gap-2 text-sm">
            <Mail size={15} className="text-brand-green shrink-0 mt-0.5" />
            <a href={`mailto:${org.email}`} className="text-navy font-medium hover:underline break-all">
              {org.email}
            </a>
          </div>
        )}

        {org.website && (
          <div className="flex items-start gap-2 text-sm">
            <Globe size={15} className="text-brand-green shrink-0 mt-0.5" />
            <a href={org.website} target="_blank" rel="noreferrer" className="text-navy font-medium hover:underline break-all">
              {org.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SupportOrganizations() {
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [countryFilter, setCountryFilter] = useState('all')

  useEffect(() => {
    api.get('/api/organizations').then((res) => setOrgs(res.data)).finally(() => setLoading(false))
  }, [])

  const countries = ['all', ...new Set(orgs.map((o) => o.country))]
  const filtered = countryFilter === 'all' ? orgs : orgs.filter((o) => o.country === countryFilter)

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Support Organizations</h1>
        <p className="text-ink/55 mt-1">
          Free, real organizations you can reach out to for mental health support, legal aid, and crisis help.
        </p>
      </div>

      <div className="bg-brand-greenLight rounded-xl2 p-4 text-sm text-navy/80 leading-relaxed">
        Contact details are provided in good faith and may change over time — please verify directly with the
        organization when reaching out. If you're in immediate danger, contact your local emergency services first.
      </div>

      {!loading && countries.length > 2 && (
        <div className="flex gap-2 flex-wrap">
          {countries.map((c) => (
            <button
              key={c}
              onClick={() => setCountryFilter(c)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                countryFilter === c ? 'bg-brand-green text-white' : 'bg-white text-ink/60 hover:bg-brand-greenLight shadow-card'
              }`}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-56 w-full" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((org) => <OrgCard key={org.id} org={org} />)}
        </div>
      )}
    </div>
  )
}