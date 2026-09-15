// Hand-crafted SVG emotion icons — deliberately not emoji, not Lucide's generic
// smiley set. Each face shares one line weight and eye style so the set reads
// as a single family across the app.
import React from 'react'

const stroke = '#0B1F3A'

function Face({ children }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <circle cx="24" cy="24" r="19" stroke={stroke} strokeWidth="2" />
      {children}
    </svg>
  )
}

const EYES = <>
  <circle cx="17.5" cy="20.5" r="1.8" fill={stroke} />
  <circle cx="30.5" cy="20.5" r="1.8" fill={stroke} />
</>

export const ICONS = {
  Happy: () => (
    <Face>
      {EYES}
      <path d="M15 28c2.2 3.2 5.6 5 9 5s6.8-1.8 9-5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </Face>
  ),
  Sad: () => (
    <Face>
      {EYES}
      <path d="M15 32c2.2-3.2 5.6-5 9-5s6.8 1.8 9 5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </Face>
  ),
  Stressed: () => (
    <Face>
      <path d="M14.5 19.5l6 2M33.5 19.5l-6 2" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 30.5c3.5-2.5 12.5-2.5 16 0" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </Face>
  ),
  Anxious: () => (
    <Face>
      <circle cx="17.5" cy="20.5" r="2.4" fill={stroke} />
      <circle cx="30.5" cy="20.5" r="2.4" fill={stroke} />
      <path d="M18 30.5q6-3 12 0" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </Face>
  ),
  Angry: () => (
    <Face>
      <path d="M14.5 18l6 3M33.5 18l-6 3" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 31.5c3.5-2.8 12.5-2.8 16 0" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </Face>
  ),
  Lonely: () => (
    <Face>
      <circle cx="17.5" cy="20.5" r="1.8" fill={stroke} />
      <circle cx="30.5" cy="20.5" r="1.8" fill={stroke} />
      <path d="M18 30h12" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M30 27.5v6" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
    </Face>
  ),
  Excited: () => (
    <Face>
      <path d="M14.5 22l6-3.5M33.5 22l-6-3.5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M15 27c2.4 4 5.8 6 9 6s6.6-2 9-6" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </Face>
  ),
  Motivated: () => (
    <Face>
      {EYES}
      <path d="M16 29.5h16" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M24 12v3M14 15l2 2M34 15l-2 2" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
    </Face>
  ),
  Confused: () => (
    <Face>
      <circle cx="17.5" cy="20.5" r="1.8" fill={stroke} />
      <path d="M27 19.5q3.5-2 7 0" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 30.5q7-4 14-1" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </Face>
  ),
  Calm: () => (
    <Face>
      <path d="M14.5 20.5h6M28 20.5h6" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M17 29c2.2 1.6 4.6 2.4 7 2.4s4.8-.8 7-2.4" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </Face>
  ),
}

export const EMOTION_LIST = Object.keys(ICONS)

export default function EmotionIcon({ name, className = '' }) {
  const Cmp = ICONS[name] || ICONS.Calm
  return (
    <div className={className}>
      <Cmp />
    </div>
  )
}
