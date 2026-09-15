import React, { useEffect, useState } from 'react'
import { Heart, Music, Video, Wind, Headphones, Trash2 } from 'lucide-react'
import api from '../api/axios.js'
import { SkeletonCard } from '../components/Skeleton.jsx'
import SmartThumbnail from '../components/SmartThumbnail.jsx'

const FILTERS = [
  { key: 'all', label: 'All', icon: Heart },
  { key: 'music', label: 'Music', icon: Music },
  { key: 'video', label: 'Videos', icon: Video },
  { key: 'meditation', label: 'Meditation', icon: Wind },
  { key: 'podcasts', label: 'Podcasts', icon: Headphones },
]

export default function Favorites() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  function load() {
    setLoading(true)
    api.get('/api/favorites').then((res) => setItems(res.data)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleRemove(id) {
    await api.delete(`/api/favorites/${id}`)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.content_type === filter)

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Favorites</h1>
        <p className="text-ink/55 mt-1">Videos, songs, and meditations you've saved.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors focus-ring ${
              filter === f.key ? 'bg-brand-green text-white' : 'bg-white text-ink/60 hover:bg-brand-greenLight shadow-card'
            }`}
          >
            <f.icon size={14} /> {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-card py-16 text-center">
          <Heart className="mx-auto text-ink/20 mb-3" size={36} />
          <p className="text-sm text-ink/50">Nothing saved here yet. Tap the heart icon on any resource to add it.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <FavoriteCard key={item.id} item={item} onRemove={() => handleRemove(item.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function FavoriteCard({ item, onRemove }) {
  let metadata = {}
  try {
    metadata = item.extra ? JSON.parse(item.extra) : {}
  } catch {
    metadata = {}
  }

  const isAudio = metadata.media_type === 'audio' || item.content_type === 'podcasts'
  const sourceUrl = metadata.url || (
    item.content_id?.startsWith('dailymotion:')
      ? `https://www.dailymotion.com/video/${item.content_id.slice('dailymotion:'.length)}`
      : item.content_id?.startsWith('listennotes:')
        ? `https://www.listennotes.com/e/${item.content_id.slice('listennotes:'.length)}/`
        : `https://www.youtube.com/watch?v=${item.content_id}`
  )

  return (
    <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
      {item.content_id && (
        <div className="relative">
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            <SmartThumbnail
              videoId={metadata.provider ? undefined : item.content_id}
              thumbnail={item.thumbnail}
              alt={item.title}
              className="w-full aspect-video object-cover"
            />
          </a>
          {isAudio && metadata.audio_url && (
            <audio src={metadata.audio_url} controls preload="none" className="absolute bottom-2 left-2 right-2 w-[calc(100%-1rem)]" />
          )}
        </div>
      )}
      <div className="p-3.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy leading-snug line-clamp-2">{item.title}</p>
          <p className="text-xs text-ink/50 mt-1">{item.channel}</p>
        </div>
        <button
          onClick={onRemove}
          className="shrink-0 p-1.5 rounded-full text-ink/30 hover:text-red-500 hover:bg-red-50 transition-colors focus-ring"
          aria-label="Remove favorite"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}