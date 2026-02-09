import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, PackageOpen, Sparkles } from 'lucide-react'
import Header from '../components/Header'
import Toast from '../components/Toast'
import TemplateForm from '../components/TemplateForm'
import useMerchantStore from '../store/useMerchantStore'
import client from '../api/client'

// --- MODALE DE LIQUIDATION (Style Premium) ---
function LiquidationModal({ template, onClose, onSuccess, onDelete }) {
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

  function handleDelete(e) {
    e.stopPropagation()
    if (confirm('Supprimer définitivement ce produit ?')) {
      onDelete(template._id)
      onClose()
    }
  }

  const discount = Math.round(((template.regularPrice - template.liquidaPrice) / template.regularPrice) * 100)

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-5" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Card - Mobile bottom sheet style */}
      <div
        className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Image Hero - Plus grande, sans titre superposé */}
        <div className="h-72 bg-gray-100 relative">
          {template.images?.[0] ? (
            <img src={template.images[0]} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <PackageOpen size={64} strokeWidth={1.5} />
            </div>
          )}

          {/* Badge réduction - Top right */}
          <div className="absolute top-4 right-4 bg-white text-[#006644] px-3 py-1.5 rounded-xl text-xs font-black shadow-lg">
            -{discount}%
          </div>

          {/* Bouton Supprimer - Top left (discret) */}
          <button
            onClick={handleDelete}
            className="absolute top-4 left-4 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 shadow-md hover:bg-white transition-all"
          >
            <Trash2 size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Titre séparé */}
          <h3 className="text-xl font-extrabold text-gray-900 mb-3">
            {template.title}
          </h3>

          {/* Description avec limite */}
          {template.description && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                {template.description}
              </p>
            </div>
          )}

          {/* Prix Section - Plus compact */}
          <div className="bg-green-50 rounded-xl p-4 mb-5">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1.5">
              Prix de vente
            </p>
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-[#006644]">
                ${template.liquidaPrice.toFixed(2)}
              </span>
              <span className="text-base text-gray-400 line-through font-medium">
                ${template.regularPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Quantité - Plus compact */}
          <div className="mb-5">
            <p className="text-center text-gray-500 text-sm font-semibold mb-3">
              Combien de paniers à liquider ?
            </p>
            <div className="flex items-center justify-center gap-5">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xl font-bold active:scale-90 transition-transform hover:bg-gray-200"
              >
                -
              </button>
              <span className="text-4xl font-black text-gray-900 w-16 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(100, quantity + 1))}
                className="w-12 h-12 rounded-full bg-[#006644] text-white flex items-center justify-center text-xl font-bold active:scale-90 transition-transform shadow-lg hover:bg-[#005533]"
              >
                +
              </button>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={liquider}
            disabled={creating}
            className="w-full py-3.5 rounded-full font-bold text-white text-base bg-[#006644] shadow-lg active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {creating ? 'Envoi des SMS...' : 'Lancer la liquidation'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- PAGE PRINCIPALE ---
export default function Catalogue() {
  const { merchant, fetchMerchant, loading } = useMerchantStore()
  const [toast, setToast] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  const dismissToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    fetchMerchant()
  }, [fetchMerchant])

  async function addTemplate(data) {
    try {
      await client.post('/templates', data)
      setShowForm(false)
      setToast({ msg: 'Produit ajouté au catalogue', type: 'success' })
      fetchMerchant()
    } catch (e) {
      setToast({ msg: e.response?.data?.error || 'Erreur', type: 'error' })
    }
  }

  async function deleteTemplate(id, e) {
    if (e) e.stopPropagation()
    if (!confirm('Supprimer définitivement ce produit ?')) return
    try {
      await client.delete(`/templates/${id}`)
      setToast({ msg: 'Produit supprimé', type: 'success' })
      fetchMerchant()
    } catch (e) {
      setToast({ msg: 'Erreur suppression', type: 'error' })
    }
  }

  const templates = merchant?.templates || []

  // Squelette chargement
  if (loading && !merchant) {
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <Header />
        <main className="px-5 pt-6 grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header />
      <Toast message={toast?.msg} type={toast?.type} onClose={dismissToast} />

      {/* Modales */}
      {showForm && <TemplateForm onSave={addTemplate} onClose={() => setShowForm(false)} />}
      {selectedTemplate && (
        <LiquidationModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onSuccess={() => {
            setToast({ msg: 'SMS envoyés avec succès', type: 'success' })
            fetchMerchant()
          }}
          onDelete={deleteTemplate}
        />
      )}

      <main className="px-5 pt-6 max-w-2xl mx-auto">

        {/* Titre */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Catalogue</h1>
            <p className="text-sm text-gray-500">
              {templates.length === 0 ? 'Aucun produit' : `${templates.length} produit${templates.length > 1 ? 's' : ''}`}
            </p>
          </div>

          {templates.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-[#006644] text-white rounded-full font-bold text-sm shadow-md active:scale-95 transition-transform flex items-center gap-2"
            >
              <Plus size={18} strokeWidth={2.5} />
              Ajouter
            </button>
          )}
        </div>

        {/* Empty State Premium */}
        {templates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            {/* Icône centrale */}
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <PackageOpen size={48} className="text-gray-400" strokeWidth={1.5} />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-[#006644] flex items-center justify-center shadow-lg">
                <Sparkles size={20} className="text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Texte */}
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">
              Créez votre premier produit
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-xs mb-8 leading-relaxed">
              Ajoutez des paniers surprises à votre catalogue pour commencer à liquider vos invendus.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-[#006644] text-white rounded-full font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2"
            >
              <Plus size={20} strokeWidth={2.5} />
              Créer un produit
            </button>
          </div>
        )}

        {/* Grille Produits */}
        {templates.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {templates.map(t => {
              const discount = Math.round(((t.regularPrice - t.liquidaPrice) / t.regularPrice) * 100)
              return (
                <div
                  key={t._id}
                  onClick={() => setSelectedTemplate(t)}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.97] transition-transform"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] bg-gray-100 relative">
                    {t.images && t.images.length > 0 ? (
                      <img src={t.images[0]} alt={t.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <PackageOpen size={40} strokeWidth={1.5} />
                      </div>
                    )}

                    {/* Badge réduction */}
                    <div className="absolute top-3 right-3 bg-[#006644] text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
                      -{discount}%
                    </div>

                    {/* Bouton Supprimer */}
                    <button
                      onClick={(e) => deleteTemplate(t._id, e)}
                      className="absolute top-3 left-3 w-7 h-7 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    {/* Titre */}
                    <h3 className="text-sm font-extrabold mb-2 line-clamp-2 leading-tight min-h-[2.5rem]">
                      {t.title}
                    </h3>

                    {/* Prix */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg font-extrabold text-[#006644]">
                        ${t.liquidaPrice.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-400 line-through">
                        ${t.regularPrice.toFixed(2)}
                      </span>
                    </div>

                    {/* CTA Button */}
                    <div className="w-full text-center py-1.5 bg-green-50 text-[#006644] rounded-lg text-xs font-bold">
                      Liquider
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

    </div>
  )
}
