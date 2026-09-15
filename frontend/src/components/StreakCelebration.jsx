import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, X } from 'lucide-react'

const MILESTONE_COPY = {
  3: { title: '3-Day Streak', body: "Three days in a row — you're building a real habit." },
  7: { title: 'One Week Strong', body: 'A full week of showing up for yourself. That matters.' },
  14: { title: 'Two Weeks In', body: "You're proving to yourself that consistency is possible." },
  30: { title: '30-Day Streak', body: "A full month of checking in. That's genuine, lasting change." },
  60: { title: '60 Days Strong', body: 'Two months of consistency. This is who you are now.' },
  100: { title: '100-Day Streak', body: 'One hundred days. Truly remarkable commitment to yourself.' },
}

const CONFETTI_COLORS = ['#2E8B57', '#0B1F3A', '#5BAE84', '#F5C542', '#6B87AC']

function ConfettiBurst() {
  const pieces = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2
    const distance = 70 + Math.random() * 50
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.random() * 360,
      delay: Math.random() * 0.15,
    }
  })

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute left-1/2 top-1/2 w-2 h-2 rounded-sm"
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 0.9, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

export default function StreakCelebration({ streak, onDismiss }) {
  const [visible, setVisible] = useState(!!streak)

  useEffect(() => {
    if (!streak) return
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      onDismiss?.()
    }, 5000)
    return () => clearTimeout(timer)
  }, [streak, onDismiss])

  const copy = streak ? MILESTONE_COPY[streak] : null
  if (!copy) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm"
        >
          <div className="relative bg-navy text-white rounded-xl2 shadow-cardHover p-5 flex gap-4 items-start overflow-visible">
            <div className="relative shrink-0">
              <ConfettiBurst />
              <div className="w-11 h-11 rounded-full bg-brand-green flex items-center justify-center">
                <Flame size={20} className="text-white" fill="currentColor" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-sm">{copy.title}</p>
              <p className="text-xs text-white/70 mt-1 leading-relaxed">{copy.body}</p>
            </div>
            <button
              onClick={() => { setVisible(false); onDismiss?.() }}
              className="text-white/40 hover:text-white/80 p-1 rounded-lg shrink-0 focus-ring"
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
