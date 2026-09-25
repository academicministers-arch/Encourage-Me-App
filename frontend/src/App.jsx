import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ConsultantProtectedRoute from './components/ConsultantProtectedRoute.jsx'
import AppLayout from './components/AppLayout.jsx'

import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import ConsultantLogin from './pages/ConsultantLogin.jsx'

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const EmotionalJourney = lazy(() => import('./pages/EmotionalJourney.jsx'))
const Journal = lazy(() => import('./pages/Journal.jsx'))
const Favorites = lazy(() => import('./pages/Favorites.jsx'))
const SupportOrganizations = lazy(() => import('./pages/SupportOrganizations.jsx'))
const SettingsPage = lazy(() => import('./pages/Settings.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Testimonials = lazy(() => import('./pages/Testimonials.jsx'))
const Consultation = lazy(() => import('./pages/Consultation.jsx'))
const PaymentCallback = lazy(() => import('./pages/PaymentCallback.jsx'))
const AdminConsultants = lazy(() => import('./pages/AdminConsultants.jsx'))
const AdminOrganizations = lazy(() => import('./pages/AdminOrganizations.jsx'))
const UserChatConversation = lazy(() => import('./pages/UserChatConversation.jsx'))
const ConsultantInbox = lazy(() => import('./pages/ConsultantInbox.jsx'))
const ConsultantChatConversation = lazy(() => import('./pages/ConsultantChatConversation.jsx'))

function PageFallback() {
  return (
    <div className="w-full h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand-green border-t-transparent animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/journey" element={<EmotionalJourney />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/support" element={<SupportOrganizations />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/consultation" element={<Consultation />} />
          <Route path="/consultation/callback" element={<PaymentCallback />} />
          <Route path="/consultation/chat/:consultantId" element={<UserChatConversation />} />
          <Route path="/admin/consultants" element={<AdminConsultants />} />
          <Route path="/admin/organizations" element={<AdminOrganizations />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="/consultant/login" element={<ConsultantLogin />} />
        <Route
          path="/consultant/inbox"
          element={
            <ConsultantProtectedRoute>
              <ConsultantInbox />
            </ConsultantProtectedRoute>
          }
        />
        <Route
          path="/consultant/chat/:conversationId"
          element={
            <ConsultantProtectedRoute>
              <ConsultantChatConversation />
            </ConsultantProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
