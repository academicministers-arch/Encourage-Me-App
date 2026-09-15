import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import { Flame, Trophy, CalendarCheck, FileText, Download, Loader2, Lightbulb } from 'lucide-react'
import api from '../api/axios.js'
import EmotionIcon from '../components/EmotionIcon.jsx'
import EmotionCalendar from '../components/EmotionCalendar.jsx'
import { SkeletonBlock } from '../components/Skeleton.jsx'

const PIE_COLORS = ['#2E8B57', '#0B1F3A', '#5BAE84', '#3E5C87', '#8FBFA3', '#1F2937', '#A9C6B8', '#6B87AC']

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-xl2 shadow-card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-brand-greenLight flex items-center justify-center shrink-0">
        <Icon size={19} className="text-brand-green" />
      </div>
      <div>
        <p className="text-lg font-bold text-navy leading-none">{value}</p>
        <p className="text-xs text-ink/50 mt-1">{label}</p>
      </div>
    </div>
  )
}

export default function EmotionalJourney() {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(null)
  const [correlations, setCorrelations] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/api/journey/stats'),
      api.get('/api/journey/analytics'),
      api.get('/api/journey/timeline'),
      api.get('/api/journey/correlations'),
    ]).then(([s, a, t, c]) => {
      setStats(s.data)
      setAnalytics(a.data)
      setTimeline(t.data.slice().reverse())
      setCorrelations(c.data)
    }).finally(() => setLoading(false))
  }, [])

  async function downloadReport(period) {
    setReportLoading(period)
    try {
      const res = await api.get(`/api/reports/emotional-health?period=${period}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `encourage-me-${period}-report.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } finally {
      setReportLoading(null)
    }
  }

  const trendData = (analytics?.weekly_trend || []).map((d) => ({
    date: d.date.slice(5),
    checkins: d.checkins,
    positive: d.positive,
  }))

  const pieData = (analytics?.emotion_breakdown || []).map((e) => ({ name: e.emotion, value: e.count }))

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">My Emotional Journey</h1>
          <p className="text-ink/55 mt-1">Your growth and emotional patterns over time.</p>
        </div>

        {/* AI Emotional Health Report */}
        <div className="flex gap-2">
          <button
            onClick={() => downloadReport('weekly')}
            disabled={reportLoading}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg bg-navy text-white hover:bg-navy-light transition-colors disabled:opacity-60 focus-ring"
          >
            {reportLoading === 'weekly' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            Weekly Report
          </button>
          <button
            onClick={() => downloadReport('monthly')}
            disabled={reportLoading}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg bg-brand-green text-white hover:bg-brand-greenDark transition-colors disabled:opacity-60 focus-ring"
          >
            {reportLoading === 'monthly' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Monthly Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-20" />)}
          </div>
          <SkeletonBlock className="h-64 w-full" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={CalendarCheck} label="Total Check-ins" value={stats.total_checkins} />
            <StatCard icon={Flame} label="Current Streak" value={`${stats.current_streak}d`} />
            <StatCard icon={Trophy} label="Longest Streak" value={`${stats.longest_streak}d`} />
            <StatCard icon={FileText} label="Journal Entries" value={stats.total_journal_entries} />
          </div>

          {/* Correlation insights */}
          {correlations?.insights?.length > 0 && (
            <div className="bg-navy rounded-xl2 p-6 text-white space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb size={18} className="text-brand-green" />
                <h2 className="font-display font-bold">Patterns We Noticed</h2>
              </div>
              {correlations.insights.map((insight, i) => (
                <p key={i} className="text-sm text-white/80 leading-relaxed">
                  {insight.text}
                </p>
              ))}
            </div>
          )}

          {/* Emotion calendar */}
          <EmotionCalendar entries={timeline} />

          {/* Weekly trend */}
          <div className="bg-white rounded-xl2 shadow-card p-6">
            <h2 className="font-display font-bold text-navy mb-4">Weekly Mood Trend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="checkins" stroke="#0B1F3A" strokeWidth={2} dot={{ r: 3 }} name="Check-ins" />
                <Line type="monotone" dataKey="positive" stroke="#2E8B57" strokeWidth={2} dot={{ r: 3 }} name="Positive" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Emotion breakdown pie */}
            <div className="bg-white rounded-xl2 shadow-card p-6">
              <h2 className="font-display font-bold text-navy mb-4">Most Common Emotions</h2>
              {pieData.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(d) => d.name}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-ink/50 py-10 text-center">Check in daily to see your emotion breakdown here.</p>
              )}
            </div>

            {/* Monthly breakdown bar */}
            <div className="bg-white rounded-xl2 shadow-card p-6">
              <h2 className="font-display font-bold text-navy mb-4">Monthly Summary</h2>
              {(analytics?.monthly_emotion_breakdown || []).length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.monthly_emotion_breakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
                    <XAxis dataKey="emotion" tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2E8B57" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-ink/50 py-10 text-center">No data for this month yet.</p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl2 shadow-card p-6">
            <h2 className="font-display font-bold text-navy mb-4">Timeline</h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-ink/50 py-6 text-center">Your check-ins will appear here as a timeline.</p>
            ) : (
              <div className="space-y-4">
                {timeline.slice(0, 25).map((entry, idx) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="flex gap-3 items-start border-l-2 border-brand-greenLight pl-4 relative"
                  >
                    <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-brand-green border-2 border-white" />
                    <EmotionIcon name={entry.emotion} className="w-8 h-8 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy">{entry.emotion}</p>
                      {entry.message && <p className="text-sm text-ink/60 mt-0.5 line-clamp-2">{entry.message}</p>}
                      <p className="text-xs text-ink/40 mt-1">
                        {new Date(entry.created_at).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
