import React, { useState, useEffect, useCallback } from 'react'
import Header from '../components/Header'
import Toast from '../components/Toast'
import client from '../api/client'

function formatTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
}

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default function Sales() {
  const [pending, setPending]   = useState([])
  const [history, setHistory]   = useState([])
  const [liquidations, setLiquidations] = useState([])
  const [toast, setToast]       = useState(null)
  const dismissToast            = useCallback(() => setToast(null), [])

  async function fetchData() {
    try {
      const [salesRes, liquidRes] = await Promise.all([
        client.get('/sales'),
        client.get('/liquidations')
      ])
      setPending(salesRes.data.pending)
      setHistory(salesRes.data.history)
      setLiquidations(liquidRes.data.liquidations)
    } catch (e) {
      console.error('fetch sales failed', e)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  function getProductInfo(sale) {
    const liq = liquidations.find(l => l._id === sale.liquidationId)
    return {
      title: liq?.title || 'Produit',
      image: liq?.images?.[0] || null
    }
  }

  async function markComplete(saleId) {
    try {
      await client.patch(`/sales/${saleId}/complete`)
      setToast({ msg: 'Marqué comme remis', type: 'success' })
      fetchData()
    } catch (e) {
      setToast({ msg: 'Erreur', type: 'error' })
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <Header />
      <Toast message={toast?.msg} type={toast?.type} onClose={dismissToast} />

      <main className="px-6 pt-6 pb-28 max-w-2xl mx-auto">

        {/* En attente */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-2xl">En attente</h2>
            {pending.length > 0 && (
              <span className="px-3 py-1 rounded-full text-sm font-black text-white shadow-md" style={{ backgroundColor: '#EF4444' }}>
                {pending.length}
              </span>
            )}
          </div>

          {pending.length === 0 && (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>Aucune commande en attente</p>
          )}

          <div className="flex flex-col gap-3">
            {pending.map(sale => {
              const { title, image } = getProductInfo(sale)
              return (
                <div key={sale._id} className="rounded-2xl p-5 flex gap-4 shadow-md hover:shadow-lg transition-all duration-200" style={{ backgroundColor: 'var(--card-color)', border: '1px solid var(--border-color)' }}>

                  {/* Photo ronde */}
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 shadow-sm" style={{ backgroundColor: 'var(--skeleton-bg)' }}>
                    {image ? (
                      <img src={image} alt={title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                        BOX
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base truncate mb-1">{title}</p>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{sale.customerPhone || 'N/A'}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xl" style={{ color: 'var(--primary-color)' }}>{sale.pickupCode}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatTime(sale.createdAt)}</span>
                    </div>
                  </div>

                  {/* Bouton */}
                  <button
                    onClick={() => markComplete(sale._id)}
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:shadow-lg active:scale-90 transition-all duration-200 flex-shrink-0"
                    style={{ backgroundColor: '#10B981', color: '#fff' }}
                    title="Marquer comme remis"
                  >
                    <CheckIcon />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Historique */}
        <div>
          <h2 className="font-black text-2xl mb-4">Historique</h2>

          {history.length === 0 && (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>Aucune commande complétée</p>
          )}

          <div className="flex flex-col gap-2">
            {history.map(sale => {
              const { title, image } = getProductInfo(sale)
              return (
                <div key={sale._id} className="rounded-xl p-4 flex gap-3 items-center shadow-sm hover:shadow-md transition-all duration-200" style={{ backgroundColor: 'var(--card-color)', border: '1px solid var(--border-color)' }}>

                  {/* Photo ronde mini */}
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-sm" style={{ backgroundColor: 'var(--skeleton-bg)' }}>
                    {image ? (
                      <img src={image} alt={title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                        B
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate mb-1">{title}</p>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="font-mono font-semibold">{sale.pickupCode}</span>
                      <span>•</span>
                      <span className="font-semibold">${sale.amount?.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Badge status */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#10B981' }}>
                    <CheckIcon />
                    <span>Remis</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </main>
    </div>
  )
}
