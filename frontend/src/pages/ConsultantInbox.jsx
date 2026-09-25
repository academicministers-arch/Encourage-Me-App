import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, MessageCircle } from 'lucide-react'
import consultantApi from '../api/consultantAxios.js'
import { useConsultantAuth } from '../context/ConsultantAuthContext.jsx'
import { SkeletonBlock } from '../components/Skeleton.jsx'

export default function ConsultantInbox() {
  const { consultant, logout } = useConsultantAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  function load() {
    consultantApi.get('/api/chat/consultant/conversations')
      .then((res) => setConversations(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 8000)
    return () => clearInterval(interval)
  }, [])

  function handleLogout() {
    logout()
    navigate('/consultant/login')
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-black/5 px-4 md:px-8 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-ink/40 font-medium">Consultant Portal</p>
          <h1 className="font-display font-bold text-navy">{consultant?.name}</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink/50 hover:text-red-500 transition-colors"
        >
          <LogOut size={15} /> Log out
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 space-y-3">
        <h2 className="font-display font-bold text-navy mb-2">Conversations</h2>

        {loading ? (
          <div className="space-y-3">
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-xl2 shadow-card p-8 text-center">
            <MessageCircle size={28} className="mx-auto text-ink/20 mb-3" />
            <p className="text-sm text-ink/50">No conversations yet.</p>
          </div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/consultant/chat/${c.id}`)}
              className="w-full bg-white rounded-xl2 shadow-card p-4 flex items-center gap-3 text-left hover:shadow-cardHover transition-shadow"
            >
              <div className="h-11 w-11 rounded-full bg-navy flex items-center justify-center text-white font-bold shrink-0">
                {c.user_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-navy truncate">{c.user_name}</p>
                  <p className="text-[10px] text-ink/40 shrink-0">
                    {new Date(c.last_message_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-xs text-ink/50 truncate">{c.last_message_preview || 'No messages yet'}</p>
              </div>
              {c.unread_count > 0 && (
                <span className="shrink-0 bg-brand-green text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                  {c.unread_count}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
