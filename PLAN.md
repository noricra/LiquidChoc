# PLAN — Liquida-Choc MVP

## Stack
- **Backend:** Node.js + Express (plain JS)
- **Frontend:** React 18 + Vite + React Router + Tailwind CSS
- **State:** Zustand (store global leger)
- **API calls:** Axios
- **DB:** MongoDB Atlas (1 collection : Merchant)
- **Paiement:** Stripe Payment Links
- **SMS:** Twilio
- **Hébergement:** Railway — `npm run build` → Express sert `dist/`
- **PWA:** manifest.json + service worker + InstallPrompt.jsx

## Architecture (white-label)
```
liquidachoc/
├── server.js              ← Express backend + sert dist/ en prod
├── package.json           ← deps backend + frontend + scripts
├── .env.example
├── vite.config.js         ← proxy /api vers Express en dev
├── tailwind.config.js
├── postcss.config.js
├── index.html             ← entry Vite (juste le div#root)
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icon.svg
└── src/
    ├── main.jsx           ← mount React
    ├── App.jsx            ← Router (routes vers les pages)
    ├── api/
    │   └── client.js      ← instance Axios configurée
    ├── store/
    │   └── useMerchantStore.js  ← Zustand (merchantData global)
    ├── components/
    │   ├── Header.jsx     ← header réutilisé sur chaque page
    │   ├── InstallPrompt.jsx   ← PWA install banner iOS/Android
    │   └── Toast.jsx      ← notification toast
    └── pages/
        ├── Dashboard.jsx
        ├── Liquidation.jsx
        ├── Sales.jsx
        ├── Subscribers.jsx
        ├── Settings.jsx
        └── Subscribe.jsx  ← page publique (/subscribe)

Même repo, .env différent par commerce.
Pas de login. URL Railway = accès.
```

## Scripts (package.json)
```
dev:backend   → nodemon server.js
dev:frontend  → vite
dev           → concurrently les deux
build         → vite build
start         → node server.js  (Railway utilise ça)
```

## .env par commerce
```
MONGODB_URI            → leur DB sur Atlas
STRIPE_SECRET_KEY      → leur compte Stripe
STRIPE_WEBHOOK_SECRET  → leur webhook
TWILIO_ACCOUNT_SID     → compte Twilio (le tien)
TWILIO_AUTH_TOKEN      → (le tien)
TWILIO_PHONE_NUMBER    → numéro unique par commerce
SETUP_SECRET           → clé secrète pour /api/setup (toi seul la connais)
PORT                   → géré par Railway
```

## Contraintes techniques (imposées)
- **sw.js** : minimal. Juste `install` + `activate` pour permettre l'icône sur l'écran d'accueil. Pas de stratégie de cache, pas de `fetch` intercepté. Évite les bugs d'affichage.
- **/api/setup** : nécessite `Authorization: Bearer <SETUP_SECRET>` dans le header. Sans ça, 403. Même si le merchant existe déjà → 400. Route verrouillée après le premier appel.
- **Tailwind colors** : palette Lane7 dans tailwind.config.js. Classes utilisables partout : `text-neon-pink`, `bg-neon-cyan`, etc.

## Routes Backend (server.js)
```
POST   /api/setup                  → init unique (créer merchant en DB)
GET    /api/merchant               → données + stats
PUT    /api/merchants              → modifier paramètres
POST   /api/liquidations/create    → créer Payment Link Stripe
POST   /api/liquidations/:id/send  → SMS broadcast (fire & forget)
GET    /api/liquidations           → liste
GET    /api/sales                  → pending + historique
PATCH  /api/sales/:id/complete     → marquer remis
POST   /api/subscribers            → ajouter abonné + SMS bienvenue
GET    /api/subscribers            → liste
POST   /webhook                    → Stripe checkout.session.completed
```

## 6 Pages (1 fichier chacune dans src/pages/)

### Dashboard.jsx  — route `/`
- Header avec nom commerce + ⚙️ vers Settings
- 4 stats : Abonnés / Liquidations / Ventes / Revenu
- 3 cartes nav : Nouvelle Liquidation / Ventes (+ badge pending) / Abonnés

### Liquidation.jsx  — route `/liquidation`
- 3 cartes templates clickables (nom, prix, quantité)
- Après clic : confirmation avec résumé + nb abonnés
- Bouton "Créer et envoyer SMS" → 2 calls séquentiels (create puis send)
- État succès avec retour vers Dashboard

### Sales.jsx  — route `/sales`
- Liste pending : code pickup, produit, prix, phone, heure + bouton "✅ Remis"
- Section historique (20 dernières complétées)
- useEffect avec setInterval 10s pour auto-refresh

### Subscribers.jsx  — route `/subscribers`
- Input recherche (filtre client-side)
- Formulaire ajout : nom + phone + bouton
- Liste des abonnés
- Lien `/subscribe` à copier + QR code généré (lib qrcode-generator via CDN script tag)

### Settings.jsx  — route `/settings`
- Champs : nom, adresse
- 3 blocs templates (nom, prix, prix original, discount%, quantité)
- Bouton Sauvegarder → PUT /api/merchants → met à jour le store Zustand

### Subscribe.jsx  — route `/subscribe`
- Page publique (pas de Header merchant)
- Fetche nom du commerce au mount
- Formulaire : nom (optionnel) + phone
- Succès : message de confirmation
- Pas de InstallPrompt ici

## PWA Install Prompt
- Android : écoutir `beforeinstallprompt`, afficher banner avec bouton "Installer"
- iOS : détection user-agent, banner avec animation 2 étapes :
  - Étape 1 : icône share (pulsing) + "Tapez sur Partager"
  - Étape 2 : "puis Sur l'écran d'accueil"
- Dismiss stocké en localStorage
- Banner slide-up depuis le bas, style carte arrondie

---

## Étapes d'implémentation (à valider une par une)

1.  `package.json` + configs (vite, tailwind, postcss) + `npm install`
2.  `.env.example` + `public/icon.svg` + `public/manifest.json` + `public/sw.js`
3.  `server.js` — Express + MongoDB + schema Merchant + sert dist/
4.  `server.js` — routes CRUD (setup, merchant, subscribers, sales)
5.  `server.js` — route créer liquidation (Stripe Payment Link)
6.  `server.js` — route SMS broadcast + webhook Stripe
7.  `src/main.jsx` + `src/App.jsx` + `src/api/client.js` + store Zustand
8.  `src/components/` — Header, Toast, InstallPrompt (PWA iOS/Android)
9.  `src/pages/Dashboard.jsx` + `src/pages/Liquidation.jsx`
10. `src/pages/Sales.jsx` + `src/pages/Subscribers.jsx`
11. `src/pages/Settings.jsx` + `src/pages/Subscribe.jsx`
12. Test local : `npm run dev` + vérifier les flows
13. Build + test production : `npm run build` + `npm start`
