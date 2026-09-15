import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import api from '../api/axios.js'

export default function PaymentCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [state, setState] = useState('verifying') // verifying | success | failed
  const [message, setMessage] = useState('')

  useEffect(() => {
    const status = searchParams.get('status')
    const txRef = searchParams.get('tx_ref')
    const transactionId = searchParams.get('transaction_id')

    // Flutterwave itself may report the payment was cancelled/failed
    // before we even try to verify — no point calling the backend then.
    if (status && status !== 'successful' && status !== 'completed') {
      setState('failed')
      setMessage("It looks like the payment wasn't completed. You can try again from the Consultation page.")
      return
    }

    if (!txRef || !transactionId) {
      setState('failed')
      setMessage('Missing payment details. If you completed a payment, please contact support.')
      return
    }

    api
      .get('/api/consultants/verify', { params: { tx_ref: txRef, transaction_id: transactionId } })
      .then(() => {
        setState('success')
        sessionStorage.removeItem('encourage_me_pending_tier')
      })
      .catch((err) => {
        setState('failed')
        setMessage(err.response?.data?.detail || 'We could not confirm this payment. Please contact support if you were charged.')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-xl2 shadow-card p-8">
        {state === 'verifying' && (
          <>
            <Loader2 size={40} className="mx-auto text-brand-green animate-spin mb-4" />
            <h1 className="font-display text-lg font-bold text-navy mb-1.5">Confirming your payment…</h1>
            <p className="text-sm text-ink/55">This only takes a moment — please don't close this page.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle2 size={40} className="mx-auto text-brand-green mb-4" />
            <h1 className="font-display text-lg font-bold text-navy mb-1.5">Payment confirmed</h1>
            <p className="text-sm text-ink/55 mb-6">
              You now have access to your consultants. Thank you for trusting us.
            </p>
            <button
              onClick={() => navigate('/consultation')}
              className="w-full bg-navy text-white py-2.75 rounded-lg text-sm font-semibold hover:bg-navy-light transition-colors focus-ring"
            >
              View your consultants
            </button>
          </>
        )}

        {state === 'failed' && (
          <>
            <XCircle size={40} className="mx-auto text-red-500 mb-4" />
            <h1 className="font-display text-lg font-bold text-navy mb-1.5">Payment not confirmed</h1>
            <p className="text-sm text-ink/55 mb-6">{message}</p>
            <button
              onClick={() => navigate('/consultation')}
              className="w-full bg-navy text-white py-2.75 rounded-lg text-sm font-semibold hover:bg-navy-light transition-colors focus-ring"
            >
              Back to Consultation
            </button>
          </>
        )}
      </div>
    </div>
  )
}
