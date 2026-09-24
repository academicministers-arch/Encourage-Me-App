import React from 'react'
import { Navigate } from 'react-router-dom'
import { useConsultantAuth } from '../context/ConsultantAuthContext.jsx'

export default function ConsultantProtectedRoute({ children }) {
  const { consultant } = useConsultantAuth()
  if (!consultant) return <Navigate to="/consultant/login" replace />
  return children
}
