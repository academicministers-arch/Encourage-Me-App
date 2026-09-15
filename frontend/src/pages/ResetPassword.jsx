import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import api from '../api/axios.js'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!token) {
      setError('This reset link is missing its token. Please use the link from your email.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', { token, new_password: password })
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'This reset link is invalid or has expired.')
    } finally {
      setLoading(false)
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

        {done ? (
          <div className="text-center py-4">
            <CheckCircle2 className="mx-auto text-brand-green mb-3" size={40} />
            <h1 className="font-display text-lg font-bold text-navy mb-1.5">Password updated</h1>
            <p className="text-sm text-ink/55 mb-6">You can now log in with your new password.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2 bg-navy text-white py-2.75 rounded-lg text-sm font-semibold hover:bg-navy-light transition-colors focus-ring"
            >
              Go to login <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            <h1 className="font-display text-xl font-bold text-navy text-center mb-1">Set a new password</h1>
            <p className="text-sm text-ink/55 text-center mb-7">Choose a new password for your account.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green transition-colors"
                />
              </div>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
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
                className="w-full bg-navy text-white py-2.75 rounded-lg text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-60 focus-ring"
              >
                {loading ? 'Updating…' : 'Update password'}
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