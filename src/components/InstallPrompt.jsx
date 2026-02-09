import React, { useState, useEffect, useRef } from 'react'

function isIOS() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(ua) && !/(chrome|crios|crmo)/.test(ua)
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches
}

export default function InstallPrompt() {
  const [visible, setVisible]       = useState(false)
  const [iosStep, setIosStep]       = useState(1) // 1 = share icon, 2 = add to home screen
  const [platform, setPlatform]     = useState(null) // 'android' | 'ios'
  const promptRef                   = useRef(null)

  useEffect(() => {
    if (isInStandaloneMode()) return
    if (localStorage.getItem('pwa-dismissed') === '1') return

    if (isIOS()) {
      setPlatform('ios')
      setVisible(true)
    }
  }, [])

  // Android : écoutir beforeinstallprompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      promptRef.current = e
      setPlatform('android')
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // iOS : alterne entre step 1 et 2 toutes les 2s
  useEffect(() => {
    if (platform !== 'ios' || !visible) return
    const interval = setInterval(() => setIosStep(s => s === 1 ? 2 : 1), 2000)
    return () => clearInterval(interval)
  }, [platform, visible])

  function dismiss() {
    localStorage.setItem('pwa-dismissed', '1')
    setVisible(false)
  }

  function installAndroid() {
    if (promptRef.current) promptRef.current.prompt()
    dismiss()
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4">
      <div className="rounded-2xl p-4 max-w-md mx-auto relative" style={{ backgroundColor: 'var(--card-color)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
        {/* Close */}
        <button onClick={dismiss} className="absolute top-3 right-3 text-lg active:scale-95 transition-transform duration-150 ease-out" style={{ color: 'var(--text-muted)' }}>✕</button>

        {platform === 'android' && (
          <div className="text-center">
            <p className="font-semibold mb-1" style={{ color: 'var(--text-color)' }}>Ajouter à l'écran d'accueil</p>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Installez l'appli pour un accès rapide</p>
            <button
              onClick={installAndroid}
              className="font-bold px-6 py-2 rounded-full text-sm text-white active:scale-95 transition-transform duration-150 ease-out"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              Installer
            </button>
          </div>
        )}

        {platform === 'ios' && (
          <div className="text-center">
            <p className="font-semibold mb-2" style={{ color: 'var(--text-color)' }}>Ajouter à l'écran d'accueil</p>

            {iosStep === 1 ? (
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl animate-pulse">^</span>
                <p className="text-sm font-medium" style={{ color: 'var(--primary-color)' }}>Tapez sur Partager</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl">+</span>
                <p className="text-sm font-medium" style={{ color: 'var(--primary-color)' }}>puis "Sur l'écran d'accueil"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
