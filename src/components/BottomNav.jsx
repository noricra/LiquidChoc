import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Grid2X2, Package, Settings } from 'lucide-react'

const TABS = [
  { path: '/',           label: 'Dashboard',  Icon: Home },
  { path: '/catalogue',  label: 'Catalogue',  Icon: Grid2X2 },
  { path: '/sales',      label: 'Ventes',     Icon: Package },
  { path: '/settings',   label: 'Paramètres', Icon: Settings },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const loc = useLocation()

  const isActive = (path) => {
    if (path === '/') return loc.pathname === '/' || loc.pathname === '/dashboard'
    if (path === '/catalogue') return loc.pathname === '/catalogue'
    return loc.pathname === path
  }

  // Masquer la nav sur certaines pages publiques
  if (loc.pathname.startsWith('/liquidation') || loc.pathname === '/subscribe' || loc.pathname === '/success') {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-2xl">
      <div className="mx-4 mb-3 bg-white/80 backdrop-blur-sm rounded-full shadow-md">
        <div className="flex justify-around items-center px-3 py-3">
          {TABS.map(({ path, label, Icon }) => {
            const active = isActive(path)
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 ${
                  active ? 'bg-[#006644]/10' : 'hover:bg-gray-50/50'
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={2.5}
                  className={active ? 'text-[#006644]' : 'text-gray-500'}
                />
                <span className={`text-[10px] font-semibold ${active ? 'text-[#006644]' : 'text-gray-500'}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
