import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import client from '../src/api/client'

const THEMES = {
  light: { '--bg-color': '#FFFFFF', '--card-color': '#F8F9FA', '--text-color': '#000000', '--text-muted': '#64748B', '--border-color': '#E5E7EB', '--card-shadow': '0 8px 30px rgb(0, 0, 0, 0.04)' },
  dark:  { '--bg-color': '#0A0A0A', '--card-color': '#1A1A1A', '--text-color': '#FFFFFF', '--text-muted': '#9CA3AF', '--border-color': '#2A2A3A', '--card-shadow': '0 8px 30px rgb(0, 0, 0, 0.12)' }
}

export default function Liquidation() {
  const { id }            = useParams()
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paying, setPaying] = useState(false)
  const [stripe, setStripe] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Fetch liquidation data
  useEffect(() => {
    client.get(`/liquidations/${id}`)
      .then(res => { setData(res.data); setLoading(false) })
      .catch(err => { setError(err.response?.data?.error || 'Introuvable'); setLoading(false) })
  }, [id])

  // Initialize Stripe
  useEffect(() => {
    client.get('/config/stripe')
      .then(res => {
        const stripeInstance = window.Stripe(res.data.publishableKey)
        setStripe(stripeInstance)
      })
      .catch(err => console.error('Failed to load Stripe config:', err))
  }, [])

  // Injection theme complet (primary + mode) pour la page publique
  useEffect(() => {
    if (!data) return
    const root = document.documentElement
    if (data.primaryColor) root.style.setProperty('--primary-color', data.primaryColor)
    const vars = THEMES[data.themeMode] || THEMES.dark
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  }, [data])

  // Handle payment with Stripe Checkout
  const handlePayment = async () => {
    if (!stripe) {
      alert('Stripe non initialisé. Veuillez réessayer.')
      return
    }

    setPaying(true)
    try {
      const response = await client.post('/create-checkout-session', {
        liquidationId: id
      })

      const { sessionId } = response.data

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({ sessionId })

      if (error) {
        console.error('Stripe checkout error:', error)
        alert('Erreur lors du paiement. Veuillez réessayer.')
      }
    } catch (err) {
      console.error('Payment error:', err)
      alert(err.response?.data?.error || 'Erreur lors du paiement')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chargement…</div>
  if (error)   return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexDirection: 'column', gap: 12 }}><p className="font-bold text-lg">{error}</p></div>

  const { liquidation: liq, businessName, address, phone, pickupHours, description } = data
  const isLight   = data.themeMode === 'light'
  const discount  = Math.round(((liq.regularPrice - liq.liquidaPrice) / liq.regularPrice) * 100)
  const restantes = liq.quantity - liq.quantitySold
  const soldOut   = restantes <= 0
  const urgent    = restantes <= 5 && !soldOut

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Carousel d'images ── */}
      <div className="relative w-full aspect-video overflow-hidden">
        {liq.images && liq.images.length > 0 ? (
          <>
            {/* Images avec swipe horizontal */}
            <div
              className="flex transition-transform duration-300 ease-out h-full"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {liq.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${liq.title} ${idx + 1}`}
                  className="w-full h-full object-cover flex-shrink-0"
                />
              ))}
            </div>

            {/* Navigation bullets (si plus d'une image) */}
            {liq.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
                {liq.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className="w-2 h-2 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: idx === currentImageIndex ? 'var(--primary-color)' : 'rgba(255,255,255,0.5)',
                      width: idx === currentImageIndex ? '24px' : '8px'
                    }}
                  />
                ))}
              </div>
            )}

            {/* Navigation flèches (si plus d'une image) */}
            {liq.images.length > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev - 1)}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                  >
                    ←
                  </button>
                )}
                {currentImageIndex < liq.images.length - 1 && (
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev + 1)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                  >
                    →
                  </button>
                )}
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--primary-color)33, var(--primary-color)66)', color: 'var(--primary-color)' }}>
            <svg width="80" height="80" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 24h44v28a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V24z" />
              <path d="M10 24l4-12h36l4 12" />
              <path d="M24 12V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" />
            </svg>
          </div>
        )}
        {/* Gradient vers le bas pour la lisibilité */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none" style={{ background: 'linear-gradient(to top, var(--bg-color) 10%, transparent)' }} />

        {/* Badge commerce en haut à gauche */}
        <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white z-10" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          {businessName}
        </div>

        {/* Badge réduction en haut à droite */}
        <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-white text-xs font-black z-10" style={{ backgroundColor: 'var(--primary-color)' }}>
          -{discount}%
        </span>
      </div>

      {/* ── Contenu central ── */}
      <div className="flex-1 px-5 pt-4 pb-32 flex flex-col gap-3">

        {/* Titre */}
        <h1 className="text-2xl font-black leading-tight">{liq.title}</h1>

        {/* Prix */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-black" style={{ color: 'var(--primary-color)' }}>${liq.liquidaPrice.toFixed(2)}</span>
          <span className="font-medium text-sm line-through text-slate-400">${liq.regularPrice.toFixed(2)}</span>
        </div>

        {/* Description */}
        {liq.description && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{liq.description}</p>
        )}

        {/* Détails */}
        <div className="flex flex-col gap-1.5 mt-1">
          {address && <p className="text-sm" style={{ color: 'var(--text-muted)' }}><span className="font-bold">Adresse:</span> {address}</p>}
          {phone && <p className="text-sm" style={{ color: 'var(--text-muted)' }}><span className="font-bold">Tél:</span> {phone}</p>}
          {pickupHours && <p className="text-sm" style={{ color: 'var(--text-muted)' }}><span className="font-bold">Horaires:</span> {pickupHours}</p>}
          <p className={`text-sm font-semibold ${urgent ? 'text-red-500 animate-pulse' : ''}`} style={urgent ? {} : { color: 'var(--text-muted)' }}>
            {restantes} place{restantes !== 1 ? 's' : ''} restante{restantes !== 1 ? 's' : ''}
          </p>
        </div>

        {soldOut && (
          <span className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-bold" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
            Épuisé
          </span>
        )}
      </div>

      {/* ── Footer glassmorphism — Payer ── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 py-4"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          backgroundColor: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
          borderTop: isLight ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {soldOut ? (
          <div className="w-full py-3.5 rounded-full text-center font-bold text-base" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
            Épuisé
          </div>
        ) : (
          <button
            onClick={handlePayment}
            disabled={paying || !stripe}
            className="block w-full py-3.5 rounded-full text-white text-center font-bold text-lg active:scale-95 transition-transform duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            {paying ? 'Chargement...' : `Payer — $${liq.liquidaPrice.toFixed(2)}`}
          </button>
        )}
      </div>
    </div>
  )
}
