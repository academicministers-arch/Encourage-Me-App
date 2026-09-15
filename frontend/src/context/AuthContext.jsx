import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api from '../api/axios.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('encourage_me_user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('encourage_me_token')
    if (!token) {
      setLoading(false)
      return
    }
    api.get('/api/auth/me')
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('encourage_me_user', JSON.stringify(res.data))
      })
      .catch(() => {
        localStorage.removeItem('encourage_me_token')
        localStorage.removeItem('encourage_me_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('encourage_me_token', res.data.access_token)
    localStorage.setItem('encourage_me_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }, [])

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/api/auth/register', { name, email, password })
    localStorage.setItem('encourage_me_token', res.data.access_token)
    localStorage.setItem('encourage_me_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }, [])

  const loginWithGoogle = useCallback(async (credential) => {
    const res = await api.post('/api/auth/google', { credential })
    localStorage.setItem('encourage_me_token', res.data.access_token)
    localStorage.setItem('encourage_me_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('encourage_me_token')
    localStorage.removeItem('encourage_me_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}