import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import GoogleSignInButton from '../components/GoogleSignInButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogleCredential(credential) {
    setError('')
    try {
      await loginWithGoogle(credential)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Google sign-in failed. Please try again.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to log in. Please check your credentials.')
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
        className="relative w-full max-w-md bg-white rounded-xl2 shadow-2xl p-8"
      >
        <div className="flex justify-center mb-6 md:hidden">
          <Logo size="lg" />
        </div>
        <h1 className="text-xl font-display font-bold text-navy text-center">Welcome back</h1>
        <p className="text-sm text-ink/60 text-center mt-1">Log in to continue your emotional wellness journey.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-ink/80 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-black/10 focus-ring text-sm"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink/80 mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-black/10 focus-ring text-sm"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-brand-green font-medium hover:underline">
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
          >
            <LogIn size={18} />
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-black/10 flex-1" />
          <span className="text-xs text-ink/40 font-medium">OR</span>
          <div className="h-px bg-black/10 flex-1" />
        </div>

        <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} />

        <p className="text-sm text-center text-ink/60 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-green font-semibold hover:underline">
            Create account
          </Link>
        </p>

        <p className="text-xs text-center text-ink/40 mt-8">Built and Powered by Emtrixz Technology</p>
      </motion.div>
    </AuthLayout>
  )
}