import React, { useEffect, useRef, useState } from 'react'
import { Send, Paperclip, X, FileText, Download, Loader2 } from 'lucide-react'

function AttachmentBubble({ message }) {
  if (!message.attachment_url) return null

  if (message.attachment_type === 'image') {
    return (
      <a href={message.attachment_url} target="_blank" rel="noreferrer" className="block mt-1.5">
        <img
          src={message.attachment_url}
          alt={message.attachment_name || 'Attachment'}
          className="max-w-[220px] max-h-[220px] rounded-lg object-cover border border-black/5"
        />
      </a>
    )
  }

  if (message.attachment_type === 'video') {
    return (
      <video
        src={message.attachment_url}
        controls
        className="max-w-[260px] max-h-[220px] rounded-lg mt-1.5 border border-black/5"
      />
    )
  }

  // document
  return (
    <a
      href={message.attachment_url}
      target="_blank"
      rel="noreferrer"
      className="mt-1.5 flex items-center gap-2 bg-black/5 rounded-lg px-3 py-2 text-xs font-medium hover:bg-black/10 transition-colors max-w-[220px]"
    >
      <FileText size={16} className="shrink-0" />
      <span className="truncate flex-1">{message.attachment_name || 'Document'}</span>
      <Download size={14} className="shrink-0" />
    </a>
  )
}

function MessageBubble({ message, mine }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-2.5`}>
      <div
        className={`max-w-[75%] rounded-xl2 px-3.5 py-2.5 ${
          mine ? 'bg-brand-green text-white' : 'bg-white text-ink border border-black/5'
        }`}
      >
        {message.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        )}
        <AttachmentBubble message={message} />
        <p className={`text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-ink/40'}`}>
          {new Date(message.created_at).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}

export default function ChatWindow({
  messages, currentSenderType, onSend, otherPartyName, otherPartyPhoto, loading, sending,
}) {
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const fileInputRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() && !file) return
    await onSend(text.trim(), file)
    setText('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col h-full bg-surface rounded-xl2 overflow-hidden border border-black/5">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-black/5 shrink-0">
        <div className="h-9 w-9 rounded-full overflow-hidden bg-navy flex items-center justify-center text-white text-sm font-bold shrink-0">
          {otherPartyPhoto ? (
            <img src={otherPartyPhoto} alt={otherPartyName} className="h-full w-full object-cover" />
          ) : (
            <span>{otherPartyName?.[0]?.toUpperCase() || '?'}</span>
          )}
        </div>
        <p className="font-display font-bold text-navy truncate">{otherPartyName}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={22} className="animate-spin text-brand-green" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-ink/40 py-8">
            No messages yet — say hello to start the conversation.
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} mine={m.sender_type === currentSenderType} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="border-t border-black/5 bg-white p-3 shrink-0">
        {file && (
          <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 mb-2 text-xs">
            <Paperclip size={13} className="text-brand-green shrink-0" />
            <span className="truncate flex-1">{file.name}</span>
            <button type="button" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}>
              <X size={14} className="text-ink/40 hover:text-ink/70" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-lg text-ink/40 hover:text-brand-green hover:bg-brand-greenLight transition-colors focus-ring shrink-0"
            aria-label="Attach file"
          >
            <Paperclip size={18} />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green transition-colors"
          />
          <button
            type="submit"
            disabled={sending || (!text.trim() && !file)}
            className="p-2.5 rounded-lg bg-brand-green text-white hover:bg-brand-greenDark transition-colors disabled:opacity-50 focus-ring shrink-0"
            aria-label="Send"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-[10px] text-ink/35 mt-1.5">Images, videos, and documents up to 25MB</p>
      </form>
    </div>
  )
}
