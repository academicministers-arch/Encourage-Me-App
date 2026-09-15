import React from 'react'
import { Quote as QuoteIcon, Download } from 'lucide-react'
import { downloadEncouragementCard } from '../utils/shareCard.js'

export default function QuoteCard({ quote }) {
  return (
    <div className="bg-white rounded-xl2 shadow-card hover:shadow-cardHover transition-shadow p-5 flex flex-col gap-3">
      <QuoteIcon size={18} className="text-brand-green shrink-0" />
      <p className="text-sm text-ink/75 italic leading-relaxed flex-1">"{quote.text}"</p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink/45">— {quote.author}</p>
        <button
          onClick={() => downloadEncouragementCard({ text: quote.text, author: quote.author })}
          className="text-ink/30 hover:text-brand-green p-1.5 rounded-lg hover:bg-brand-greenLight transition-colors focus-ring"
          aria-label="Download as shareable image"
          title="Download as image"
        >
          <Download size={15} />
        </button>
      </div>
    </div>
  )
}