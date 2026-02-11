import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Copy, Search, UserPlus, QrCode, Users, Trash2 } from 'lucide-react'
import Header from '../components/Header'
import Toast from '../components/Toast'
import client from '../api/client'

// Hook QR Code
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

  // Chargement des abonnés
  const fetchSubscribers = useCallback(async () => {
    try {
      const { data } = await client.get('/subscribers')
      setSubscribers(data.subscribers)
    } catch (e) {
      console.error('Erreur chargement abonnés', e)
    }
  }, [])

  useEffect(() => { fetchSubscribers() }, [fetchSubscribers])

  // Génération QR Code
  useEffect(() => {
    if (!qrcode || !qrRef.current) return
    try {
      const qr = qrcode(0, 'M')
      qr.addData(subscribeUrl)
      qr.make()
      qrRef.current.innerHTML = qr.createSvgTag()
    } catch (e) {
      console.error('Erreur QR', e)
    }
  }, [qrcode, subscribeUrl])

  // Ajout manuel
  async function addSubscriber() {
    if (!phone.trim()) return
    try {
      await client.post('/subscribers', { phone: phone.trim(), name: name.trim() })
      setToast({ msg: 'Nouvel abonné ajouté', type: 'success' })
      setName('')
      setPhone('')
      fetchSubscribers()
    } catch (e) {
      setToast({ msg: e.response?.data?.error || 'Erreur', type: 'error' })
    }
  }

  // Suppression
  async function deleteSubscriber(id) {
    if (!confirm('Supprimer cet abonné ?')) return
    try {
      await client.delete(`/subscribers/${id}`)
      setToast({ msg: 'Abonné supprimé', type: 'success' })
      fetchSubscribers()
    } catch (e) {
      setToast({ msg: 'Erreur suppression', type: 'error' })
    }
  }

  // Filtrage
  const filtered = subscribers.filter(s =>
    s.phone.includes(search) || (s.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header />
      <Toast message={toast?.msg} type={toast?.type} onClose={dismissToast} />

      <main className="max-w-2xl mx-auto px-5 pt-6 space-y-6">

        {/* Titre */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Abonnés SMS</h1>
          <p className="text-sm text-gray-500">Gérez votre communauté d'alertes</p>
        </div>

        {/* Carte QR Code */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#006644]/10 flex items-center justify-center">
              <QrCode size={20} className="text-[#006644]" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm">QR Code d'inscription</h3>
              <p className="text-xs text-gray-500">À afficher en magasin</p>
            </div>
          </div>

          <div
            ref={qrRef}
            className="w-48 h-48 mx-auto mb-4 [&>svg]:w-full [&>svg]:h-full [&>svg]:rounded-xl bg-gray-50 rounded-2xl p-3 border border-gray-100"
          />

          <div className="flex items-center gap-2 w-full bg-gray-50 rounded-xl p-3 border border-gray-100">
            <input
              readOnly
              value={subscribeUrl}
              className="flex-1 bg-transparent text-xs text-gray-600 font-mono focus:outline-none truncate"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(subscribeUrl)
                setToast({ msg: 'Lien copié', type: 'success' })
              }}
              className="bg-white hover:bg-gray-100 text-[#006644] p-2 rounded-lg shadow-sm border border-gray-200 active:scale-95 transition-all"
            >
              <Copy size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Formulaire Ajout Rapide */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <UserPlus size={20} className="text-blue-500" strokeWidth={2.5} />
            </div>
            <h3 className="font-extrabold text-gray-900 text-sm">Ajout manuel</h3>
          </div>

          <div className="space-y-3">
            <input
              placeholder="Nom du client (optionnel)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#006644] focus:bg-white transition-all"
            />
            <div className="flex gap-2">
              <input
                placeholder="Téléphone (ex: 514...)"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSubscriber()}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#006644] focus:bg-white transition-all"
              />
              <button
                onClick={addSubscriber}
                disabled={!phone}
                className="bg-[#006644] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>

        {/* Liste des Abonnés */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-gray-900">Liste des abonnés</h2>
            <span className="bg-[#006644]/10 text-[#006644] px-3 py-1.5 rounded-full text-xs font-bold">
              {subscribers.length} total
            </span>
          </div>

          {/* Barre Recherche */}
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={18} strokeWidth={2.5} />
            </span>
            <input
              placeholder="Rechercher par nom ou numéro..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#006644] shadow-sm transition-all"
            />
          </div>

          {/* La Liste */}
          <div className="space-y-2">
            {filtered.map(s => (
              <div
                key={s._id}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">
                      {s.name || 'Client sans nom'}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(s.phone)
                        setToast({ msg: 'Numéro copié', type: 'success' })
                      }}
                      className="flex items-center gap-2 mt-1 group"
                    >
                      <p className="text-gray-500 text-xs font-mono group-hover:text-[#006644] transition-colors">
                        {s.phone}
                      </p>
                      <Copy size={12} className="text-gray-400 group-hover:text-[#006644] transition-colors" strokeWidth={2.5} />
                    </button>
                  </div>
                  <button
                    onClick={() => deleteSubscriber(s._id)}
                    className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0 ml-3 transition-colors active:scale-95"
                  >
                    <Trash2 size={18} className="text-red-500" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">
                {search ? `Aucun résultat pour "${search}"` : 'Aucun abonné pour le moment'}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
