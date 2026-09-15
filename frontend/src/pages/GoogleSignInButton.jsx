import React, { useEffect, useRef, useState } from 'react'

// Renders Google's official Sign-In button using Google Identity Services
// (loaded via script tag in index.html). If VITE_GOOGLE_CLIENT_ID isn't
// set, this component quietly renders nothing rather than showing a
// broken button — Google sign-in is optional, email/password always works.
export default function GoogleSignInButton({ onCredential, onError }) {
  const buttonRef = useRef(null)
  const [available, setAvailable] = useState(false)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!clientId) return

    function init() {
      if (!window.google?.accounts?.id || !buttonRef.current) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) {
            onCredential(response.credential)
          } else {
            onError?.('Google sign-in did not return a valid credential.')
          }
        },
      })
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      })
      setAvailable(true)
    }

    if (window.google?.accounts?.id) {
      init()
    } else {
      // GIS script may still be loading (it's async/defer) — poll briefly
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval)
          init()
        }
      }, 200)
      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  if (!clientId) return null

  return (
    <div className="flex justify-center">
      <div ref={buttonRef} />
      {!available && (
        <div className="h-10 w-full max-w-[320px] rounded-lg bg-surface animate-pulse" />
      )}
    </div>
  )
}