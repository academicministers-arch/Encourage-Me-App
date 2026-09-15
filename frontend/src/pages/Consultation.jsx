import React from 'react'
import { Clock3 } from 'lucide-react'

export default function Consultation() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Consultation</h1>
        <p className="text-ink/55 mt-1">
          Connect directly with mental health consultants and specialists for one-on-one support.
        </p>
      </div>

      <div className="bg-white rounded-xl2 shadow-card p-10 md:p-16 text-center">
        <div className="w-14 h-14 rounded-full bg-brand-greenLight flex items-center justify-center mx-auto mb-5">
          <Clock3 size={24} className="text-brand-green" />
        </div>
        <h2 className="font-display text-xl font-bold text-navy mb-2">Coming soon</h2>
        <p className="text-ink/55 max-w-md mx-auto leading-relaxed">
          Consultation services will open after we finish dealing with the payment procedures.
          Thank you for your patience.
        </p>
      </div>
    </div>
  )
}
