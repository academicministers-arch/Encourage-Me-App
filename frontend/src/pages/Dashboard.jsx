import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Heart, Mic, MicOff } from 'lucide-react'
import api from '../api/axios.js'
import { useAuth } from '../context/AuthContext.jsx'
import EmotionIcon, { EMOTION_LIST } from '../components/EmotionIcon.jsx'
import VideoCard from '../components/VideoCard.jsx'
import QuoteCard from '../components/QuoteCard.jsx'
import CrisisBanner from '../components/CrisisBanner.jsx'
import StreakCelebration from '../components/StreakCelebration.jsx'
import OnThisDayCard from '../components/OnThisDayCard.jsx'
import { SkeletonCard } from '../components/Skeleton.jsx'
import { moodGradient } from '../utils/moodTheme.js'

const TODAY = new Date().toLocaleDateString(undefined, {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
})

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100]

function getMediaId(item) {
  return item.media_id || item.video_id || item.episode_id
}

export default function Dashboard() {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [selectedEmotion, setSelectedEmotion] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [celebrationStreak, setCelebrationStreak] = useState(null)
  const [todayMood, setTodayMood] = useState(null)
  const [onThisDay, setOnThisDay] = useState([])
  const [extraVideos, setExtraVideos] = useState({ music: [], videos: [], meditation: [], podcasts: [], quotes: [] })
  const [loadingMore, setLoadingMore] = useState({ music: false, videos: false, meditation: false, podcasts: false, quotes: false })
  const [hasMore, setHasMore] = useState({ music: true, videos: true, meditation: true, podcasts: true, quotes: true })

  const MAX_PER_CATEGORY = 50
  const CATEGORY_TO_BACKEND = { music: 'music', videos: 'motivation', meditation: 'meditation', podcasts: 'podcasts', quotes: 'quotes' }
  const ITEM_ID_FIELD = { music: 'media_id', videos: 'media_id', meditation: 'media_id', podcasts: 'media_id', quotes: 'quote_id' }

  useEffect(() => {
    api.get('/api/favorites').then((res) => {
      setFavoriteIds(new Set(res.data.map((f) => f.content_id)))
    }).catch(() => {})
    api.get('/api/journey/today-mood').then((res) => {
      setTodayMood(res.data.emotion)
    }).catch(() => {})
    api.get('/api/journey/on-this-day').then((res) => {
      setOnThisDay(res.data)
    }).catch(() => {})
  }, [])

  const SpeechRecognitionAPI =
    typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

  function toggleVoiceInput() {
    if (!SpeechRecognitionAPI) {
      setError("Voice input isn't supported in this browser — try Chrome or Edge, or just type instead.")
      return
    }
    if (isListening) {
      setIsListening(false)
      return
    }
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }
    recognition.start()
  }

  async function handleCheckIn(e) {
    e?.preventDefault()
    if (!message.trim() && !selectedEmotion) {
      setError('Type how you feel, or choose an emotion card below.')
      return
    }
    setError('')
    setSubmitting(true)
    setResult(null)
    try {
      const res = await api.post('/api/checkin', {
        message: message.trim() || undefined,
        emotion: selectedEmotion || undefined,
      })
      setResult(res.data)
      setExtraVideos({ music: [], videos: [], meditation: [], podcasts: [], quotes: [] })
      setHasMore({ music: true, videos: true, meditation: true, podcasts: true, quotes: true })
      setLoadingMore({ music: false, videos: false, meditation: false, podcasts: false, quotes: false })
      setMessage('')
      setSelectedEmotion(null)
      api.get('/api/journey/today-mood').then((r) => setTodayMood(r.data.emotion)).catch(() => {})

      const streak = res.data.current_streak
      if (STREAK_MILESTONES.includes(streak)) {
        const key = `encourage_me_celebrated_${user?.id}`
        const celebrated = JSON.parse(localStorage.getItem(key) || '[]')
        if (!celebrated.includes(streak)) {
          setCelebrationStreak(streak)
          localStorage.setItem(key, JSON.stringify([...celebrated, streak]))
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong saving your check-in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function loadMore(key) {
    if (!result || loadingMore[key] || !hasMore[key]) return

    const currentShown = [
      ...(result.recommendations[key] || []),
      ...(extraVideos[key] || []),
    ]
    if (currentShown.length >= MAX_PER_CATEGORY) {
      setHasMore((prev) => ({ ...prev, [key]: false }))
      return
    }

    setLoadingMore((prev) => ({ ...prev, [key]: true }))
    try {
      const topic = result.recommendations.topics?.[key] || key
      const idField = ITEM_ID_FIELD[key] || 'video_id'
      const excludeIds = currentShown.map((v) => v[idField] || getMediaId(v)).filter(Boolean).join(',')
      const remaining = MAX_PER_CATEGORY - currentShown.length
      const count = Math.min(6, remaining)

      const res = await api.get('/api/checkin/more-recommendations', {
        params: {
          category: CATEGORY_TO_BACKEND[key],
          topic,
          exclude: excludeIds,
          count,
        },
      })

      setExtraVideos((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), ...res.data.items],
      }))
      setHasMore((prev) => ({
        ...prev,
        [key]: res.data.has_more && (currentShown.length + res.data.items.length) < MAX_PER_CATEGORY,
      }))
    } catch {
      setHasMore((prev) => ({ ...prev, [key]: false }))
    } finally {
      setLoadingMore((prev) => ({ ...prev, [key]: false }))
    }
  }

  async function toggleFavorite(video, contentType) {
    const mediaId = getMediaId(video)
    const isFav = favoriteIds.has(mediaId)
    if (isFav) {
      // best-effort: refetch to find id then delete
      const res = await api.get('/api/favorites')
      const match = res.data.find((f) => f.content_id === mediaId)
      if (match) await api.delete(`/api/favorites/${match.id}`)
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        next.delete(mediaId)
        return next
      })
    } else {
      await api.post('/api/favorites', {
        content_type: contentType,
        content_id: mediaId,
        title: video.title,
        thumbnail: video.thumbnail,
        channel: video.channel,
        extra: JSON.stringify({
          provider: video.provider,
          media_type: video.media_type,
          audio_url: video.audio_url,
          embed_url: video.embed_url,
          url: video.url,
        }),
      })
      setFavoriteIds((prev) => new Set(prev).add(mediaId))
    }
  }

  return (
    <div className="relative min-h-full">
      <div
        className="absolute inset-0 -z-10 transition-[background] duration-1000 ease-out"
        style={{ background: moodGradient(todayMood) }}
        aria-hidden="true"
      />
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <StreakCelebration streak={celebrationStreak} onDismiss={() => setCelebrationStreak(null)} />

        {/* Greeting */}
      <div>
        <p className="text-xs font-semibold text-brand-green uppercase tracking-wide mb-1">{TODAY}</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-navy">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}.
        </h1>
        <p className="text-ink/55 mt-1">Today is a great day to invest in your wellbeing.</p>
      </div>

      <OnThisDayCard entries={onThisDay} />

      {/* Check-in card */}
      <div className="bg-white rounded-xl2 shadow-card p-6 md:p-8">
        <h2 className="font-display text-lg font-bold text-navy mb-1">How are you feeling today?</h2>
        <p className="text-sm text-ink/50 mb-5">Describe it in your own words, or pick what fits best.</p>

        <form onSubmit={handleCheckIn} className="space-y-5">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. I feel stressed about my exams…"
              rows={3}
              className="w-full resize-none rounded-lg border border-black/10 pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green transition-colors"
            />
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`absolute right-3 top-3 p-1.5 rounded-full transition-colors focus-ring ${
                isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-ink/30 hover:text-brand-green hover:bg-brand-greenLight'
              }`}
              aria-label={isListening ? 'Stop recording' : 'Speak instead of typing'}
              title={isListening ? 'Listening… tap to stop' : 'Speak instead of typing'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide mb-3">Or choose an emotion</p>
            <div className="grid grid-cols-5 gap-2.5">
              {EMOTION_LIST.map((emo) => (
                <button
                  type="button"
                  key={emo}
                  onClick={() => setSelectedEmotion(selectedEmotion === emo ? null : emo)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all focus-ring ${
                    selectedEmotion === emo
                      ? 'border-brand-green bg-brand-greenLight'
                      : 'border-black/10 hover:border-brand-green/40 hover:bg-surface'
                  }`}
                >
                  <EmotionIcon name={emo} className="w-7 h-7" />
                  <span className="text-[11px] font-medium text-navy">{emo}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-green text-white px-6 py-2.75 rounded-lg text-sm font-semibold hover:bg-brand-greenDark transition-colors disabled:opacity-60 focus-ring"
          >
            {submitting ? 'Analyzing…' : 'Check in'}
            {!submitting && <Send size={16} />}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <CrisisBanner crisisSupport={result.crisis_support} />

            {/* AI response */}
            <div className="bg-navy rounded-xl2 p-6 text-white flex gap-4 items-start">
              <Sparkles size={22} className="text-brand-green shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1">
                  {result.entry.emotion}
                </p>
                <p className="text-sm md:text-base leading-relaxed">{result.entry.ai_response}</p>
              </div>
            </div>

            {result.analysis && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white rounded-xl2 shadow-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-green mb-2">What may be happening</p>
                  <p className="text-sm text-navy leading-relaxed">{result.analysis.feeling}</p>
                </div>
                <div className="bg-white rounded-xl2 shadow-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-green mb-2">What you may need</p>
                  <p className="text-sm text-navy leading-relaxed">{result.analysis.need}</p>
                </div>
                <div className="bg-white rounded-xl2 shadow-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-green mb-2">A gentle next step</p>
                  <p className="text-sm text-navy leading-relaxed">{result.analysis.next_step}</p>
                </div>
                <div className="bg-white rounded-xl2 shadow-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-green mb-2">Content chosen for you</p>
                  <p className="text-sm text-navy leading-relaxed">{result.analysis.content_focus}</p>
                </div>
              </div>
            )}

            {/* Affirmation */}
            <div className="bg-brand-greenLight rounded-xl2 p-5 flex gap-3">
              <Heart size={20} className="text-brand-green shrink-0" />
              <p className="text-sm text-navy font-medium leading-relaxed">
                {result.recommendations.affirmation}
              </p>
            </div>

            {/* Recommendations */}
            {['music', 'videos', 'meditation', 'podcasts', 'quotes'].map((key) => {
              const allItems = [...(result.recommendations[key] || []), ...(extraVideos[key] || [])]
              const idField = ITEM_ID_FIELD[key] || 'video_id'
              const labels = { music: 'Music for You', videos: 'Motivational Videos', meditation: 'Meditation', podcasts: 'Stories & Podcasts', quotes: 'Quotes' }
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-bold text-navy">{labels[key]}</h3>
                    <span className="text-xs text-ink/40 font-medium">{allItems.length} options</span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allItems.map((item) =>
                      key === 'quotes' ? (
                        <QuoteCard key={item.quote_id} quote={item} />
                      ) : (
                        <VideoCard
                          key={getMediaId(item)}
                          video={item}
                          contentType={key === 'videos' ? 'video' : key === 'music' ? 'music' : key}
                          onToggleFavorite={toggleFavorite}
                          isFavorite={favoriteIds.has(getMediaId(item))}
                        />
                      )
                    )}
                  </div>
                  {hasMore[key] && (
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => loadMore(key)}
                        disabled={loadingMore[key]}
                        className="px-5 py-2.5 rounded-lg bg-white border border-black/10 text-sm font-semibold text-navy hover:border-brand-green hover:text-brand-green transition-colors disabled:opacity-50 focus-ring shadow-card"
                      >
                        {loadingMore[key] ? 'Loading…' : 'Load more'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {!result && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}
      </div>
    </div>
  )
}
