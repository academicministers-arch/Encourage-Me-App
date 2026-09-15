import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import PageLoading from './PageLoading.jsx'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <PageLoading />
  if (!user) return <Navigate to="/login" replace />
  return children
}
