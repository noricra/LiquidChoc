import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

const CheckCircleIcon = () => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" fill="var(--primary-color)" stroke="none" />
    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="3" />
  </svg>
)

export default function Success() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('session_id')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <CheckCircleIcon />
        </div>

        <h1 className="text-3xl font-black mb-4">Paiement réussi !</h1>

        <p className="text-lg mb-6" style={{ color: 'var(--text-muted)' }}>
          Vous allez recevoir un SMS avec votre code de récupération dans quelques instants.
        </p>

        <div className="p-4 rounded-2xl mb-6" style={{ backgroundColor: 'var(--card-color)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
            ID de transaction
          </p>
          <p className="text-xs font-mono break-all" style={{ color: 'var(--text-color)' }}>
            {sessionId || 'N/A'}
          </p>
        </div>

        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Redirection dans {countdown} seconde{countdown !== 1 ? 's' : ''}...
        </p>

        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-full font-bold text-white"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  )
}
