// Service Worker — minimal, installation PWA uniquement.
// Pas de stratégie de cache : évite les bugs d'affichage en dev/prod.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})
