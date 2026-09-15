import React, { useEffect, useState } from 'react'
import { User, Mail, Calendar, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/axios.js'

export default function Profile() {
  const { user, setUser, logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    api.get('/api/journey/stats').then((res) => setStats(res.data))
  }, [])

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be smaller than 5MB.')
      return
    }

    setUploading(true)
    setUploadError('')
    setUploadMessage('')

    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await api.put('/api/auth/avatar', formData)
      setUser(res.data)
      localStorage.setItem('encourage_me_user', JSON.stringify(res.data))
      setUploadMessage('Profile picture updated successfully.')
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Unable to upload profile picture. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Profile</h1>
        <p className="text-ink/55 mt-1">Your account information.</p>
      </div>

      <div className="bg-white rounded-xl2 shadow-card p-6">
        <div className="flex flex-col items-center gap-4 mb-6 text-center md:text-left md:flex-row">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-navy flex items-center justify-center text-3xl font-display text-white">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={`${user.name} avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-brand-green px-4 py-2 text-sm font-semibold text-brand-green transition hover:bg-brand-green/10 focus-ring">
              {uploading ? 'Uploading…' : 'Change photo'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarChange}
              />
            </label>
            {(uploadMessage || uploadError) && (
              <p className={`text-sm ${uploadError ? 'text-red-600' : 'text-brand-green'}`}>
                {uploadError || uploadMessage}
              </p>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg text-navy">{user?.name}</h2>
            <p className="text-sm text-ink/50">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-ink/70">
            <User size={16} className="text-brand-green shrink-0" />
            <span>{user?.name}</span>
          </div>
          <div className="flex items-center gap-3 text-ink/70">
            <Mail size={16} className="text-brand-green shrink-0" />
            <span>{user?.email}</span>
          </div>
          {user?.created_at && (
            <div className="flex items-center gap-3 text-ink/70">
              <Calendar size={16} className="text-brand-green shrink-0" />
              <span>Member since {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl2 shadow-card p-5 text-center">
            <p className="text-2xl font-bold text-navy">{stats.total_checkins}</p>
            <p className="text-xs text-ink/50 mt-1">Total Check-ins</p>
          </div>
          <div className="bg-white rounded-xl2 shadow-card p-5 text-center">
            <p className="text-2xl font-bold text-navy">{stats.current_streak}d</p>
            <p className="text-xs text-ink/50 mt-1">Current Streak</p>
          </div>
        </div>
      )}

      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-black/10 text-sm font-semibold text-ink/60 hover:bg-surface transition-colors focus-ring"
      >
        <LogOut size={16} /> Log out
      </button>

      <p className="text-center text-xs text-ink/35 pt-4">Built and Powered by Emtrixz Technology</p>
    </div>
  )
}
