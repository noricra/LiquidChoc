import React, { useState, useEffect, useCallback } from 'react'
import Header from '../components/Header'
import Toast from '../components/Toast'
import TemplateForm from '../components/TemplateForm'
import useMerchantStore from '../store/useMerchantStore'
import client from '../api/client'

const CloverIcon = () => (
  <svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="8"  r="5" fill="currentColor" />
    <circle cx="8"  cy="16" r="5" fill="currentColor" />
    <circle cx="20" cy="16" r="5" fill="currentColor" />
    <circle cx="14" cy="22" r="4" fill="currentColor" />
  </svg>
)

const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

const PersonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="8" r="4" />
  </svg>
)

const OpenBoxIcon = () => (
  <svg width="120" height="120" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 24h44v28a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V24z" />
    <path d="M10 24l4-12h36l4 12" />
    <path d="M24 12V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" />
  </svg>
)

const PlusIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
    <line x1="12" y1="8" x2="12" y2="16" stroke="white" strokeWidth="2" />
    <line x1="8" y1="12" x2="16" y2="12" stroke="white" strokeWidth="2" />
  </svg>
)

function LiquidationModal({ template, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState(1)
  const [creating, setCreating] = useState(false)

  async function liquider() {
    setCreating(true)
    try {
      await client.post('/liquidations/create', { templateId: template._id, quantity })
      onSuccess()
      onClose()
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur')
      setCreating(false)
    }
  }

  const discount = Math.round(((template.regularPrice - template.liquidaPrice) / template.regularPrice) * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fadeIn" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-[2rem] p-6 flex flex-col gap-6 animate-slideUp" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', boxShadow: '0 -4px 24px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>

        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: 'var(--border-color)' }} />
        </div>

        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg" style={{ backgroundColor: 'var(--card-color)' }}>
            {template.images && template.images.length > 0 ? (
              <img src={template.images[0]} alt={template.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                <OpenBoxIcon />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-black text-xl">{template.title}</h3>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black" style={{ color: 'var(--primary-color)' }}>${template.liquidaPrice.toFixed(2)}</span>
              <span className="text-sm line-through" style={{ color: 'var(--text-muted)' }}>${template.regularPrice.toFixed(2)}</span>
              <span className="text-xs font-black px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}>-{discount}%</span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold block mb-3" style={{ color: 'var(--text-muted)' }}>Quantité à liquider</label>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-md active:scale-90 transition-all duration-200"
              style={{ backgroundColor: 'var(--card-color)', color: 'var(--text-color)' }}
            >
              −
            </button>
            <span className="text-4xl font-black w-20 text-center" style={{ color: 'var(--primary-color)' }}>{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(100, quantity + 1))}
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-md active:scale-90 transition-all duration-200"
              style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
            >
              +
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-full font-bold text-base active:scale-[0.98] transition-all duration-200"
            style={{ backgroundColor: 'var(--card-color)', color: 'var(--text-color)' }}
          >
            Annuler
          </button>
          <button
            onClick={liquider}
            disabled={creating}
            className="flex-1 py-3.5 rounded-full font-bold text-white text-base shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            {creating ? 'Envoi...' : 'Liquider'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Catalogue() {
  const { merchant, stats, fetchMerchant, loading } = useMerchantStore()
  const [toast, setToast] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  const dismissToast = useCallback(() => setToast(null), [])

  useEffect(() => { fetchMerchant() }, [fetchMerchant])

  async function addTemplate(data) {
    try {
      await client.post('/templates', data)
      setShowForm(false)
      setToast({ msg: 'Produit ajouté', type: 'success' })
      fetchMerchant()
    } catch (e) {
      setToast({ msg: e.response?.data?.error || 'Erreur', type: 'error' })
    }
  }

  async function deleteTemplate(id, e) {
    e.stopPropagation()
    if (!confirm('Supprimer ce produit ?')) return
    try {
      await client.delete(`/templates/${id}`)
      setToast({ msg: 'Supprimé', type: 'info' })
      fetchMerchant()
    } catch (e) {
      setToast({ msg: 'Erreur', type: 'error' })
    }
  }

  function handleLiquidationSuccess() {
    setToast({ msg: 'Liquidation lancée ! SMS en cours.', type: 'success' })
    fetchMerchant()
  }

  const templates = merchant?.templates || []

  if (loading && !merchant) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
        <Header />
        <main className="px-5 pt-4 pb-24 max-w-2xl mx-auto">
          <div className="rounded-3xl p-6 animate-pulse" style={{ backgroundColor: 'var(--card-color)' }}>
            <div className="h-8 w-48 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <Header />
      <Toast message={toast?.msg} type={toast?.type} onClose={dismissToast} />
      {showForm && <TemplateForm onSave={addTemplate} onClose={() => setShowForm(false)} />}
      {selectedTemplate && <LiquidationModal template={selectedTemplate} onClose={() => setSelectedTemplate(null)} onSuccess={handleLiquidationSuccess} />}

      <main className="px-5 pt-4 pb-24 max-w-2xl mx-auto">
        {/* Carte principale */}
        <div className="rounded-3xl p-6 shadow-lg" style={{ backgroundColor: 'var(--card-color)', border: '1px solid var(--border-color)' }}>

          {/* Section profil commerce */}
          <div className="flex items-center justify-between mb-6 pb-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <span style={{ color: 'var(--primary-color)' }}><CloverIcon /></span>
              <span className="text-xl font-black" style={{ color: 'var(--primary-color)' }}>
                {merchant?.businessName || 'Liquida-Choc'}
              </span>
            </div>
            <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}><CameraIcon /></span>
            </button>
          </div>

          {/* Onglet Catalogue */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black pb-3" style={{ borderBottom: '3px solid var(--primary-color)' }}>
                Catalogue
              </h2>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <PersonIcon />
                <span className="font-semibold">{stats?.subscribers || 0}</span>
              </div>
            </div>
          </div>

          {/* Contenu */}
          {templates.length === 0 && (
            <div className="flex flex-col items-center text-center py-12">
              <div style={{ color: 'var(--primary-color)' }} className="mb-6">
                <OpenBoxIcon />
              </div>
              <h3 className="text-2xl font-black mb-2">Catalogue vide</h3>
              <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
                Tapez le + pour ajouter le produit
              </p>
            </div>
          )}

          {templates.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {templates.map(t => (
                <div
                  key={t._id}
                  onClick={() => setSelectedTemplate(t)}
                  className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl active:scale-[0.97] transition-all duration-300"
                  style={{ backgroundColor: 'var(--bg-color)' }}
                >
                  {t.images && t.images.length > 0 ? (
                    <img src={t.images[0]} alt={t.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--primary-color)15, var(--primary-color)35)', color: 'var(--primary-color)' }}>
                      <OpenBoxIcon />
                    </div>
                  )}

                  <button
                    onClick={(e) => deleteTemplate(t._id, e)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white text-base shadow-lg active:scale-90 transition-all duration-200"
                    style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                  >
                    ✕
                  </button>

                  <div className="absolute inset-x-0 bottom-0 p-3 backdrop-blur-sm" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                    <p className="text-white text-sm font-bold truncate">{t.title}</p>
                    <p className="text-white/80 text-xs font-semibold">${t.liquidaPrice.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bouton flottant + */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-6 shadow-2xl active:scale-90 transition-all duration-200"
        style={{ color: 'var(--primary-color)' }}
        aria-label="Ajouter un produit"
      >
        <PlusIcon />
      </button>
    </div>
  )
}
