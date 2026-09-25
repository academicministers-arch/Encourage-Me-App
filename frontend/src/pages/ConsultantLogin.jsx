import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { useConsultantAuth } from '../context/ConsultantAuthContext.jsx'

export default function ConsultantLogin() {
  const { login } = useConsultantAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/consultant/inbox')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-xl2 shadow-cardHover p-8"
      >
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>
        <h1 className="font-display text-xl font-bold text-navy text-center mb-1">Consultant Portal</h1>
        <p className="text-sm text-ink/55 text-center mb-7">Log in to view and reply to your conversations.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green transition-colors"
            />
          </div>
          <div className="relative">
            <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-navy text-white py-2.75 rounded-lg text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-60 focus-ring"
          >
            {loading ? 'Logging in…' : 'Log in'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="text-center text-xs text-ink/40 mt-6">
          Your login was set up by an admin. Contact them if you need access.
        </p>
      </motion.div>
    </div>
  )
}
