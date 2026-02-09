import React, { useState, useEffect, useCallback } from 'react'
import Header from '../src/components/Header'
import Toast from '../src/components/Toast'
import useMerchantStore from '../src/store/useMerchantStore'
import client from '../src/api/client'

export default function Settings() {
  const { merchant, setMerchant } = useMerchantStore()
  const [businessName, setBusinessName] = useState('')
  const [address, setAddress]           = useState('')
  const [phone, setPhone]               = useState('')
  const [pickupHours, setPickupHours]   = useState('')
  const [description, setDescription]   = useState('')
  const [toast, setToast]               = useState(null)
  const dismissToast                    = useCallback(() => setToast(null), [])

  useEffect(() => {
    if (!merchant) return
    setBusinessName(merchant.businessName || '')
    setAddress(merchant.address || '')
    setPhone(merchant.phone || '')
    setPickupHours(merchant.pickupHours || '')
    setDescription(merchant.description || '')
  }, [merchant])

  async function save() {
    try {
      const { data } = await client.put('/merchant', { businessName, address, phone, pickupHours, description })
      setMerchant(data.merchant)
      setToast({ msg: 'Sauvegardé ✓', type: 'success' })
    } catch (e) {
      setToast({ msg: 'Erreur', type: 'error' })
    }
  }

  const input = 'w-full rounded-[1.25rem] px-4 py-3 text-sm focus:outline-none'
  const style = { backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <Header />
      <Toast message={toast?.msg} type={toast?.type} onClose={dismissToast} />

      <main className="max-w-lg mx-auto px-5 pt-2 pb-28 flex flex-col gap-4">
        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text-color)' }}>Paramètres</h1>

        <div className="rounded-[2.5rem] p-5 flex flex-col gap-3" style={{ backgroundColor: 'var(--card-color)', boxShadow: 'var(--card-shadow)' }}>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Nom du commerce</label>
            <input value={businessName} onChange={e => setBusinessName(e.target.value)} className={input} style={style} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Description</label>
            <input placeholder="Courte bio de votre commerce" value={description} onChange={e => setDescription(e.target.value)} className={input} style={style} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Adresse de récupération</label>
            <input placeholder="123 Rue Example, Montréal" value={address} onChange={e => setAddress(e.target.value)} className={input} style={style} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Téléphone</label>
            <input placeholder="514 123 4567" value={phone} onChange={e => setPhone(e.target.value)} className={input} style={style} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Horaires de récupération</label>
            <input placeholder="ex: 18h-20h tous les jours" value={pickupHours} onChange={e => setPickupHours(e.target.value)} className={input} style={style} />
          </div>
        </div>

        <button onClick={save} className="w-full py-3.5 rounded-full font-bold text-white text-base active:scale-95 transition-transform duration-150 ease-out" style={{ backgroundColor: 'var(--primary-color)' }}>
          Sauvegarder
        </button>

        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Couleur et mode sombre/clair sont définis à l'installation. Contactez le développeur pour les modifier.
        </p>
      </main>
    </div>
  )
}
