import React, { useState, useEffect } from 'react'
import client from '../api/client'

export default function Subscribe() {
  const [businessName, setBusinessName] = useState('')
  const [name, setName]                 = useState('')
  const [phone, setPhone]               = useState('')
  const [success, setSuccess]           = useState(false)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)

  useEffect(() => {
    client.get('/merchant')
      .then(({ data }) => setBusinessName(data.merchant?.businessName || ''))
      .catch(() => {})
  }, [])

  async function submit() {
    if (!phone.trim()) { setError('Numéro requis'); return }
    setLoading(true)
    setError('')
    try {
      await client.post('/subscribers', { phone: phone.trim(), name: name.trim() })
      setSuccess(true)
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { backgroundColor: 'var(--card-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }

  // ── Écran succès ──
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
        <span className="text-6xl mb-4">🎉</span>
        <p className="text-xl font-bold text-center" style={{ color: '#06D6A0' }}>Inscription réussie !</p>
        <p className="text-center mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          Vous recevrez une alerte SMS la prochaine fois que {businessName || 'le commerce'} lance une liquidation.
        </p>
      </div>
    )
  }

  // ── Formulaire ──
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <div className="w-full max-w-sm flex flex-col gap-5">
        {/* Header branding */}
        <div className="text-center">
          <span className="text-5xl">🔥</span>
          <h1 className="text-xl font-bold mt-2">Alertes {businessName || 'Liquidation'}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Recevez des SMS quand des produits sont en liquidation à prix réduit.
          </p>
        </div>

        {/* Champs */}
        <div className="flex flex-col gap-3">
          <input
            placeholder="Votre prénom (optionnel)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="rounded-[1.25rem] px-4 py-3 focus:outline-none"
            style={inputStyle}
          />
          <input
            placeholder="Numéro de téléphone"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            className="rounded-[1.25rem] px-4 py-3 focus:outline-none"
            style={inputStyle}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full font-bold py-3 rounded-full text-white disabled:opacity-50 active:scale-95 transition-transform duration-150 ease-out"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          {loading ? 'En cours...' : 'S\'abonner'}
        </button>

        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Répondez STOP à tout moment pour vous désabonner.
        </p>
      </div>
    </div>
  )
}
