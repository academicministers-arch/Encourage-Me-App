import React, { useState } from 'react'
import { Play, Heart, X, ExternalLink } from 'lucide-react'
import SmartThumbnail from './SmartThumbnail.jsx'

export default function VideoCard({ video, contentType, onToggleFavorite, isFavorite }) {
  const [playing, setPlaying] = useState(false)
  const isAudio = video.media_type === 'audio'
  const mediaId = video.media_id || video.video_id || video.episode_id
  const youtubeVideoId = video.provider === 'youtube' || (!video.provider && video.video_id)

  return (
    <div className="bg-white rounded-xl2 shadow-card hover:shadow-cardHover transition-shadow overflow-hidden group">
      <div className="relative aspect-video bg-navy/5">
        {isAudio ? (
          <div className="w-full h-full p-4 flex flex-col justify-end gap-3 bg-navy/5">
            <img
              src={video.thumbnail}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-25"
              onError={(event) => { event.currentTarget.style.display = 'none' }}
            />
            <div className="relative z-10">
              <audio src={video.audio_url} controls preload="none" className="w-full" />
            </div>
          </div>
        ) : playing ? (
          <>
            <iframe
              src={`${video.embed_url}${video.embed_url.includes('?') ? '&' : '?'}autoplay=1`}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={() => setPlaying(false)}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 focus-ring"
              aria-label="Close player"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="w-full h-full relative focus-ring"
            aria-label={`Play ${video.title}`}
          >
            <SmartThumbnail
              videoId={youtubeVideoId ? video.video_id : undefined}
              thumbnail={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-navy/20 group-hover:bg-navy/35 transition-colors flex items-center justify-center">
              <span className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                <Play size={18} className="text-navy ml-0.5" fill="currentColor" />
              </span>
            </div>
          </button>
        )}
      </div>
      <div className="p-3.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy leading-snug line-clamp-2">{video.title}</p>
          <p className="text-xs text-ink/50 mt-1">{video.channel}</p>
          {video.url && (
            <a
              href={video.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-brand-green mt-1 hover:underline"
            >
              Open source <ExternalLink size={11} />
            </a>
          )}
        </div>
        <button
          onClick={() => onToggleFavorite(video, contentType)}
          className={`shrink-0 p-1.5 rounded-full hover:bg-brand-greenLight transition-colors focus-ring ${
            isFavorite ? 'text-brand-green' : 'text-ink/30'
          }`}
          aria-label="Save to favorites"
        >
          <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  )
}