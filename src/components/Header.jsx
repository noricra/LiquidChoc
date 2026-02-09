import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Settings, Users } from 'lucide-react'
import useMerchantStore from '../store/useMerchantStore'
import ProfilePictureModal from './ProfilePictureModal'

export default function Header() {
  const { merchant, stats, fetchMerchant } = useMerchantStore()
  const navigate = useNavigate()
  const loc = useLocation()
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Fermer la modale de profil quand on navigue
  useEffect(() => {
    setShowProfileModal(false)
  }, [loc.pathname])

  // Cacher le header sur certaines pages publiques
  if (loc.pathname === '/subscribe' || loc.pathname.startsWith('/liquidation') || loc.pathname === '/success') {
    return null
  }

  return (
    <header className="sticky top-0 z-40 bg-gray-50/95 backdrop-blur-md border-b border-gray-200/50">
      <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">

        {/* Logo / Business Name */}
        <div className="flex items-center gap-3">
          {/* Avatar Circle - Click to upload profile picture */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="relative group active:scale-95 transition-transform"
          >
            {merchant?.profileImageUrl ? (
              <img
                src={merchant.profileImageUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-gray-100 group-hover:ring-[#006644] transition-all"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#006644] to-[#004d33] flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                <span className="text-white font-black text-lg">
                  {merchant?.businessName?.[0]?.toUpperCase() || 'L'}
                </span>
              </div>
            )}
            {/* Hover indicator */}
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>

          {/* Business Name */}
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-start active:scale-95 transition-transform"
          >
            <span className="font-extrabold text-gray-900 text-sm leading-none">
              {merchant?.businessName || 'LiquidaChoc'}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Catalogue
            </span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">

          {/* Subscribers Badge */}
          <button
            onClick={() => navigate('/subscribers')}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-white shadow-sm border border-gray-200 hover:shadow-md active:scale-95 transition-all"
          >
            <Users size={16} className="text-[#006644]" strokeWidth={2.5} />
            <span className="text-sm font-bold text-gray-900">
              {stats?.subscribers || 0}
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center hover:shadow-md active:scale-95 transition-all"
            aria-label="Paramètres"
          >
            <Settings size={18} className="text-gray-600" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Profile Picture Modal */}
      {showProfileModal && (
        <ProfilePictureModal
          merchant={merchant}
          onClose={() => setShowProfileModal(false)}
          onSuccess={() => {
            fetchMerchant()
            setShowProfileModal(false)
          }}
        />
      )}
    </header>
  )
}
