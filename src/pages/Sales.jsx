import React, { useState, useEffect, useCallback } from 'react'
import { Check, Clock, Package, CheckCircle2 } from 'lucide-react'
import Header from '../components/Header'
import Toast from '../components/Toast'
import client from '../api/client'

// Fonction formatage date
function formatTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
}

export default function Sales() {
  const [pending, setPending]   = useState([])
  const [history, setHistory]   = useState([])
  const [liquidations, setLiquidations] = useState([])
  const [toast, setToast]       = useState(null)
  const dismissToast            = useCallback(() => setToast(null), [])

  // Chargement des données (Polling)
  const fetchData = useCallback(async () => {
    try {
      const [salesRes, liquidRes] = await Promise.all([
        client.get('/sales'),
        client.get('/liquidations')
      ])
      setPending(salesRes.data.pending || [])
      setHistory(salesRes.data.history || [])
      setLiquidations(liquidRes.data.liquidations || [])
    } catch (e) {
      console.error('Erreur chargement ventes', e)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Helper pour retrouver l'info produit
  function getProductInfo(sale) {
    const liq = liquidations.find(l => l._id === sale.liquidationId)
    return {
      title: liq?.title || 'Produit inconnu',
      image: liq?.images?.[0] || null
    }
  }

  // Action: Marquer comme complété
  async function markComplete(saleId) {
    try {
      await client.patch(`/sales/${saleId}/complete`)
      setToast({ msg: 'Commande validée avec succès', type: 'success' })
      fetchData()
    } catch (e) {
      setToast({ msg: 'Erreur lors de la validation', type: 'error' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header />
      <Toast message={toast?.msg} type={toast?.type} onClose={dismissToast} />

      <main className="max-w-2xl mx-auto px-5 pt-6 space-y-8">

        {/* Section En Attente */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Commandes</h1>
              <p className="text-sm text-gray-500">À préparer pour vos clients</p>
            </div>
            {pending.length > 0 && (
              <span className="bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full text-xs font-bold">
                {pending.length} en attente
              </span>
            )}
          </div>

          {/* Empty State - iOS Style */}
          {pending.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-[#006644] mx-auto mb-4">
                <CheckCircle2 size={40} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Tout est traité</h3>
              <p className="text-sm text-gray-500">Aucune commande en attente pour le moment</p>
            </div>
          )}

          {/* Liste des commandes actives */}
          <div className="space-y-4">
            {pending.map(sale => {
              const { title, image } = getProductInfo(sale)
              return (
                <div
                  key={sale._id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  {/* Header Carte */}
                  <div className="flex gap-4 mb-4">
                    {/* Image Produit */}
                    <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {image ? (
                        <img src={image} alt={title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package size={32} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>

                    {/* Infos Principales */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base truncate mb-1">{title}</h3>
                      <p className="text-sm text-gray-500 mb-2">{sale.customerPhone || 'Client anonyme'}</p>

                      <div className="flex items-center gap-2 text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded-lg w-fit">
                        <Clock size={14} strokeWidth={2.5} />
                        <span>{formatTime(sale.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 mb-4" />

                  {/* Actions & Code */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Code Retrait
                      </p>
                      <p className="text-2xl font-mono font-black text-gray-900 tracking-wider">
                        {sale.pickupCode}
                      </p>
                    </div>

                    <button
                      onClick={() => markComplete(sale._id)}
                      className="bg-[#006644] hover:bg-[#005538] text-white px-5 py-3 rounded-full font-bold shadow-md active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Check size={20} strokeWidth={3} />
                      Valider
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section Historique */}
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 mb-4">Historique récent</h2>

          <div className="space-y-3">
            {history.map(sale => {
              const { title, image } = getProductInfo(sale)
              return (
                <div
                  key={sale._id}
                  className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm border border-gray-200"
                >
                  {/* Mini Image */}
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {image ? (
                      <img src={image} alt="" className="w-full h-full object-cover opacity-60" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package size={20} strokeWidth={1.5} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="font-mono">{sale.pickupCode}</span>
                      <span>•</span>
                      <span>{formatTime(sale.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Prix & Statut */}
                  <div className="text-right">
                    <p className="font-bold text-[#006644] text-sm">
                      ${sale.amount?.toFixed(2)}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Livré</p>
                  </div>
                </div>
              )
            })}

            {history.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">
                Aucune commande terminée récemment.
              </p>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
