# Guide Variables d'Environnement - LiquidaChoc

## 📋 Vue d'ensemble

Chaque variable contrôle un aspect de l'infrastructure. **1 instance = 1 commerce = 1 fichier .env personnalisé**.

---

## 🖥️ Serveur

### `PORT=3000`
**Rôle :** Port sur lequel le serveur Express écoute

**Valeurs typiques :**
- Développement : `3000` ou `5000`
- Production : `3000` (Vercel/Railway gèrent automatiquement)

**Exemple :**
```bash
PORT=3000  # Le serveur démarre sur http://localhost:3000
```

---

### `NODE_ENV=production`
**Rôle :** Mode d'exécution de l'application

**Valeurs possibles :**
- `development` : Logs verbeux, hot reload, erreurs détaillées
- `production` : Optimisations, logs minimaux, sécurité renforcée

**Impact :**
- En production : frontend servi depuis `/dist` (build)
- En dev : frontend sur port séparé (Vite)

```bash
NODE_ENV=production  # Mode production
NODE_ENV=development # Mode développement
```

---

### `FRONTEND_URL=https://votre-domaine.vercel.app`
**Rôle :** URL du frontend (pour CORS et liens SMS)

**Utilisation :**
1. **CORS** : Autorise les requêtes depuis cette origine
2. **SMS** : Génère les liens dans les messages
   - Ex: "👉 Achetez: https://votre-domaine.vercel.app/liquidation/123"

**Exemples :**
```bash
# Développement
FRONTEND_URL=http://localhost:5173

# Production
FRONTEND_URL=https://patisserie-marcel.vercel.app
```

---

## 💾 MongoDB (Base de données)

### `MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/liquidachoc_commerce1`
**Rôle :** Connexion à la base de données MongoDB

**Format :**
```
mongodb+srv://[username]:[password]@[host]/[database]
```

**CRITICAL :** Chaque commerce doit avoir sa **propre base de données** pour l'isolation totale.

**Exemples :**
```bash
# Commerce 1 : Pâtisserie Marcel
MONGODB_URI=mongodb+srv://admin:pass@cluster.net/liquidachoc_patisserie_marcel

# Commerce 2 : Arcade GameZone
MONGODB_URI=mongodb+srv://admin:pass@cluster.net/liquidachoc_arcade_gamezone

# Commerce 3 : Salon Élégance
MONGODB_URI=mongodb+srv://admin:pass@cluster.net/liquidachoc_salon_elegance
```

**Pourquoi ?**
- ✅ Isolation totale des données
- ✅ Pas de risque de leak entre commerces
- ✅ Backup indépendant
- ✅ Facile à supprimer un commerce

**Setup MongoDB Atlas :**
1. Créer cluster gratuit (512MB)
2. Créer une base par commerce
3. Configurer Network Access (0.0.0.0/0 pour tester)
4. Créer utilisateur avec mot de passe

**⚠️ Important :** MongoDB Transactions nécessitent un **Replica Set** (actif par défaut sur Atlas)

---

## 🔴 Redis (Queue SMS)

### `REDIS_URL=redis://localhost:6379`
**Rôle :** Connexion à Redis pour la queue Bull (SMS broadcast)

**Format :**
```
redis://[user]:[password]@[host]:[port]
```

**Utilisation :**
- Queue Bull pour SMS broadcast (5000+ abonnés)
- Retry automatique
- Progress tracking
- Job scheduling

**Exemples :**
```bash
# Développement local
REDIS_URL=redis://localhost:6379

# Production (Upstash gratuit)
REDIS_URL=redis://default:xxxxx@us1-xxxx.upstash.io:6379

# Production (Railway)
REDIS_URL=redis://default:pass@redis.railway.internal:6379
```

**Providers gratuits/payants :**
| Provider | Free Tier | Prix | Notes |
|----------|-----------|------|-------|
| **Upstash** | 10k requêtes/jour | $0.20/100k | ✅ Recommandé (serverless) |
| **Railway** | $5 crédit/mois | $5/mois | ✅ Bon pour tests |
| **Redis Cloud** | 30MB | $0 | ⚠️ Limite de taille |
| **Local** | Illimité | $0 | ❌ Dev seulement |

**Installation locale (dev) :**
```bash
# macOS
brew install redis
redis-server

# Linux
sudo apt-get install redis-server
redis-server

# Docker
docker run -d -p 6379:6379 redis
```

**⚠️ Important :** Redis est **requis** pour le système de queue SMS. Sans Redis, les SMS ne seront pas envoyés.

---

## 💳 Stripe (Paiements)

### `STRIPE_SECRET_KEY=sk_live_xxx`
**Rôle :** Clé secrète Stripe pour créer Payment Links et gérer les paiements

**Format :**
```
sk_test_xxxxx (mode test)
sk_live_xxxxx (mode production)
```

**CRITICAL :** **Chaque commerce doit avoir son propre compte Stripe** (clés différentes).

**Pourquoi ?**
- ✅ Paiements vont directement au commerce
- ✅ Pas de risque de mélange de fonds
- ✅ Chaque commerce gère ses propres taxes/comptabilité
- ✅ Isolation totale (sécurité)

**Setup Stripe par commerce :**
1. Le commerçant crée un compte Stripe
2. Récupérer `sk_live_xxx` dans Dashboard → Developers → API Keys
3. Configurer dans le `.env` de son instance

**Exemples :**
```bash
# Commerce 1
STRIPE_SECRET_KEY=sk_live_51ABC123...patisseriemarcel

# Commerce 2
STRIPE_SECRET_KEY=sk_live_51XYZ789...arcadegamezone

# Commerce 3
STRIPE_SECRET_KEY=sk_live_51DEF456...salonelegance
```

---

### `STRIPE_WEBHOOK_SECRET=whsec_xxx`
**Rôle :** Vérifier l'authenticité des webhooks Stripe (sécurité)

**Utilisation :**
- Stripe envoie des webhooks pour `checkout.session.completed`
- Le webhook secret permet de vérifier que la requête vient bien de Stripe
- Empêche les attaques par injection de faux paiements

**Setup :**
1. Stripe Dashboard → Developers → Webhooks
2. Ajouter endpoint : `https://votre-domaine.com/webhook`
3. Événements à écouter : `checkout.session.completed`
4. Copier le `whsec_xxx` dans `.env`

**Test local :**
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Stripe CLI
stripe listen --forward-to localhost:3000/webhook
# Copier le whsec_xxx dans .env
```

**⚠️ CRITICAL :** Sans webhook secret, n'importe qui peut envoyer de faux paiements à votre API !

---

## 📱 Twilio (SMS)

### `TWILIO_ACCOUNT_SID=ACxxx`
**Rôle :** Identifiant du compte Twilio

**Format :** `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (34 caractères)

**Où le trouver :** Twilio Console → Dashboard

---

### `TWILIO_AUTH_TOKEN=xxx`
**Rôle :** Token d'authentification Twilio

**Format :** Chaîne alphanumérique (32 caractères)

**⚠️ CRITICAL :** Garder secret ! Ne jamais commit dans Git.

**Où le trouver :** Twilio Console → Dashboard (masqué par défaut, cliquer "Show")

---

### `TWILIO_PHONE_NUMBER=+14189991234`
**Rôle :** Numéro de téléphone Twilio émetteur des SMS

**Format :** E.164 (`+1` pour Canada/USA, puis 10 chiffres)

**Exemples :**
```bash
TWILIO_PHONE_NUMBER=+15141234567  # Montréal
TWILIO_PHONE_NUMBER=+14189991234  # Québec
```

**Options Twilio :**
1. **1 numéro centralisé** pour tous les commerces → $1/mois
2. **1 numéro par commerce** → $1/mois × nombre de commerces

**Recommandation :** Commencer avec 1 numéro centralisé, acheter des numéros dédiés si les commerces le demandent.

**Setup :**
1. Twilio Console → Phone Numbers → Buy a number
2. Choisir pays (Canada/USA)
3. Capabilities : SMS enabled
4. Copier le numéro dans `.env`

**Coûts :**
- Numéro : $1/mois
- SMS sortants : $0.0075/SMS (Canada/USA)
- Ex : 1000 SMS = $7.50

---

## 📸 Object Storage (Images produits)

### Cloudflare R2 Storage

```bash
R2_SECRET_KEY=
R2_APPLICATION_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=
```

**Rôle :** Upload photos produits vers ton bucket R2

**Tu gères :** Ton propre bucket R2. Le backend upload avec aws-sdk.

---

## 🎨 Backend Caméléon (Sector-Aware)

### `SECTOR=food`
**Rôle :** Détermine le type de commerce et adapte automatiquement les templates, durées, et SMS

**Valeurs possibles :**
- `food` : Restaurants, Pâtisseries, Épiceries
- `games` : Salles de jeux, Arcades, Escape Games
- `services` : Salons, Spas, Coiffeurs

**Impact :**
```javascript
// FOOD
templates: 25$→15$ (Boîtes surprise)
liquidationDuration: 4h
pickupDuration: 2h
sms: "🔥 LIQUIDATION | Boîtes surprise..."

// GAMES
templates: 30$→18$ (Session 1h)
liquidationDuration: 6h
pickupDuration: 24h
sms: "🎮 PLACES DISPO | Session de jeu..."

// SERVICES
templates: 40$→24$ (Prestation express)
liquidationDuration: 12h
pickupDuration: 48h
sms: "✨ CRÉNEAUX DISPO | Prestation..."
```

---

### `BUSINESS_NAME=La Pâtisserie du Coin`
**Rôle :** Nom du commerce (affiché dans l'app et les SMS)

**Exemples :**
```bash
BUSINESS_NAME=La Pâtisserie du Coin
BUSINESS_NAME=Arcade GameZone
BUSINESS_NAME=Salon Élégance
```

---

### `PRIMARY_COLOR=#FF6B35`
**Rôle :** Couleur principale de l'interface (branding)

**Format :** Code hexadécimal (`#RRGGBB`)

**Exemples :**
```bash
PRIMARY_COLOR=#FF6B35  # Orange (Food)
PRIMARY_COLOR=#7B2CBF  # Violet (Games)
PRIMARY_COLOR=#06D6A0  # Vert (Services)
```

---

### `MERCHANT_ADDRESS=123 Rue Principale, Montréal, QC H2X 1Y5`
**Rôle :** Adresse du commerce (affichée dans les SMS de pickup)

**Format :** Texte libre

**Exemple SMS :**
```
✅ Commande confirmée !
📦 Code: LQ-ABC123
📍 123 Rue Principale, Montréal ← Cette adresse
⏰ À récupérer avant 20h00
```

---

### `MERCHANT_PHONE=+15141234567`
**Rôle :** Téléphone du commerce (affiché dans l'app pour contact)

---

### `PICKUP_HOURS=18h-20h tous les jours`
**Rôle :** Horaires de récupération (affichés dans les SMS)

---

## 🔒 Setup Secret

### `SETUP_SECRET=changeme_avec_une_valeur_aléatoire`
**Rôle :** Protection de l'endpoint `/api/setup` (onboarding initial)

**Utilisation :**
```bash
# Une seule fois par instance
curl -X POST https://api.example.com/api/setup \
  -H "Authorization: Bearer MON_SETUP_SECRET" \
  -d '{"businessName":"Commerce Test"}'
```

**⚠️ Important :** Générer un secret fort (pas "changeme" !)

**Génération :**
```bash
# Linux/macOS
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📊 Résumé : Quoi partager entre commerces ?

| Ressource | Isolation | Notes |
|-----------|-----------|-------|
| **MongoDB** | ✅ Base par commerce | CRITICAL |
| **Stripe** | ✅ Compte par commerce | CRITICAL |
| **Redis** | ⚠️ Partageable | 1 Redis peut gérer N commerces |
| **Twilio** | ⚠️ Partageable | 1 numéro pour tous ou 1 par commerce |
| **Object Storage** | ⚠️ Partageable | Ton bucket B2/R2 |

**Recommandation :**
- **Isoler :** MongoDB + Stripe (sécurité/comptabilité)
- **Partager :** Redis + Twilio + Cloudinary (coûts)

---

## 🚀 Exemple Complet

### Commerce : Pâtisserie Marcel

```bash
# ═══════════════════════════════════════════════════════════
# INSTANCE: Pâtisserie Marcel (Food)
# ═══════════════════════════════════════════════════════════

# Serveur
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://patisserie-marcel.vercel.app

# MongoDB (isolé)
MONGODB_URI=mongodb+srv://admin:pass@cluster.net/liquidachoc_patisserie_marcel

# Redis (partagé)
REDIS_URL=redis://default:pass@upstash.io:6379

# Stripe (isolé - compte du commerce)
STRIPE_SECRET_KEY=sk_live_51ABC123...marcel
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Twilio (partagé)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+15141234567

# Cloudinary (partagé, dossier dédié)
CLOUDINARY_URL=cloudinary://123:secret@mycloud

# Setup
SETUP_SECRET=a1b2c3d4e5f6...

# Sector-Aware
SECTOR=food
BUSINESS_NAME=Pâtisserie Marcel
PRIMARY_COLOR=#FF6B35
MERCHANT_ADDRESS=456 Rue Gourmet, Montréal, QC
MERCHANT_PHONE=+15149876543
PICKUP_HOURS=18h-20h tous les jours
```

---

**Tu as maintenant le contrôle total de chaque variable !** 🎯
