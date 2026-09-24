import React, { createContext, useContext, useState, useCallback } from 'react'
import consultantApi from '../api/consultantAxios.js'

const ConsultantAuthContext = createContext(null)

export function ConsultantAuthProvider({ children }) {
  const [consultant, setConsultant] = useState(() => {
    const stored = localStorage.getItem('encourage_me_consultant')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback(async (email, password) => {
    const res = await consultantApi.post('/api/consultant-auth/login', { email, password })
    localStorage.setItem('encourage_me_consultant_token', res.data.access_token)
    localStorage.setItem('encourage_me_consultant', JSON.stringify(res.data.consultant))
    setConsultant(res.data.consultant)
    return res.data.consultant
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('encourage_me_consultant_token')
    localStorage.removeItem('encourage_me_consultant')
    setConsultant(null)
  }, [])

  return (
    <ConsultantAuthContext.Provider value={{ consultant, login, logout }}>
      {children}
    </ConsultantAuthContext.Provider>
  )
}

export function useConsultantAuth() {
  const ctx = useContext(ConsultantAuthContext)
  if (!ctx) throw new Error('useConsultantAuth must be used within ConsultantAuthProvider')
  return ctx
}
