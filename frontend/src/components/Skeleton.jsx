import React from 'react'

export function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton rounded-lg ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl2 shadow-card p-4 space-y-3">
      <SkeletonBlock className="h-32 w-full" />
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-3 w-1/2" />
    </div>
  )
}
