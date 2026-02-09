import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Receipt } from 'lucide-react'

export default function Success() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('session_id')
  const [countdown, setCountdown] = useState(5)

  // Gestion du compte à rebours
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">

      {/* Carte de Succès */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 text-center relative overflow-hidden">

        {/* Bande décorative haut */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#006644] via-green-400 to-[#006644]" />

        {/* Cercle Icône */}
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle size={48} className="text-[#006644]" strokeWidth={2.5} />
        </div>

        {/* Titre */}
        <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
          Paiement réussi
        </h1>

        <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
          Merci d'avoir sauvé ce panier. Vous allez recevoir un SMS de confirmation avec votre code de retrait.
        </p>

        {/* Boîte Info Transaction */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-100 flex items-start text-left gap-3">
          <div className="text-gray-400 mt-1">
            <Receipt size={18} strokeWidth={2.5} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              ID Transaction
            </p>
            <p className="text-xs font-mono text-gray-800 bg-white px-2 py-1 rounded border border-gray-200 truncate">
              {sessionId || 'Traitement en cours...'}
            </p>
          </div>
        </div>

        {/* Bouton Retour */}
        <button
          onClick={() => navigate('/')}
          className="w-full py-4 rounded-full font-bold text-white text-base bg-[#006644] shadow-lg active:scale-95 transition-all mb-4"
        >
          Retour à l'accueil
        </button>

        <p className="text-xs text-gray-400 font-medium">
          Redirection automatique dans {countdown}s
        </p>

      </div>
    </div>
  )
}
