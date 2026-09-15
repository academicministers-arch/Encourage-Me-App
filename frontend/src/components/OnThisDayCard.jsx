import React from 'react'
import { Clock } from 'lucide-react'
import EmotionIcon from './EmotionIcon.jsx'

export default function OnThisDayCard({ entries }) {
  if (!entries || entries.length === 0) return null

  return (
    <div className="bg-white rounded-xl2 shadow-card p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={16} className="text-brand-green" />
        <h2 className="font-display font-bold text-navy text-sm">On This Day</h2>
      </div>
      <div className={`grid gap-3 ${entries.length > 1 ? 'sm:grid-cols-2' : ''}`}>
        {entries.map((entry) => (
          <div key={entry.label} className="bg-surface rounded-lg p-4 flex gap-3">
            <EmotionIcon name={entry.emotion} className="w-8 h-8 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-brand-green uppercase tracking-wide mb-1">
                {entry.label}
              </p>
              {entry.message ? (
                <p className="text-sm text-ink/70 leading-snug line-clamp-3">"{entry.message}"</p>
              ) : (
                <p className="text-sm text-ink/70">You felt {entry.emotion.toLowerCase()}.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
