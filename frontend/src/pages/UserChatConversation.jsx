import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../api/axios.js'
import ChatWindow from '../components/chat/ChatWindow.jsx'

const POLL_INTERVAL_MS = 4000

export default function UserChatConversation() {
  const { consultantId } = useParams()
  const navigate = useNavigate()
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const lastIdRef = useRef(0)
  const pollRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const startRes = await api.post('/api/chat/start', null, { params: { consultant_id: consultantId } })
        if (cancelled) return
        setConversation(startRes.data)

        const msgRes = await api.get(`/api/chat/conversations/${startRes.data.id}/messages`)
        if (cancelled) return
        setMessages(msgRes.data)
        if (msgRes.data.length) lastIdRef.current = msgRes.data[msgRes.data.length - 1].id

        api.post(`/api/chat/conversations/${startRes.data.id}/read`).catch(() => {})
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Could not open this chat. Please try again from the Consultation page.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [consultantId])

  useEffect(() => {
    if (!conversation) return

    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/chat/conversations/${conversation.id}/messages`, {
          params: { after_id: lastIdRef.current },
        })
        if (res.data.length) {
          setMessages((prev) => [...prev, ...res.data])
          lastIdRef.current = res.data[res.data.length - 1].id
          api.post(`/api/chat/conversations/${conversation.id}/read`).catch(() => {})
        }
      } catch {
        // Silent — a single missed poll isn't worth surfacing an error for.
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(pollRef.current)
  }, [conversation])

  async function handleSend(text, file) {
    if (!conversation) return
    setSending(true)
    try {
      const formData = new FormData()
      if (text) formData.append('content', text)
      if (file) formData.append('file', file)

      const res = await api.post(`/api/chat/conversations/${conversation.id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setMessages((prev) => [...prev, res.data])
      lastIdRef.current = res.data.id
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not send that message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (error && !conversation) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-4">{error}</p>
        <button
          onClick={() => navigate('/consultation')}
          className="text-sm font-semibold text-brand-green hover:underline"
        >
          Back to Consultation
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 h-[calc(100vh-4rem)] flex flex-col">
      <button
        onClick={() => navigate('/consultation')}
        className="flex items-center gap-1.5 text-sm font-semibold text-ink/50 hover:text-navy mb-4 shrink-0"
      >
        <ArrowLeft size={16} /> Back to Consultation
      </button>
      <div className="flex-1 min-h-0">
        <ChatWindow
          messages={messages}
          currentSenderType="user"
          onSend={handleSend}
          otherPartyName={conversation?.consultant_name || 'Consultant'}
          otherPartyPhoto={conversation?.consultant_photo_url}
          loading={loading}
          sending={sending}
        />
      </div>
    </div>
  )
}
