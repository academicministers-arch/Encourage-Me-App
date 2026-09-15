import { useEffect, useState } from 'react'
import { Heart, MessageCircle, Send, Paperclip, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/axios.js'

export default function Testimonials() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [commentDrafts, setCommentDrafts] = useState({})
  const [busyIds, setBusyIds] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)

  async function loadPosts() {
    try {
      const res = await api.get('/api/testimonials')
      setPosts(res.data)
      setLastUpdated(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
      return res.data
    } catch (err) {
      console.error(err)
      return []
    }
  }

  useEffect(() => {
    loadPosts()
    const interval = window.setInterval(() => {
      loadPosts()
    }, 5000)

    return () => window.clearInterval(interval)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() && files.length === 0) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('text', text)
      files.forEach((file) => formData.append('files', file))
      await api.post('/api/testimonials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await loadPosts()
      setText('')
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  async function handleLike(postId) {
    try {
      await api.post(`/api/testimonials/${postId}/like`)
      await loadPosts()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleComment(postId) {
    const content = commentDrafts[postId]?.trim()
    if (!content) return
    setBusyIds((prev) => [...prev, postId])
    try {
      await api.post(`/api/testimonials/${postId}/comments`, { content })
      await loadPosts()
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }))
    } finally {
      setBusyIds((prev) => prev.filter((id) => id !== postId))
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-brand-green to-navy p-8 text-white shadow-card">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
          <Sparkles size={16} /> Community stories
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold">Share your testimony</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Tell the community how this app helped you grow, heal, or feel supported. Add a text story, photos, audio, or video to inspire others.
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 animate-pulse" />
          <span>Live updates every 5 seconds</span>
          {lastUpdated ? <span>• last synced {lastUpdated}</span> : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-black/5 bg-white p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full overflow-hidden bg-navy flex items-center justify-center text-sm font-semibold text-white">
            {user?.avatar_url ? <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" /> : <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>}
          </div>
          <div>
            <p className="font-semibold text-navy">{user?.name || 'You'}</p>
            <p className="text-sm text-ink/50">Share your experience with the community</p>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What changed in your life because of this app?"
          className="mt-4 min-h-[110px] w-full rounded-xl border border-black/10 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
        />

        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-brand-green">
          <Paperclip size={16} /> Attach photos, audio, or video
          <input type="file" multiple accept="image/*,audio/*,video/*" className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
        </label>

        {files.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {files.map((file) => (
              <span key={file.name} className="rounded-full bg-surface px-3 py-1 text-xs text-ink/70">{file.name}</span>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={loading} className="rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? 'Posting…' : 'Share testimony'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {posts.map((post) => (
          <article key={post.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full overflow-hidden bg-navy flex items-center justify-center text-sm font-semibold text-white">
                {post.user_avatar ? <img src={post.user_avatar} alt={post.user_name} className="h-full w-full object-cover" /> : <span>{post.user_name?.[0]?.toUpperCase() || 'U'}</span>}
              </div>
              <div>
                <p className="font-semibold text-navy">{post.user_name}</p>
                <p className="text-xs text-ink/45">{new Date(post.created_at).toLocaleString()}</p>
              </div>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-ink/80">{post.text}</p>

            {post.attachments?.length > 0 && (
              <div className="mt-4 space-y-3">
                {post.attachments.map((attachment) => (
                  <div key={attachment.id}>
                    {attachment.content_type.startsWith('image/') ? (
                      <img src={attachment.data} alt={attachment.file_name || 'attachment'} className="rounded-xl border border-black/5" />
                    ) : attachment.content_type.startsWith('video/') ? (
                      <video controls src={attachment.data} className="w-full rounded-xl border border-black/5" />
                    ) : (
                      <audio controls src={attachment.data} className="w-full" />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button onClick={() => handleLike(post.id)} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${post.liked_by_me ? 'bg-brand-green text-white' : 'bg-surface text-ink/70'}`}>
                <Heart size={16} fill={post.liked_by_me ? 'currentColor' : 'none'} /> {post.like_count}
              </button>
              <span className="rounded-full bg-surface px-3 py-1.5 text-xs text-ink/60">{post.likes?.length || 0} liker{(post.likes?.length || 0) === 1 ? '' : 's'}</span>
            </div>

            {post.likes?.length > 0 && (
              <div className="mt-3 rounded-xl bg-surface p-3 text-sm text-ink/70">
                <p className="font-semibold text-navy">Liked by</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {post.likes.map((like) => (
                    <span key={like.id} className="rounded-full bg-white px-2.5 py-1 text-xs">{like.user_name}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-xl bg-surface p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-navy">
                <MessageCircle size={16} /> Comments
              </div>
              <div className="mt-3 space-y-2">
                {post.comments?.map((comment) => (
                  <div key={comment.id} className="rounded-lg bg-white px-3 py-2 text-sm text-ink/70">
                    <p className="font-semibold text-navy">{comment.user_name}</p>
                    <p>{comment.content}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={commentDrafts[post.id] || ''}
                  onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                  placeholder="Write a comment"
                  className="flex-1 rounded-full border border-black/10 px-3 py-2 text-sm"
                />
                <button onClick={() => handleComment(post.id)} disabled={busyIds.includes(post.id)} className="rounded-full bg-navy p-2 text-white">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
