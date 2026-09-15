import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PenLine, Sparkles, GraduationCap, Trash2, Send, FileText, Zap } from 'lucide-react'
import api from '../api/axios.js'
import { SkeletonBlock } from '../components/Skeleton.jsx'
import Logo from '../components/Logo.jsx'

const TYPES = [
  { key: 'reflection', label: 'Reflection', icon: PenLine, placeholder: "What's on your mind today?" },
  { key: 'gratitude', label: 'Gratitude', icon: Sparkles, placeholder: 'What are you grateful for today?' },
  { key: 'lesson', label: 'Lesson Learned', icon: GraduationCap, placeholder: 'What did today teach you?' },
]

export default function Journal() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [type, setType] = useState('reflection')
  const [saving, setSaving] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [aiDraft, setAiDraft] = useState('')
  const [generating, setGenerating] = useState(false)
  const [draftError, setDraftError] = useState('')
  const [mediaFiles, setMediaFiles] = useState([])

  function load() {
    api.get('/api/journal').then((res) => setEntries(res.data)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('content', content.trim())
      formData.append('entry_type', type)
      mediaFiles.forEach((file) => formData.append('files', file))

      await api.post('/api/journal/with-attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setContent('')
      setPrompt('')
      setAiDraft('')
      setMediaFiles([])
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    await api.delete(`/api/journal/${id}`)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  async function handleGenerateDraft(e) {
    e.preventDefault()
    if (!prompt.trim()) return
    setGenerating(true)
    setDraftError('')
    try {
      const res = await api.post('/api/journal/generate', {
        prompt: prompt.trim(),
        media_names: mediaFiles.map((file) => file.name),
      })
      setAiDraft(res.data.draft)
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Unable to generate a draft.'
      setDraftError(message)
    } finally {
      setGenerating(false)
    }
  }

  function handleMediaChange(e) {
    setMediaFiles(Array.from(e.target.files || []))
  }

  function applyDraft() {
    setContent((prev) => (prev.trim() ? `${prev.trim()}\n\n${aiDraft}` : aiDraft))
  }

  const activeType = TYPES.find((t) => t.key === type)

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Daily Journal</h1>
        <p className="text-ink/55 mt-1">Reflections, gratitude notes, and lessons learned.</p>
      </div>

      <div className="bg-white rounded-xl2 shadow-card p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-brand-green/5 p-2">
              <Logo size="md" showWordmark={false} />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy">AI Writing Continuation & Improvement</p>
              <p className="text-xs text-ink/50">Start writing, and the AI will continue and improve your journal entry to make it flow beautifully.</p>
            </div>
          </div>
          <span className="rounded-full bg-surface px-3 py-1 text-xs text-ink/60">Powered by Emtrixz Technology Company</span>
        </div>

        <form onSubmit={handleGenerateDraft} className="space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Start writing your thoughts, feelings, or experiences. The AI will continue and refine your entry..."
            rows={3}
            className="w-full resize-none rounded-lg border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green transition-colors"
          />
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-surface px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-brand-green hover:text-brand-green">
              <FileText size={16} /> Attach photos, music, or videos
              <input type="file" multiple accept="image/*,audio/*,video/*" className="sr-only" onChange={handleMediaChange} />
            </label>
            <button
              type="submit"
              disabled={generating || !prompt.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Zap size={16} /> {generating ? 'Generating…' : 'Generate draft'}
            </button>
          </div>
          {mediaFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs text-ink/60">
              {mediaFiles.map((file) => (
                <span key={file.name} className="rounded-full bg-surface px-3 py-1">{file.name}</span>
              ))}
            </div>
          )}
          {draftError && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {draftError}
            </div>
          )}
        </form>

        {aiDraft && (
          <div className="mt-5 rounded-3xl border border-black/10 bg-surface p-4">
            <div className="flex items-center justify-end gap-3 mb-3">
              <button onClick={applyDraft} className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white">Add to journal</button>
            </div>
            <p className="whitespace-pre-wrap text-sm text-ink/80">{aiDraft}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl2 shadow-card p-6">
        <div className="flex gap-2 mb-4">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors focus-ring ${
                type === t.key ? 'bg-brand-green text-white' : 'bg-surface text-ink/60 hover:bg-brand-greenLight'
              }`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={activeType.placeholder}
            rows={4}
            className="w-full resize-none rounded-lg border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green transition-colors"
          />
          <button
            type="submit"
            disabled={saving || !content.trim()}
            className="px-5 py-2.5 rounded-lg bg-navy text-white text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-50 focus-ring"
          >
            {saving ? 'Saving…' : 'Save entry'}
          </button>
          <label className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-surface px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-brand-green hover:text-brand-green">
            <FileText size={16} /> Add photos, audio, or video to this journal
            <input type="file" multiple accept="image/*,audio/*,video/*" className="sr-only" onChange={handleMediaChange} />
          </label>
          {mediaFiles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink/60">
              {mediaFiles.map((file) => (
                <span key={file.name} className="rounded-full bg-surface px-3 py-1">{file.name}</span>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} className="h-24 w-full" />)
        ) : entries.length === 0 ? (
          <p className="text-sm text-ink/50 text-center py-10">No journal entries yet — write your first one above.</p>
        ) : (
          entries.map((entry, idx) => {
            const meta = TYPES.find((t) => t.key === entry.entry_type) || TYPES[0]
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="bg-white rounded-xl2 shadow-card p-5 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <meta.icon size={14} className="text-brand-green" />
                    <span className="text-xs font-semibold text-brand-green uppercase tracking-wide">{meta.label}</span>
                    <span className="text-xs text-ink/35">
                      {new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                  {entry.attachments?.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {entry.attachments.map((attachment) => (
                        <div key={attachment.id} className="rounded-2xl border border-black/5 overflow-hidden bg-surface">
                          {attachment.content_type.startsWith('image/') ? (
                            <img src={attachment.data} alt={attachment.file_name || 'attachment'} className="w-full object-cover" />
                          ) : attachment.content_type.startsWith('video/') ? (
                            <video controls src={attachment.data} className="w-full" />
                          ) : attachment.content_type.startsWith('audio/') ? (
                            <audio controls src={attachment.data} className="w-full p-3" />
                          ) : (
                            <div className="px-3 py-2 text-xs text-ink/60">{attachment.file_name}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-ink/25 hover:text-red-500 p-1.5 rounded-lg focus-ring shrink-0"
                  aria-label="Delete entry"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
