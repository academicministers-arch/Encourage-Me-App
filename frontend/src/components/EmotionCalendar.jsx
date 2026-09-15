import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Image as ImageIcon, Palette, RotateCcw, Search, UploadCloud, Sparkles } from 'lucide-react'
import api from '../api/axios.js'
import { useAuth } from '../context/AuthContext.jsx'
import EmotionIcon from './EmotionIcon.jsx'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function createPatternImage(colors, motif) {
  const [base, accent, detail] = colors
  const shapes = {
    floral: `
      <rect width="100%" height="100%" fill="${base}" />
      <g fill="${accent}" opacity="0.9">
        <circle cx="180" cy="200" r="70" />
        <circle cx="320" cy="150" r="48" />
        <circle cx="260" cy="280" r="58" />
        <circle cx="420" cy="240" r="64" />
      </g>
      <g fill="${detail}" opacity="0.74">
        <circle cx="180" cy="200" r="28" />
        <circle cx="320" cy="150" r="20" />
        <circle cx="260" cy="280" r="22" />
        <circle cx="420" cy="240" r="24" />
      </g>
      <path d="M100 620C180 520 280 500 360 560C430 610 510 620 620 540" stroke="${detail}" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.65" />
    `,
    luxury: `
      <rect width="100%" height="100%" fill="${base}" />
      <rect x="90" y="90" width="1020" height="620" rx="40" fill="${accent}" opacity="0.25" />
      <path d="M250 620C330 470 470 390 610 430C720 460 812 534 910 620" stroke="${detail}" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.82" />
      <circle cx="310" cy="240" r="70" fill="${detail}" opacity="0.28" />
      <circle cx="812" cy="220" r="110" fill="${accent}" opacity="0.24" />
    `,
    anime: `
      <rect width="100%" height="100%" fill="${base}" />
      <path d="M140 240C300 120 460 120 620 240" stroke="${accent}" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.84" />
      <path d="M180 420C330 320 510 320 660 420" stroke="${detail}" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.8" />
      <circle cx="295" cy="270" r="24" fill="${detail}" opacity="0.85" />
      <circle cx="516" cy="268" r="24" fill="${detail}" opacity="0.85" />
      <circle cx="400" cy="340" r="14" fill="${accent}" opacity="0.8" />
    `,
    minimalist: `
      <rect width="100%" height="100%" fill="${base}" />
      <rect x="120" y="120" width="960" height="560" rx="38" fill="none" stroke="${accent}" stroke-width="12" opacity="0.85" />
      <rect x="220" y="220" width="760" height="360" rx="28" fill="${detail}" opacity="0.14" />
      <path d="M220 560L420 320L620 480L780 310L980 520" stroke="${accent}" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.75" />
    `,
    seasonal: `
      <rect width="100%" height="100%" fill="${base}" />
      <circle cx="270" cy="240" r="90" fill="${accent}" opacity="0.65" />
      <path d="M250 340C250 430 308 500 380 520" stroke="${detail}" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.8" />
      <path d="M620 220C680 160 760 150 820 220" stroke="${detail}" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.8" />
      <circle cx="760" cy="420" r="82" fill="${accent}" opacity="0.22" />
    `,
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">
      ${shapes[motif] || shapes.minimalist}
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const THEME_PACKS = []

const THEME_CATEGORY_CONFIG = [
  { key: 'all', label: 'All' },
  { key: 'ladies', label: 'Ladies' },
  { key: 'men', label: 'Men' },
  { key: 'kids', label: 'Kids' },
  { key: 'cute', label: 'Cute' },
  { key: 'sports', label: 'Sports' },
  { key: 'floral', label: 'Floral' },
  { key: 'luxury', label: 'Luxury' },
  { key: 'anime', label: 'Anime' },
  { key: 'minimalist', label: 'Minimalist' },
  { key: 'seasonal', label: 'Seasonal' },
]

const EMOTION_STYLES = {
  happy: { label: 'Happy', color: '#2E8B57', soft: '#E8F7EE' },
  sad: { label: 'Sad', color: '#4F46E5', soft: '#EEF2FF' },
  stressed: { label: 'Stressed', color: '#F59E0B', soft: '#FFFBEB' },
  anxious: { label: 'Anxious', color: '#8B5CF6', soft: '#F5F3FF' },
  angry: { label: 'Angry', color: '#DC2626', soft: '#FEF2F2' },
  lonely: { label: 'Lonely', color: '#64748B', soft: '#F8FAFC' },
  excited: { label: 'Excited', color: '#EC4899', soft: '#FDF2F8' },
  motivated: { label: 'Motivated', color: '#0F766E', soft: '#F0FDFD' },
  confused: { label: 'Confused', color: '#A16207', soft: '#FFFBEB' },
  calm: { label: 'Calm', color: '#2563EB', soft: '#EFF6FF' },
}

function toEmotionKey(value) {
  if (!value) return 'Calm'
  const normalized = String(value).trim().toLowerCase()
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function formatDateKey(value) {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildCalendarDays(viewDate) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startDay = (firstDay.getDay() + 6) % 7

  const cells = []
  const prevMonthLastDay = new Date(year, month, 0).getDate()

  for (let i = startDay - 1; i >= 0; i -= 1) {
    const day = prevMonthLastDay - i
    cells.push({ date: new Date(year, month - 1, day), inMonth: false })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), inMonth: true })
  }

  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - daysInMonth - startDay + 1
    cells.push({ date: new Date(year, month + 1, nextDay), inMonth: false })
  }

  return cells
}

export default function EmotionCalendar({ entries = [] }) {
  const { user } = useAuth()
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedThemeId, setSelectedThemeId] = useState(THEME_PACKS[0]?.id || '')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [backgroundImage, setBackgroundImage] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchPage, setSearchPage] = useState(1)
  const [searchHasMore, setSearchHasMore] = useState(false)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const initialPrefsRef = useRef(null)

  const packsForCategory = useMemo(
    () => selectedCategory === 'all'
      ? THEME_PACKS
      : THEME_PACKS.filter((theme) => theme.category === selectedCategory),
    [selectedCategory]
  )

  useEffect(() => {
    if (!user) {
      setSelectedThemeId(THEME_PACKS[0]?.id || '')
      setBackgroundImage('')
      initialPrefsRef.current = null
      setPreferencesLoaded(true)
      return
    }

    let active = true
    api.get('/api/settings')
      .then((res) => {
        if (!active) return
        const nextThemeId = res.data.calendar_theme_id || THEME_PACKS[0]?.id || ''
        const nextBackground = res.data.calendar_background_image || ''
        setSelectedThemeId(nextThemeId)
        setBackgroundImage(nextBackground)
        initialPrefsRef.current = { themeId: nextThemeId, backgroundImage: nextBackground }
        setPreferencesLoaded(true)
      })
      .catch(() => {
        if (!active) return
        setSelectedThemeId(THEME_PACKS[0]?.id || '')
        setBackgroundImage('')
        initialPrefsRef.current = { themeId: THEME_PACKS[0]?.id || '', backgroundImage: '' }
        setPreferencesLoaded(true)
      })

    return () => {
      active = false
    }
  }, [user?.id])

  useEffect(() => {
    if (!user || !preferencesLoaded) return

    const nextPrefs = { themeId: selectedThemeId, backgroundImage }
    const initialPrefs = initialPrefsRef.current || { themeId: '', backgroundImage: '' }
    if (JSON.stringify(initialPrefs) === JSON.stringify(nextPrefs)) return

    api.put('/api/settings', {
      calendar_theme_id: selectedThemeId || null,
      calendar_background_image: backgroundImage || null,
    }).then((res) => {
      initialPrefsRef.current = {
        themeId: res.data.calendar_theme_id || '',
        backgroundImage: res.data.calendar_background_image || '',
      }
    }).catch(() => {
      // Ignore transient save failures and keep the local state intact.
    })
  }, [user, preferencesLoaded, selectedThemeId, backgroundImage])

  const selectedTheme = useMemo(
    () => THEME_PACKS.find((theme) => theme.id === selectedThemeId) || null,
    [selectedThemeId]
  )

  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate])

  const dailyOverview = useMemo(() => {
    const map = new Map()
    entries.forEach((entry) => {
      const key = formatDateKey(entry.created_at)
      if (!map.has(key)) {
        map.set(key, { count: 0, emotion: null, entries: [] })
      }
      const bucket = map.get(key)
      bucket.count += 1
      bucket.entries.push(entry)
      const emotion = String(entry.emotion || 'calm').toLowerCase()
      if (!bucket.emotionCounts) bucket.emotionCounts = {}
      bucket.emotionCounts[emotion] = (bucket.emotionCounts[emotion] || 0) + 1
      const dominant = Object.entries(bucket.emotionCounts).sort((a, b) => b[1] - a[1])[0]
      bucket.emotion = dominant ? dominant[0] : emotion
    })
    return map
  }, [entries])

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  function shiftMonth(delta) {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1))
  }

  function resetPreferences() {
    const defaultThemeId = THEME_PACKS[0]?.id || ''
    setSelectedThemeId(defaultThemeId)
    setBackgroundImage('')
    if (user) {
      api.put('/api/settings', {
        calendar_theme_id: null,
        calendar_background_image: null,
      }).then((res) => {
        initialPrefsRef.current = {
          themeId: res.data.calendar_theme_id || defaultThemeId,
          backgroundImage: res.data.calendar_background_image || '',
        }
      })
    }
    setUploadMessage('')
    setUploadError('')
  }

  async function fetchPexelsThemes(query, page = 1) {
    if (!query.trim()) {
      setSearchError('Enter a search term like “sports”, “nature”, or “night city”.')
      return null
    }

    try {
      const res = await api.get('/api/themes/search', {
        params: { query: query.trim(), page, per_page: 12 },
      })
      return res.data.themes || []
    } catch (err) {
      setSearchError('Unable to load theme results. Please try again later.')
      return null
    }
  }

  async function handleThemeSearch(event) {
    event.preventDefault()
    if (!searchQuery.trim()) {
      setSearchError('Enter a search term like “sports”, “nature”, or “night city”.')
      return
    }

    setSearchLoading(true)
    setSearchError('')
    setSearchPage(1)
    try {
      const themes = await fetchPexelsThemes(searchQuery, 1)
      if (themes === null) {
        setSearchResults([])
        setSearchHasMore(false)
      } else {
        setSearchResults(themes)
        setSearchHasMore(themes.length === 12)
      }
    } finally {
      setSearchLoading(false)
    }
  }

  async function handleLoadMore() {
    if (loadingMore || !searchHasMore) return
    const nextPage = searchPage + 1
    setLoadingMore(true)
    setSearchError('')
    try {
      const themes = await fetchPexelsThemes(searchQuery, nextPage)
      if (themes === null) {
        return
      }
      setSearchResults((prev) => [...prev, ...themes])
      setSearchPage(nextPage)
      setSearchHasMore(themes.length === 12)
    } finally {
      setLoadingMore(false)
    }
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose a valid image file.')
      setUploadMessage('')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Please keep the image under 5MB.')
      setUploadMessage('')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        setBackgroundImage(result)
        setUploadMessage('Background image ready.')
        setUploadError('')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-navy">Emotion Calendar</h2>
          <p className="text-sm text-ink/55 mt-1">
            A guided monthly view of your dominant emotions with elegant theme packs, premium image styles, and photo-based backgrounds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => shiftMonth(-1)} className="rounded-lg border border-black/10 p-2 text-ink/65 hover:bg-slate-50" aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <div className="min-w-[140px] text-center text-sm font-semibold text-navy">{monthLabel}</div>
          <button type="button" onClick={() => shiftMonth(1)} className="rounded-lg border border-black/10 p-2 text-ink/65 hover:bg-slate-50" aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink/70">
            <Palette size={15} className="text-brand-green" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">Theme pack</span>
            <select
              value={selectedThemeId}
              onChange={(e) => setSelectedThemeId(e.target.value)}
              disabled={THEME_PACKS.length === 0}
              className={`bg-transparent text-sm outline-none ${THEME_PACKS.length === 0 ? 'cursor-not-allowed text-ink/40' : ''}`}
            >
              {THEME_PACKS.length === 0 ? (
                <option value="">No theme packs available</option>
              ) : (
                THEME_PACKS.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.categoryLabel} · {theme.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <form onSubmit={handleThemeSearch} className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink/70">
              <Search size={15} className="text-brand-green" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search photo themes"
                className="w-56 bg-transparent text-sm outline-none"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-greenDark transition-colors"
              disabled={searchLoading}
            >
              {searchLoading ? 'Searching…' : 'Search'}
            </button>
          </form>

          <label className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink/70">
            <UploadCloud size={15} className="text-brand-green" />
            <span className="text-xs font-semibold uppercase tracking-wide">Upload photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <span className="text-sm text-brand-green">Choose file</span>
          </label>

          <label className="flex min-w-[220px] items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink/70">
            <ImageIcon size={15} className="text-brand-green" />
            <input type="text" value={backgroundImage} onChange={(e) => setBackgroundImage(e.target.value)} placeholder="Or paste an image URL" className="w-full bg-transparent text-sm outline-none" />
          </label>

          <button type="button" onClick={resetPreferences} className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink/70 hover:bg-slate-50">
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {(uploadMessage || uploadError || searchError) && (
          <p className={`mt-2 text-sm ${searchError || uploadError ? 'text-red-600' : 'text-brand-green'}`}>
            {searchError || uploadError || uploadMessage}
          </p>
        )}

        {searchResults.length > 0 && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-navy">Pexels theme search</p>
              <span className="text-xs text-ink/50">{searchResults.length} results</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => {
                    setBackgroundImage(result.src)
                    setUploadMessage(`Selected photo by ${result.photographer}`)
                    setSelectedThemeId('')
                  }}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-1 shadow-sm transition hover:border-brand-green/70"
                >
                  <img src={result.thumbnail} alt={result.alt} className="h-40 w-full object-cover transition duration-300 group-hover:scale-105" />
                  <div className="mt-2 flex items-center justify-between gap-2 px-2 pb-2">
                    <span className="text-xs text-ink/65">{result.photographer}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-ink/50">Use</span>
                  </div>
                </button>
              ))}
            </div>

            {searchHasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center justify-center rounded-full border border-brand-green bg-white px-5 py-2 text-sm font-semibold text-brand-green transition hover:bg-brand-green/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMore ? 'Loading more…' : 'Load more results'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-white/70 p-4 md:p-5" style={{
        backgroundImage: backgroundImage
          ? `linear-gradient(135deg, rgba(255,255,255,0.86), rgba(255,255,255,0.78)), url(${backgroundImage})`
          : selectedTheme?.image
            ? `linear-gradient(135deg, rgba(255,255,255,0.82), rgba(255,255,255,0.78)), url(${selectedTheme.image})`
            : `linear-gradient(135deg, ${selectedTheme?.colors?.[0] || '#2E8B57'}22 0%, ${selectedTheme?.colors?.[1] || '#0F766E'}2D 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        <div className="mb-3 grid grid-cols-7 gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/45">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((cell, index) => {
            const key = formatDateKey(cell.date)
            const dayInfo = dailyOverview.get(key)
            const style = dayInfo ? EMOTION_STYLES[dayInfo.emotion?.toLowerCase()] || EMOTION_STYLES.calm : null
            const isToday = key === formatDateKey(new Date())

            return (
              <div
                key={`${key}-${index}`}
                className={`min-h-[95px] rounded-xl border p-2.5 shadow-sm transition-all ${cell.inMonth ? 'border-slate-200/80 bg-white/80' : 'border-transparent bg-white/45'}`}
                style={dayInfo ? {
                  background: `linear-gradient(135deg, ${style.soft} 0%, ${selectedTheme?.colors?.[2] || '#ffffff'}16 100%)`,
                  borderColor: `${style.color}40`,
                } : undefined}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-semibold ${isToday ? 'rounded-full bg-navy px-1.5 py-0.5 text-white' : 'text-ink/70'}`}>
                    {cell.date.getDate()}
                  </span>
                  {dayInfo ? <EmotionIcon name={toEmotionKey(dayInfo.emotion)} className="h-5 w-5" /> : null}
                </div>

                {dayInfo ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/70">{style?.label || 'Emotion'}</p>
                    <p className="text-[11px] text-ink/60">{dayInfo.count} check-in{dayInfo.count > 1 ? 's' : ''}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-ink/35">No check-in</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {THEME_CATEGORY_CONFIG.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => setSelectedCategory(category.key)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${selectedCategory === category.key ? 'border-brand-green bg-brand-green/10 text-brand-green' : 'border-slate-200 bg-slate-50 text-ink/70'}`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {packsForCategory.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-ink/70">
            No theme packs are available right now. Use photo search, upload an image, or paste a photo URL to personalize your calendar.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {packsForCategory.slice(0, 15).map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  setSelectedThemeId(theme.id)
                  if (theme.type === 'image') {
                    setBackgroundImage('')
                  }
                }}
                className={`relative group overflow-hidden rounded-3xl border p-4 text-left transition ${selectedThemeId === theme.id ? 'border-brand-green bg-brand-green/10 shadow-sm' : 'border-slate-200 bg-white hover:border-brand-green/80'}`}
              >
                {theme.category === 'sports' ? (
                  <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-sky-600 to-violet-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
                    Pro Sports
                  </span>
                ) : null}
                <div className="mb-4 h-24 overflow-hidden rounded-3xl bg-slate-100">
                  {theme.type === 'image' ? (
                    <img src={theme.image} alt={theme.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full" style={{
                      backgroundImage: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})`,
                    }} />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-navy">{theme.name}</div>
                      <div className="text-[11px] text-ink/50">{theme.categoryLabel}</div>
                    </div>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/50">
                      {theme.type === 'image' ? 'IMG' : 'CLR'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-snug text-ink/60 line-clamp-2">{theme.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-sm text-ink/70">
          <Sparkles size={14} className="text-brand-green" />
          <span className="font-semibold text-ink">Selected pack:</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-ink/70">
            {selectedTheme ? `${selectedTheme.categoryLabel} • ${selectedTheme.name}` : 'None selected'}
          </span>
        </div>
      </div>
    </div>
  )
}
