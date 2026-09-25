import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import consultantApi from '../api/consultantAxios.js'
import ChatWindow from '../components/chat/ChatWindow.jsx'

const POLL_INTERVAL_MS = 4000

export default function ConsultantChatConversation() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const lastIdRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const convRes = await consultantApi.get('/api/chat/consultant/conversations')
        const found = convRes.data.find((c) => String(c.id) === conversationId)
        if (!found) throw new Error('not found')
        if (cancelled) return
        setConversation(found)

        const msgRes = await consultantApi.get(`/api/chat/consultant/conversations/${conversationId}/messages`)
        if (cancelled) return
        setMessages(msgRes.data)
        if (msgRes.data.length) lastIdRef.current = msgRes.data[msgRes.data.length - 1].id

        consultantApi.post(`/api/chat/consultant/conversations/${conversationId}/read`).catch(() => {})
      } catch {
        if (!cancelled) setError('Could not open this conversation.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [conversationId])

  useEffect(() => {
    if (!conversation) return
    const interval = setInterval(async () => {
      try {
        const res = await consultantApi.get(`/api/chat/consultant/conversations/${conversationId}/messages`, {
          params: { after_id: lastIdRef.current },
        })
        if (res.data.length) {
          setMessages((prev) => [...prev, ...res.data])
          lastIdRef.current = res.data[res.data.length - 1].id
          consultantApi.post(`/api/chat/consultant/conversations/${conversationId}/read`).catch(() => {})
        }
      } catch {
        // silent
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [conversation, conversationId])

  async function handleSend(text, file) {
    setSending(true)
    try {
      const formData = new FormData()
      if (text) formData.append('content', text)
      if (file) formData.append('file', file)

      const res = await consultantApi.post(
        `/api/chat/consultant/conversations/${conversationId}/messages`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      setMessages((prev) => [...prev, res.data])
      lastIdRef.current = res.data.id
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not send that message.')
    } finally {
      setSending(false)
    }
  }

  if (error && !conversation) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-4">{error}</p>
        <button onClick={() => navigate('/consultant/inbox')} className="text-sm font-semibold text-brand-green hover:underline">
          Back to Inbox
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 h-screen flex flex-col">
      <button
        onClick={() => navigate('/consultant/inbox')}
        className="flex items-center gap-1.5 text-sm font-semibold text-ink/50 hover:text-navy mb-4 shrink-0"
      >
        <ArrowLeft size={16} /> Back to Inbox
      </button>
      <div className="flex-1 min-h-0">
        <ChatWindow
          messages={messages}
          currentSenderType="consultant"
          onSend={handleSend}
          otherPartyName={conversation?.user_name || 'User'}
          otherPartyPhoto={null}
          loading={loading}
          sending={sending}
        />
      </div>
    </div>
  )
}
