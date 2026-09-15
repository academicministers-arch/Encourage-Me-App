import React from 'react'

export default function PageLoading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-[3px] border-brand-green/25 border-t-brand-green animate-spin" />
        <p className="text-sm text-ink/50 font-medium">Loading Encourage Me…</p>
      </div>
    </div>
  )
}
