import React, { useState, useEffect, useCallback } from 'react'
import { MapPin, Phone, Clock } from 'lucide-react'
import Header from '../components/Header'
import Toast from '../components/Toast'
import useMerchantStore from '../store/useMerchantStore'
import client from '../api/client'

export default function Settings() {
  const { merchant, setMerchant } = useMerchantStore()

  // États du formulaire
  const [businessName, setBusinessName] = useState('')
  const [address, setAddress]           = useState('')
  const [phone, setPhone]               = useState('')
  const [pickupHours, setPickupHours]   = useState('')
  const [description, setDescription]   = useState('')

  // États UI
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)

  const dismissToast = useCallback(() => setToast(null), [])

  // Chargement des données initiales
  useEffect(() => {
    if (!merchant) return
    setBusinessName(merchant.businessName || '')
    setAddress(merchant.address || '')
    setPhone(merchant.phone || '')
    setPickupHours(merchant.pickupHours || '')
    setDescription(merchant.description || '')
  }, [merchant])

  // Sauvegarde
  async function save() {
    setSaving(true)
    try {
      const { data } = await client.put('/merchant', {
        businessName,
        address,
        phone,
        pickupHours,
        description
      })
      setMerchant(data.merchant)
      setToast({ msg: 'Modifications enregistrées', type: 'success' })
    } catch (e) {
      setToast({ msg: 'Erreur lors de la sauvegarde', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
  const inputStyle = "w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006644] focus:bg-white transition-all"

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <Header />
      <Toast message={toast?.msg} type={toast?.type} onClose={dismissToast} />

      <main className="max-w-2xl mx-auto px-5 pt-4">

        {/* Titre */}
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Paramètres</h1>
          <p className="text-sm text-gray-500">Informations visibles par vos clients</p>
        </div>

        {/* Carte Formulaire */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 space-y-4">

          {/* Nom */}
          <div>
            <label className={labelStyle}>Nom du commerce</label>
            <input
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              className={inputStyle}
              placeholder="Ex: Boulangerie Pâtisserie"
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelStyle}>Description courte</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={`${inputStyle} resize-none`}
              rows="1"
              placeholder="Ex: Sauvez nos délicieux produits frais du jour"
            />
          </div>

          {/* Adresse */}
          <div>
            <label className={labelStyle}>Adresse de récupération</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <MapPin size={18} strokeWidth={2.5} />
              </span>
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                className={`${inputStyle} pl-12`}
                placeholder="123 Rue Principale, Montréal"
              />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label className={labelStyle}>Téléphone public</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Phone size={18} strokeWidth={2.5} />
              </span>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className={`${inputStyle} pl-12`}
                placeholder="514 123 4567"
              />
            </div>
          </div>

          {/* Horaires */}
          <div>
            <label className={labelStyle}>Horaires de récupération</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Clock size={18} strokeWidth={2.5} />
              </span>
              <input
                value={pickupHours}
                onChange={e => setPickupHours(e.target.value)}
                className={`${inputStyle} pl-12`}
                placeholder="Ex: 17h00 - 19h00"
              />
            </div>
          </div>

        </div>

      </main>

      {/* Bouton Sauvegarder (Sticky Bottom) */}
      <div className="fixed bottom-24 left-0 right-0 px-5 z-40">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3.5 rounded-full font-bold text-white text-base bg-[#006644] shadow-lg active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
          </button>
        </div>
      </div>

    </div>
  )
}
