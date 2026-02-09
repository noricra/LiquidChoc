import React, { useState, useRef, useMemo } from 'react'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import client from '../api/client'

// Fonction pour générer un UUID simple
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export default function TemplateForm({ onSave, onClose }) {
  // Générer un productId unique pour cette session d'upload
  const productId = useMemo(() => generateUUID(), [])

  const [form, setForm] = useState({ title: '', description: '', regularPrice: '', liquidaPrice: '', images: [] })
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const remaining = 5 - form.images.length
    if (remaining <= 0) {
      setError('Maximum 5 photos')
      return
    }

    const toUpload = files.slice(0, remaining)
    setUploading(true)
    setError('')

    const uploaded = []
    for (const file of toUpload) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('productId', productId) // Ajouter le productId pour organiser les dossiers

        const { data } = await client.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        uploaded.push(data.url)
      } catch (err) {
        console.error('Upload failed:', err)
        setError('Erreur upload: ' + (err.response?.data?.error || err.message))
        break
      }
    }

    setForm(prev => ({ ...prev, images: [...prev.images, ...uploaded] }))
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(index) {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  function submit() {
    if (!form.title.trim() || !form.regularPrice || !form.liquidaPrice) {
      setError('Titre, prix régulier et prix Liquida sont requis')
      return
    }
    onSave({
      title:        form.title.trim(),
      description:  form.description.trim(),
      regularPrice: parseFloat(form.regularPrice),
      liquidaPrice: parseFloat(form.liquidaPrice),
      images:       form.images
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-5" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Container - Réduit et optimisé */}
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Plus compact */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Nouveau produit</h2>
            <p className="text-[10px] text-gray-500 font-medium">Ajoutez un panier surprise</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 active:scale-95 transition-all"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body - Espacement réduit */}
        <div className="p-5 space-y-4 pb-6">

          {/* Section Photos */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Photos ({form.images.length}/5)
            </label>

            {/* Grille de previews */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {form.images.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg active:scale-90"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bouton upload - Plus compact */}
            {form.images.length < 5 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-600 font-semibold text-sm hover:bg-gray-100 hover:border-gray-400 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>Upload en cours...</>
                ) : (
                  <>
                    <Upload size={16} strokeWidth={2.5} />
                    Ajouter des photos
                  </>
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Nom du produit */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Nom du produit
            </label>
            <input
              placeholder="Ex: Croissants du matin"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#006644] focus:bg-white transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Décrivez brièvement (optionnel)"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows="2"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#006644] focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Prix régulier
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="25.00"
                  value={form.regularPrice}
                  onChange={e => set('regularPrice', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#006644] focus:bg-white transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#006644] uppercase tracking-wider mb-1.5">
                Prix Liquida
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#006644] font-bold text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="12.50"
                  value={form.liquidaPrice}
                  onChange={e => set('liquidaPrice', e.target.value)}
                  className="w-full bg-green-50 border border-green-200 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold text-[#006644] focus:outline-none focus:ring-2 focus:ring-[#006644] focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Bouton submit - Plus de marge en bas */}
          <button
            onClick={submit}
            disabled={uploading}
            className="w-full py-3.5 rounded-full font-bold text-white text-base bg-[#006644] shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            Ajouter au catalogue
          </button>
        </div>
      </div>
    </div>
  )
}
