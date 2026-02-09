import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { MapPin, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import client from '../api/client'

export default function Liquidation() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Récupération des données
  useEffect(() => {
    client.get(`/liquidations/${id}`)
      .then(res => { setData(res.data); setLoading(false) })
      .catch(err => { setError(err.response?.data?.error || 'Introuvable'); setLoading(false) })
  }, [id])

  // Gestion du Paiement - Simple redirection vers Payment Link
  const handlePayment = () => {
    if (!data?.liquidation?.stripePaymentLinkUrl) {
      return alert('Lien de paiement indisponible')
    }
    // Ouvrir le Payment Link Stripe dans le même onglet
    window.location.href = data.liquidation.stripePaymentLinkUrl
  }

  // Navigation carousel
  const nextImage = () => {
    if (data?.liquidation?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % data.liquidation.images.length)
    }
  }

  const prevImage = () => {
    if (data?.liquidation?.images) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? data.liquidation.images.length - 1 : prev - 1
      )
    }
  }

  // Loading / Error
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white text-gray-400 text-sm">Chargement...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center bg-white text-red-500 font-bold">{error}</div>
  if (!data) return null

  // Variables d'affichage
  const { liquidation: liq, businessName, address, pickupHours } = data
  const discount = Math.round(((liq.regularPrice - liq.liquidaPrice) / liq.regularPrice) * 100)
  const restantes = liq.quantity - liq.quantitySold
  const soldOut = restantes <= 0
  const urgent = restantes <= 5 && !soldOut

  return (
    <div className="min-h-screen bg-gray-50 pb-32">

      {/* Carrousel d'images */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        {liq.images && liq.images.length > 0 ? (
          <>
            <div
              className="flex transition-transform duration-500 ease-out h-full"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {liq.images.map((img, idx) => (
                <img key={idx} src={img} alt="Produit" className="w-full h-full object-cover flex-shrink-0" />
              ))}
            </div>

            {/* Navigation flèches (si plusieurs images) */}
            {liq.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#006644] shadow-xl flex items-center justify-center text-white active:scale-90 transition-transform hover:bg-[#005538]"
                >
                  <ChevronLeft size={24} strokeWidth={3} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#006644] shadow-xl flex items-center justify-center text-white active:scale-90 transition-transform hover:bg-[#005538]"
                >
                  <ChevronRight size={24} strokeWidth={3} />
                </button>

                {/* Bullets */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {liq.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentImageIndex ? 'w-6 bg-white' : 'w-2 bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <span className="text-sm font-medium">Pas d'image disponible</span>
          </div>
        )}

        {/* Badges Flottants */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <span className="bg-white/95 backdrop-blur-sm shadow-sm px-3 py-1.5 rounded-full text-xs font-bold text-gray-800">
            {businessName}
          </span>
          <span className="bg-[#006644] text-white px-3 py-1.5 rounded-full text-xs font-black shadow-lg">
            -{discount}%
          </span>
        </div>
      </div>

      {/* Corps de page */}
      <div className="px-5 -mt-6 relative z-10 max-w-2xl mx-auto">

        {/* Carte Principale (Titre & Prix) */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 mb-6">
          <div className="flex justify-between items-start mb-3">
            <h1 className="text-xl font-extrabold leading-tight text-gray-900 flex-1 pr-2">
              {liq.title}
            </h1>
            <div className="text-right">
              <div className="text-2xl font-black text-[#006644]">${liq.liquidaPrice.toFixed(2)}</div>
              <div className="text-sm text-gray-400 line-through font-medium">${liq.regularPrice.toFixed(2)}</div>
            </div>
          </div>

          <p className="text-sm text-gray-500 leading-relaxed mb-4">
            {liq.description || "Profitez de ce panier surprise à prix réduit. Quantités limitées."}
          </p>

          {/* Indicateur de stock */}
          <div className="flex items-center gap-2">
            <div className={`h-2 flex-1 rounded-full ${soldOut ? 'bg-gray-200' : 'bg-green-100'}`}>
              <div
                className={`h-full rounded-full transition-all ${soldOut ? 'bg-gray-400' : 'bg-[#006644]'}`}
                style={{ width: `${Math.min(100, (restantes / liq.quantity) * 100)}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${urgent ? 'text-orange-500' : 'text-gray-400'}`}>
              {soldOut ? 'Épuisé' : `${restantes} dispo`}
            </span>
          </div>
        </div>

        {/* Section Infos Pratiques */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900">Infos de récupération</h3>

          <div className="bg-white rounded-xl p-4 flex items-center gap-4 border border-gray-200 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
              <MapPin size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Adresse</p>
              <p className="text-sm font-semibold text-gray-800">{address || 'Non spécifiée'}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 flex items-center gap-4 border border-gray-200 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
              <Clock size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Horaires</p>
              <p className="text-sm font-semibold text-gray-800">{pickupHours || 'Voir en magasin'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Sticky (Bouton d'action) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handlePayment}
            disabled={soldOut}
            className="w-full py-4 rounded-full font-bold text-white text-base shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
            style={{ backgroundColor: soldOut ? '#9CA3AF' : '#006644' }}
          >
            {soldOut ? 'Victime de son succès' : 'Réserver maintenant'}
          </button>
        </div>
      </div>

    </div>
  )
}
