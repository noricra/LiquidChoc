import React, { useState, useEffect } from 'react'
import { Bell, CheckCircle } from 'lucide-react'
import client from '../api/client'

export default function Subscribe() {
  const [businessName, setBusinessName] = useState('')
  const [name, setName]                 = useState('')
  const [phone, setPhone]               = useState('')
  const [success, setSuccess]           = useState(false)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)

  // Récupérer le nom du commerce
  useEffect(() => {
    client.get('/merchant')
      .then(({ data }) => setBusinessName(data.merchant?.businessName || 'Ce commerce'))
      .catch((err) => {
        console.warn('Failed to load merchant info:', err)
        // Continue anyway - not critical for subscription
      })
  }, [])

  // Soumission
  async function submit() {
    if (!phone.trim()) { setError('Numéro requis'); return }
    setLoading(true)
    setError('')
    try {
      await client.post('/subscribers', { phone: phone.trim(), name: name.trim() })
      setSuccess(true)
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur lors de l\'inscription')
      setLoading(false)
    }
  }

  // Écran Succès
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-[#006644] mx-auto mb-6">
            <CheckCircle size={48} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Inscription réussie</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Vous recevrez un SMS dès que <span className="font-bold text-gray-900">{businessName}</span> lancera une liquidation anti-gaspillage.
          </p>
        </div>
      </div>
    )
  }

  // Formulaire
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">

      {/* Carte Formulaire */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#006644]/10 rounded-2xl flex items-center justify-center text-[#006644] mx-auto mb-4">
            <Bell size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 leading-tight mb-1">
            Alertes Anti-Gaspi
          </h1>
          <p className="text-sm text-[#006644] font-bold">
            chez {businessName || '...'}
          </p>
          <p className="text-xs text-gray-500 mt-3 leading-relaxed">
            Soyez alerté des paniers surprises à prix réduit. Premier arrivé, premier servi.
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Prénom
            </label>
            <input
              placeholder="Ex: Thomas"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#006644] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Téléphone mobile
            </label>
            <input
              type="tel"
              placeholder="Ex: 514 123 4567"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#006644] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Message Erreur */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-xs font-bold text-center">{error}</p>
          </div>
        )}

        {/* Bouton Action */}
        <button
          onClick={submit}
          disabled={loading}
          className="w-full mt-6 py-4 rounded-full font-bold text-white text-base bg-[#006644] shadow-lg active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Inscription...' : 'M\'alerter par SMS'}
        </button>

        <p className="text-[10px] text-center text-gray-300 mt-4">
          STOP au 3636 pour vous désabonner.
        </p>
      </div>
    </div>
  )
}
