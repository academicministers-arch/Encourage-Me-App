import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, CheckCircle2 } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import api from '../api/axios.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', { email })
    } finally {
      setLoading(false)
      setSent(true)
    }
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-xl2 shadow-cardHover p-8"
      >
        <div className="flex justify-center mb-6 md:hidden">
          <Logo size="lg" />
        </div>

        {sent ? (
          <div className="text-center py-4">
            <CheckCircle2 className="mx-auto text-brand-green mb-3" size={40} />
            <h1 className="font-display text-lg font-bold text-navy mb-1.5">Check your inbox</h1>
            <p className="text-sm text-ink/55 mb-6">
              If an account exists for {email}, we've sent password reset instructions.
            </p>
            <Link to="/login" className="text-sm font-semibold text-brand-green hover:underline">
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-xl font-bold text-navy text-center mb-1">Reset your password</h1>
            <p className="text-sm text-ink/55 text-center mb-7">
              Enter your email and we'll send you reset instructions.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy text-white py-2.75 rounded-lg text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-60 focus-ring"
              >
                {loading ? 'Sending…' : 'Send reset instructions'}
              </button>
            </form>
            <p className="text-center text-sm text-ink/55 mt-6">
              <Link to="/login" className="font-semibold text-brand-green hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </AuthLayout>
  )
}
