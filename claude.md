# Liquida-Choc — CLAUDE.md

## Projet

**LiquidaChoc** est un SaaS de liquidation d'invendus via SMS pour commerces locaux (restaurants, salles de jeux, salons).

**Concept :** Le commerce met en liquidation son stock invendu avec réduction (40-60%), envoie un SMS à ses abonnés avec un lien vers une **page produit publique** (comme Too Good To Go) affichant photos, détails, prix et horaires. Le client paie **dans l'app** via Stripe Checkout (modal intégrée) et reçoit un code pickup par SMS.

**Architecture :** Multi-tenant single-tenant = **1 code source, N instances déployées**. Chaque instance est configurée par son .env unique (Backend Caméléon).

**Infrastructure :**
- **Code :** 1 seul repo Git
- **Déploiement :** N instances Vercel (1 instance = 1 commerce client)
- **Database :** MongoDB Atlas cluster avec N databases (1 DB isolée par commerce)
- **Object Storage :** 1 bucket Cloudflare R2 partagé avec dossiers différents par commerce
- **SMS :** Twilio avec 1 numéro dédié par commerce

**Stack :** Express (JS) + MongoDB + Stripe Checkout + Twilio + Bull/Redis pour SMS queue. Frontend React + Vite + Tailwind.

---

## Architecture

Structure monorepo (pas de workspaces npm) :

```
backend/src/
  config/       → env.js, db.js, stripe.js, twilio.js, redis.js, storage.js, sector.js
  models/       → Merchant.js (embedded: templates, subscribers, liquidations, sales)
  routes/       → merchant, template, subscriber, liquidation, sale, upload, checkout, setup
  controllers/  → merchant, liquidation, webhook, sale, template, subscriber, upload, checkout, setup
  services/     → stripe.service, twilio.service, sms.service, storage.service, queue.service
  jobs/         → smsBroadcast.job, expiredSales.job
  middleware/   → notFound, errorHandler
  workers/      → index.js (Bull queue workers)
  utils/        → helpers.js

src/  (frontend)
  api/          → client.js (axios + base URL http://localhost:3000/api)
  store/        → useMerchantStore.js (zustand - fetch merchant info)
  pages/        → Dashboard, Catalogue, Sales, Subscribers, Settings, Subscribe, Liquidation, Success
  components/   → Header, BottomNav, Toast, TemplateForm
```

## Dependencies

**Backend:** express, mongoose, cors, dotenv, stripe, twilio, bull, ioredis, multer, aws-sdk
**Frontend:** react, react-dom, react-router-dom, axios, zustand
**Dev:** vite, tailwindcss, autoprefixer, postcss, nodemon, concurrently

## Env vars

```bash
# Serveur
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://votre-app.vercel.app

# MongoDB (1 DB par commerce)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/commerce-A?appName=...

# Redis (Bull queue SMS)
REDIS_URL=redis://localhost:6379

# Stripe (compte isolé par commerce)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (1 numéro par commerce)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+15141234567

# Cloudflare R2 Storage (bucket partagé, dossiers différents)
R2_SECRET_KEY=xxx
R2_APPLICATION_KEY=xxx
R2_BUCKET_NAME=liquidchoc-prod
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com/bucket

# Setup initial
SETUP_SECRET=random_secret_for_onboarding

# Backend Caméléon - Sector-Aware
SECTOR=food  # food | games | services
BUSINESS_NAME=La Pâtisserie du Coin
PRIMARY_COLOR=#FF6B35
SECONDARY_COLOR=#004E89
ACCENT_COLOR=#06D6A0
MERCHANT_ADDRESS=123 Rue Principale, Montréal
MERCHANT_PHONE=+15141234567
PICKUP_HOURS=18h-20h tous les jours
```

---

## Modèles de données

### Merchant (Single Document Architecture)

Toutes les données sont **embedded** dans un seul document Merchant (pas de collections séparées).

```js
{
  _id: ObjectId,
  businessName: String,
  address: String,
  phone: String,
  pickupHours: String,           // ex: "18h-20h tous les jours"
  description: String,            // Bio du commerce
  profileImageUrl: String,        // Logo/Photo vitrine
  primaryColor: String,           // ex: "#FF6B35"
  themeMode: 'light' | 'dark',

  // Templates (produits du catalogue)
  templates: [
    {
      _id: ObjectId,
      title: String,
      description: String,
      regularPrice: Number,
      liquidaPrice: Number,
      images: [String]  // Array de URLs R2 (max 5 photos)
    }
  ],

  // Subscribers (abonnés SMS)
  subscribers: [
    {
      _id: ObjectId,
      phone: String,  // E.164: +15141234567
      name: String,
      addedAt: Date
    }
  ],

  // Liquidations (campagnes actives)
  liquidations: [
    {
      _id: ObjectId,
      templateId: ObjectId,
      title: String,
      description: String,
      images: [String],  // Copie des images du template
      regularPrice: Number,
      liquidaPrice: Number,
      stripePaymentLinkId: String,     // Legacy (non utilisé avec Checkout)
      stripePaymentLinkUrl: String,    // Legacy
      quantity: Number,
      quantitySold: Number,
      status: 'active' | 'sold_out' | 'cancelled',
      smsSentCount: Number,
      createdAt: Date
    }
  ],

  // Sales (ventes)
  sales: [
    {
      _id: ObjectId,
      liquidationId: ObjectId,
      stripeCheckoutSessionId: String,
      stripePaymentIntentId: String,
      amount: Number,
      pickupCode: String,       // Format: LQ-XXXX
      customerPhone: String,
      customerEmail: String,
      status: 'pending' | 'completed' | 'refunded',
      createdAt: Date
    }
  ],

  createdAt: Date,
  updatedAt: Date
}
```

**Méthodes statiques :**
- `Merchant.getMerchant()` → Retourne LE merchant (single-tenant)
- `merchant.findOrCreateSubscriber(phone, name)`
- `merchant.findLiquidation(liquidationId)`
- `merchant.findSaleByPickupCode(pickupCode)`

---

## API Routes

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| **Config** | | | |
| GET | /api/config/stripe | non | Retourne publishableKey pour Stripe.js |
| **Merchant** | | | |
| GET | /api/merchant | non | Info merchant + stats |
| PUT | /api/merchant | non | Update merchant info |
| **Templates** | | | |
| POST | /api/templates | non | Créer un template (produit catalogue) |
| DELETE | /api/templates/:id | non | Supprimer un template |
| **Subscribers** | | | |
| POST | /api/subscribers/subscribe | non | Inscription via QR code |
| GET | /api/subscribers | non | Liste abonnés |
| **Liquidations** | | | |
| POST | /api/liquidations/create | non | Créer liquidation + envoi SMS |
| GET | /api/liquidations | non | Liste liquidations |
| GET | /api/liquidations/:id | non | **PUBLIC** - Page produit pour client |
| DELETE | /api/liquidations/:id | non | Annuler liquidation |
| **Checkout** | | | |
| POST | /api/create-checkout-session | non | Créer session Stripe Checkout |
| **Upload** | | | |
| POST | /api/upload | non | Upload image vers R2 (multipart/form-data) |
| **Sales** | | | |
| GET | /api/sales | non | Liste ventes |
| **Webhooks** | | | |
| POST | /api/webhooks/stripe | non | Webhook Stripe (raw body) |

---

## Flow utilisateur complet

### 1. Commerçant crée un template
1. Commerçant ouvre `/catalogue` → clique sur "+"
2. `TemplateForm.jsx` s'ouvre (modal)
3. Upload jusqu'à **5 photos** via `/api/upload` → stockage R2
4. Remplit titre, description, prix régulier, prix liquida
5. POST `/api/templates` → template ajouté au `merchant.templates`

### 2. Commerçant lance une liquidation
1. Clique sur un template dans `/catalogue`
2. `LiquidationModal` s'ouvre → choisir quantité
3. POST `/api/liquidations/create` :
   - Copie le template dans `merchant.liquidations`
   - (Anciennement créait Payment Link, maintenant utilise Checkout)
   - Envoi SMS broadcast à tous les subscribers avec lien : `https://app.com/liquidation/{id}`

### 3. Client reçoit SMS et achète
1. Reçoit SMS : "🔥 LIQUIDATION | ... → https://app.com/liquidation/abc123"
2. Clique sur le lien → ouvre `/liquidation/:id` (page publique)
3. **Page Liquidation (`Liquidation.jsx`)** :
   - Fetch `GET /api/liquidations/:id` (sans auth)
   - Affiche :
     - **Carousel d'images** (jusqu'à 5 photos, navigation par flèches + bullets)
     - Nom du produit
     - Prix réduit + prix original barré + badge réduction
     - Description
     - Adresse pickup
     - Horaires pickup
     - Stock restant
   - Bouton "Payer — $X"
4. Client clique sur "Payer" :
   - Frontend : `POST /api/create-checkout-session` avec `liquidationId`
   - Backend : crée `stripe.checkout.sessions.create()` avec :
     - Images du produit (1ère photo)
     - Prix
     - Metadata: `{ liquidationId, merchantId }`
     - `success_url: /success?session_id={CHECKOUT_SESSION_ID}`
     - `cancel_url: /liquidation/:id`
   - Frontend : `stripe.redirectToCheckout({ sessionId })`
5. Client paie dans la **modal Stripe** (reste dans l'app)
6. Après paiement : redirection vers `/success`
7. Webhook Stripe → `/api/webhooks/stripe` (event `checkout.session.completed`)
8. Création `Sale` + envoi SMS avec `pickupCode`

---

## Points critiques

### Stripe — Checkout intégré vs Payment Links

**Ancienne approche (désactivée) :** Payment Links
- Redirections vers `buy.stripe.com`
- Pas de contrôle sur l'UX

**Nouvelle approche (actuelle) :** Stripe Checkout Sessions
- Modal dans l'app (pas de redirection externe)
- Nécessite `STRIPE_PUBLISHABLE_KEY`
- Frontend : Stripe.js chargé dans `index.html`
- Flow :
  1. Frontend charge `window.Stripe(publishableKey)` depuis `/api/config/stripe`
  2. Bouton "Payer" → `POST /api/create-checkout-session`
  3. Backend retourne `sessionId`
  4. Frontend : `stripe.redirectToCheckout({ sessionId })`
  5. Stripe ouvre modal → paiement → `success_url` ou `cancel_url`

### Gestion du stock
Le stock est géré **manuellement** via webhook :
1. `quantitySold` incrémenté dans `checkout.session.completed`
2. Si `quantitySold >= quantity` → status `sold_out`
3. Si paiement arrive après stock épuisé → refund automatique

### Webhook Stripe — raw body
Le middleware `express.raw({ type: 'application/json' })` doit être appliqué **avant** `express.json()` et **uniquement** sur `/api/webhooks/stripe`. Sinon la signature Stripe ne se vérifie pas.

### Upload d'images — Cloudflare R2
- Endpoint : `POST /api/upload` (multipart/form-data)
- Service : `storage.service.js` utilise AWS SDK S3-compatible
- Configuration R2 dans `.env` :
  ```
  R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com/bucket
  R2_APPLICATION_KEY=xxx
  R2_SECRET_KEY=xxx
  R2_BUCKET_NAME=liquidchoc-prod
  ```
- Fichiers uploadés dans `liquidachoc/{timestamp}_{random}.{ext}`
- Max 5 photos par template (limite frontend `TemplateForm.jsx`)

### SMS broadcast — throttle Twilio
- Twilio : max ~10 SMS/sec
- Bull job envoie avec delay de 100ms entre chaque SMS
- SMS contient lien : `https://app.com/liquidation/{id}`

### Téléphone canadien
Tout est stocké en E.164 (`+15141234567`). Formatage : 10 chiffres → préfixer `+1`.

---

## SMS — templates de messages

**Liquidation broadcast :**
```
🔥 LIQUIDATION | {businessName}
{productDescription}
🏷️ {discountedPrice}$ au lieu de {regularPrice}$ (-{discountPercent}%)
📦 Stock: {quantity} disponibles
👉 {liquidationUrl}
⏱️ Valide aujourd'hui seulement
📍 Pickup: {address} - {pickupHours}
STOP pour ne plus recevoir ces alertes
```

**Confirmation d'achat :**
```
✅ Paiement confirmé !
Votre code pickup : {pickupCode}
📍 {businessName} - {address}
🕐 {pickupHours}
Valide 2h. Présentez ce code sur place.
```

**Bienvenue :**
```
Bienvenue aux alertes Liquida-Choc de {businessName} !
Vous recevrez des offres exclusives.
STOP pour vous désabonner.
```

---

## Frontend

**Pages principales :**
- `/` → Dashboard (stats)
- `/catalogue` → Gestion des templates (avec `TemplateForm` pour upload 5 photos)
- `/sales` → Liste des ventes
- `/subscribers` → Liste des abonnés
- `/settings` → Config merchant
- `/subscribe` → QR code inscription
- `/liquidation/:id` → **Page publique** (carousel photos + paiement Stripe)
- `/success` → Confirmation post-paiement

**Technologies :**
- **Zustand** pour state global (merchant)
- **Tailwind** avec CSS variables dynamiques (theme light/dark + primaryColor)
- **Stripe.js** chargé dans `index.html` (`<script src="https://js.stripe.com/v3/"></script>`)
- **Axios** client configuré avec `baseURL: http://localhost:3000/api`

**Carousel d'images (`Liquidation.jsx`) :**
- Affiche jusqu'à 5 photos
- Navigation : flèches gauche/droite + bullets
- Transition CSS `transform: translateX(-{index * 100}%)`
- Responsive mobile-first

---

## Déploiement

### Architecture multi-instance

```
┌─────────────────────────────────────────────────┐
│         1 Repo Git (github.com/you/repo)        │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Commerce A   │ │ Commerce B   │ │ Commerce C   │
│ Vercel       │ │ Vercel       │ │ Vercel       │
│ .env unique  │ │ .env unique  │ │ .env unique  │
└──────────────┘ └──────────────┘ └──────────────┘
        │             │             │
        ▼             ▼             ▼
┌──────────────────────────────────────────────────┐
│    MongoDB Atlas Cluster (N databases)           │
│    - commerce-a, commerce-b, commerce-c          │
└──────────────────────────────────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌──────────────────────────────────────────────────┐
│  Cloudflare R2 Bucket (1 bucket, N dossiers)     │
│  - liquidachoc/commerce-a/...                    │
│  - liquidachoc/commerce-b/...                    │
└──────────────────────────────────────────────────┘
```

### Vercel
- 1 instance par commerce
- Build : `npm run build` (Vite)
- Start : `npm start` (backend Express)
- Variables d'environnement configurées dans Vercel UI (copie du .env)

### MongoDB Atlas
- 1 cluster partagé
- N databases (1 par commerce)
- Network Access : whitelist `0.0.0.0/0` (ou IP Vercel)

### Cloudflare R2
- 1 bucket partagé
- Dossiers séparés par commerce (automatique via path `liquidachoc/{timestamp}_...`)
- Pas de problème de collision car chaque commerce upload avec son propre timestamp

### Twilio
- 1 compte Twilio (ou plusieurs)
- **1 numéro par commerce** (configuré dans `.env` de chaque instance)

### Webhooks Stripe
- Endpoint : `https://{commerce-a}.vercel.app/api/webhooks/stripe`
- Events à écouter :
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- Test local : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

---

## Dev local

**Prérequis :**
```bash
# Installer Redis
brew install redis
brew services start redis

# Ou avec Docker
docker run -d -p 6379:6379 redis:alpine
```

**Démarrer :**
```bash
npm run dev  # Lance backend (nodemon) + frontend (Vite) en parallèle
```

**MongoDB Atlas :**
- Whitelist `0.0.0.0/0` dans Network Access (dev only)
- Attendre 2-3 min pour propagation si ça ne marche pas

**Test webhook Stripe en local :**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copier le whsec_... dans .env → STRIPE_WEBHOOK_SECRET
```

---

## Notes importantes

- **Pas d'auth** actuellement (single-tenant = pas besoin de login par commerce)
- **1 merchant par DB** (architecture embedded documents)
- **Backend Caméléon** : tout est configuré par .env (SECTOR, BUSINESS_NAME, PRIMARY_COLOR, etc.)
- **Isolation totale** entre commerces via instances Vercel séparées
- **Images** : max 5 par template, stockage R2, affichage carousel dans page publique
- **Paiement** : Stripe Checkout intégré (modal) au lieu de Payment Link (redirection)
