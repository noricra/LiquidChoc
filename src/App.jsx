import React, { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import useMerchantStore from './store/useMerchantStore'
import BottomNav from './components/BottomNav'

const Dashboard    = lazy(() => import('./pages/Dashboard'))
const Catalogue    = lazy(() => import('./pages/Catalogue'))
const Sales        = lazy(() => import('./pages/Sales'))
const Subscribers  = lazy(() => import('./pages/Subscribers'))
const Settings     = lazy(() => import('./pages/Settings'))
const Subscribe    = lazy(() => import('./pages/Subscribe'))
const Liquidation  = lazy(() => import('./pages/Liquidation'))
const Success      = lazy(() => import('./pages/Success'))

const THEMES = {
  light: { '--bg-color': '#FFFFFF', '--card-color': '#F8F9FA', '--text-color': '#000000', '--text-muted': '#64748B', '--border-color': '#E5E7EB', '--card-shadow': '0 8px 30px rgb(0, 0, 0, 0.04)', '--skeleton-bg': '#E2E8F0' },
  dark:  { '--bg-color': '#0A0A0A', '--card-color': '#1A1A1A', '--text-color': '#FFFFFF', '--text-muted': '#9CA3AF', '--border-color': '#2A2A3A', '--card-shadow': '0 8px 30px rgb(0, 0, 0, 0.12)', '--skeleton-bg': '#374151' }
}

function BottomNavConditional() {
  const loc = useLocation()
  if (loc.pathname.startsWith('/liquidation') || loc.pathname === '/subscribe' || loc.pathname === '/success') return null
  return <BottomNav />
}

function App() {
  const { merchant, fetchMerchant } = useMerchantStore()

  useEffect(() => { fetchMerchant() }, [])

  // Injection des CSS variables après fetch du merchant
  useEffect(() => {
    if (!merchant) return
    const root = document.documentElement
    root.style.setProperty('--primary-color', merchant.primaryColor || '#FF6B35')
    const vars = THEMES[merchant.themeMode] || THEMES.dark
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  }, [merchant])

  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chargement...</div>}>
        <Routes>
          <Route path="/"                  element={<Dashboard />}   />
          <Route path="/dashboard"         element={<Dashboard />}   />
          <Route path="/catalogue"         element={<Catalogue />}   />
          <Route path="/sales"             element={<Sales />}       />
          <Route path="/subscribers"       element={<Subscribers />} />
          <Route path="/settings"          element={<Settings />}    />
          <Route path="/subscribe"         element={<Subscribe />}   />
          <Route path="/liquidation/:id"   element={<Liquidation />} />
          <Route path="/success"           element={<Success />}     />
        </Routes>
      </Suspense>
      <BottomNavConditional />
    </BrowserRouter>
  )
}

export default App
