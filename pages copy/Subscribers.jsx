import React, { useState, useEffect, useRef, useCallback } from 'react'
import Header from '../components/Header'
import Toast from '../components/Toast'
import client from '../api/client'

function useQRLib() {
  const [qrcode, setQrcode] = useState(null)
  useEffect(() => {
    if (window.qrcode) { setQrcode(() => window.qrcode); return }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'
    script.onload = () => setQrcode(() => window.qrcode)
    document.head.appendChild(script)
  }, [])
  return qrcode
}

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState([])
  const [search, setSearch]           = useState('')
  const [name, setName]               = useState('')
  const [phone, setPhone]             = useState('')
  const [toast, setToast]             = useState(null)
  const dismissToast                  = useCallback(() => setToast(null), [])
  const qrcode                        = useQRLib()
  const qrRef                         = useRef(null)

  const subscribeUrl = `${window.location.origin}/subscribe`

  async function fetchSubscribers() {
    try {
      const { data } = await client.get('/subscribers')
      setSubscribers(data.subscribers)
    } catch (e) {
      console.error('fetch subscribers failed', e)
    }
  }

  useEffect(() => { fetchSubscribers() }, [])

  useEffect(() => {
    if (!qrcode || !qrRef.current) return
    const qr = qrcode(0, 'M')
    qr.addData(subscribeUrl)
    qr.make()
    qrRef.current.innerHTML = qr.createSvgTag()
  }, [qrcode, subscribeUrl])

  async function addSubscriber() {
    if (!phone.trim()) return
    try {
      await client.post('/subscribers', { phone: phone.trim(), name: name.trim() })
      setToast({ msg: 'Abonné ajouté', type: 'success' })
      setName('')
      setPhone('')
      fetchSubscribers()
    } catch (e) {
      setToast({ msg: e.response?.data?.error || 'Erreur', type: 'error' })
    }
  }

  const filtered = subscribers.filter(s =>
    s.phone.includes(search) || (s.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const card  = { backgroundColor: 'var(--card-color)', border: '1px solid var(--border-color)' }
  const input = { backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <Header />
      <Toast message={toast?.msg} type={toast?.type} onClose={dismissToast} />

      <main className="max-w-lg mx-auto px-6 pt-6 pb-28 flex flex-col gap-6">
        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text-color)' }}>Abonnés</h1>

        {/* ── QR Code + lien ── */}
        <div className="rounded-2xl p-6 flex flex-col items-center gap-4 shadow-md" style={card}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Lien d'inscription</p>
          <div ref={qrRef} className="[& svg]:w-44 [& svg]:h-44" />
          <div className="flex items-center gap-3 w-full">
            <input
              readOnly
              value={subscribeUrl}
              className="flex-1 rounded-xl px-4 py-2 text-sm select-all focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
              style={{ ...input, focusRing: 'var(--primary-color)' }}
            />
            <button
              onClick={() => { navigator.clipboard.writeText(subscribeUrl); setToast({ msg: 'Copié !', type: 'info' }) }}
              className="text-sm font-bold px-4 py-2 rounded-xl text-white shadow-sm hover:shadow-md active:scale-95 transition-all duration-200"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              Copier
            </button>
          </div>
        </div>

        {/* ── Formulaire ajout ── */}
        <div className="rounded-2xl p-6 flex flex-col gap-4 shadow-md" style={card}>
          <p className="font-bold text-lg">Ajouter un abonné</p>
          <input
            placeholder="Nom (optionnel)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
            style={input}
          />
          <input
            placeholder="Téléphone (ex: 514 123 4567)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSubscriber()}
            className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
            style={input}
          />
          <button
            onClick={addSubscriber}
            className="w-full font-bold py-3 rounded-xl text-base text-white shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            Ajouter
          </button>
        </div>

        {/* ── Liste ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">{subscribers.length} abonnés</h2>
          </div>
          <input
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all mb-4 shadow-sm"
            style={input}
          />

          <div className="flex flex-col gap-2">
            {filtered.map(s => (
              <div key={s._id} className="rounded-xl px-5 py-3.5 flex justify-between items-center shadow-sm hover:shadow-md transition-all duration-200" style={card}>
                <span className="text-sm font-semibold">{s.name || '—'}</span>
                <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{s.phone}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Aucun résultat</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
