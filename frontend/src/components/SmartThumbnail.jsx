import React, { useState } from 'react'
import { ImageOff } from 'lucide-react'

// YouTube generates several thumbnail resolutions per video, but not
// every resolution exists for every video (this is common for Shorts,
// deleted, or private videos). Rather than showing a broken image icon,
// this tries progressively lower-resolution variants, then falls back to
// a clean branded placeholder if none of them exist.
const QUALITY_FALLBACKS = ['hqdefault', 'mqdefault', 'default']

export default function SmartThumbnail({ videoId, thumbnail, alt, className = '' }) {
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)

  function handleError() {
    const nextAttempt = attempt + 1
    if (videoId && nextAttempt < QUALITY_FALLBACKS.length) {
      setAttempt(nextAttempt)
    } else {
      setFailed(true)
    }
  }

  if (failed || (!thumbnail && !videoId)) {
    return (
      <div className={`flex items-center justify-center bg-navy/5 ${className}`}>
        <ImageOff size={22} className="text-ink/25" />
      </div>
    )
  }

  const src = attempt === 0 && thumbnail
    ? thumbnail
    : videoId
      ? `https://img.youtube.com/vi/${videoId}/${QUALITY_FALLBACKS[attempt]}.jpg`
      : thumbnail

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleError}
    />
  )
}