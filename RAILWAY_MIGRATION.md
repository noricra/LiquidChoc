# Migration Vercel → Railway

## Pourquoi Railway ?

**Avantages Railway** :
- ✅ Bull workers supportés (SMS queue scalable)
- ✅ Redis natif (pas de mock)
- ✅ Pas de timeout (liquidations >100 abonnés OK)
- ✅ Filesystem read-write (cache images possible)
- ✅ Logs persistants
- ✅ Scaling vertical facile

**Désavantages** :
- 💰 Plus cher que Vercel Free ($5-20/mois)
- 🔧 Config un peu plus complexe

---

## Fichiers à supprimer

```bash
# Supprimer les fichiers Vercel
rm vercel.json
rm -rf api/

# Ou les garder pour déploiement hybride (voir ci-dessous)
```

---

## Fichiers à modifier

### 1. `backend/src/config/redis.js`

**AVANT (Vercel)** :
```js
const isServerless = process.env.VERCEL === '1' || process.env.IS_SERVERLESS === 'true'

if (isServerless) {
  redis = { status: 'ready', quit: async () => {} } // Mock
} else {
  redis = new Redis(config.redisUrl)
}
```

**APRÈS (Railway)** :
```js
const redis = config.redisUrl
  ? new Redis(config.redisUrl)
  : new Redis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    })

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message)
})

redis.on('connect', () => {
  console.log('Redis connected')
})

module.exports = redis
```

---

### 2. `backend/src/server.js`

**AVANT (Vercel)** :
```js
const isServerless = process.env.VERCEL === '1' || process.env.IS_SERVERLESS === 'true'

if (!isServerless) {
  startWorkers()
}
```

**APRÈS (Railway)** :
```js
// Toujours démarrer les workers
startWorkers()
console.log('Bull workers started (SMS queue)')
```

---

### 3. `backend/src/services/sms.service.js`

**AVANT (Vercel)** :
```js
async function smsBroadcast(merchant, liquidation) {
  const isServerless = process.env.VERCEL === '1' || process.env.IS_SERVERLESS === 'true'

  if (isServerless) {
    return smsBroadcastDirect(merchant, liquidation)
  }

  // Via Bull queue...
}
```

**APRÈS (Railway)** :
```js
async function smsBroadcast(merchant, liquidation) {
  if (!merchant.subscribers || merchant.subscribers.length === 0) {
    return 0
  }

  const liquidationUrl = `${config.frontendUrl}/liquidation/${liquidation.shortId || liquidation._id}`

  const message = generateSMS('liquidation', {
    productDescription: liquidation.title,
    originalPrice: liquidation.regularPrice.toFixed(2),
    discountedPrice: liquidation.liquidaPrice.toFixed(2),
    discountPercent: Math.round(((liquidation.regularPrice - liquidation.liquidaPrice) / liquidation.regularPrice) * 100),
    quantity: liquidation.quantity - liquidation.quantitySold,
    liquidationUrl: liquidationUrl
  })

  const { enqueueSMSBroadcast } = require('./queue.service')

  const job = await enqueueSMSBroadcast({
    merchantId: merchant._id.toString(),
    liquidationId: liquidation._id.toString(),
    subscribers: merchant.subscribers.map(s => ({ phone: s.phone, name: s.name })),
    message
  })

  return merchant.subscribers.length
}
```

---

### 4. `backend/src/routes/images.routes.js` (optionnel)

**Option A** : Garder le stream direct R2 (comme Vercel)
**Option B** : Réactiver le cache filesystem pour meilleures performances

```js
// Option B: Avec cache filesystem (meilleur sur Railway)
const { getImageWithFallback } = require('../services/imageCache.service')

router.get('/:productId/:filename', async (req, res) => {
  try {
    const { productId, filename } = req.params

    // Validate
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' })
    }

    // Get from cache or download from R2
    const imagePath = await getImageWithFallback(productId, filename)

    if (!imagePath) {
      return res.status(404).json({ error: 'Image not found' })
    }

    // Determine content type
    const ext = filename.split('.').pop().toLowerCase()
    const contentTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp'
    }
    const contentType = contentTypes[ext] || 'image/jpeg'

    // Serve cached file
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.sendFile(imagePath)

  } catch (error) {
    console.error('Error serving image:', error)
    res.status(500).json({ error: 'Failed to serve image' })
  }
})
```

---

## Déploiement Railway

### 1. Créer projet Railway

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Login
railway login

# Créer projet
railway init
```

### 2. Ajouter services

Dans Railway Dashboard :
1. **PostgreSQL** ou **MongoDB** → Choisir MongoDB
2. **Redis** → Ajouter Redis
3. **Variables d'env** → Copier depuis `.env`

### 3. Variables d'environnement

```bash
# MongoDB (Railway fournit MONGODB_URI automatiquement si service ajouté)
MONGODB_URI=${{MongoDB.MONGODB_URI}}

# Redis (Railway fournit REDIS_URL automatiquement)
REDIS_URL=${{Redis.REDIS_URL}}

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1514...

# Cloudflare R2
R2_SECRET_KEY=...
R2_APPLICATION_KEY=...
R2_BUCKET_NAME=liquidchoc-prod
R2_ENDPOINT=https://...

# Setup
SETUP_SECRET=...

# Branding
SECTOR=food
BUSINESS_NAME=Mon Commerce
PRIMARY_COLOR=#006644
SECONDARY_COLOR=#F7F7F7
ACCENT_COLOR=#006644
MERCHANT_ADDRESS=123 Rue Test
MERCHANT_PHONE=+15141234567
PICKUP_HOURS=18h-20h

# Frontend (URL Railway)
FRONTEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NODE_ENV=production
PORT=3000
```

### 4. Déployer

```bash
# Push vers Railway
railway up

# Ou connecter à GitHub
# Railway détecte automatiquement et déploie à chaque push
```

---

## Déploiement hybride (Vercel + Railway)

Si vous voulez garder **Vercel pour le frontend** et **Railway pour le backend** :

### Architecture
```
Frontend (Vercel)
    ↓
Backend API (Railway) ← Redis, Bull workers
    ↓
MongoDB Atlas
Cloudflare R2
Twilio
```

### Configuration

**Vercel** (frontend seulement) :
- Supprimer `/api/` et `vercel.json`
- Build : `npm run build`
- Output : `dist/`

**Railway** (backend seulement) :
- Root directory : `/`
- Start command : `npm start`
- Expose port : 3000

**Frontend → Backend** :
```js
// src/api/client.js
const baseURL = import.meta.env.PROD
  ? 'https://votre-backend.railway.app/api'  // Railway
  : 'http://localhost:3000/api'

export const apiClient = axios.create({ baseURL })
```

---

## Coûts

### Vercel (Frontend seulement)
- **Free tier** : 100GB bandwidth, illimité

### Railway (Backend + Redis)
- **Hobby** : $5/mois (512MB RAM, 1GB storage)
- **Pro** : $20/mois (8GB RAM, 100GB storage)
- **Usage-based** : ~$10-15/mois selon trafic

### Total hybride
- Frontend Vercel Free + Backend Railway = **$5-20/mois**
- Avantage : Pas de limite SMS broadcast, workers Bull

---

## Résumé

| Fichier | Vercel | Railway | Hybride (V+R) |
|---------|--------|---------|---------------|
| `vercel.json` | ✅ Requis | ❌ Supprimer | ❌ Supprimer |
| `/api/index.js` | ✅ Requis | ❌ Supprimer | ❌ Supprimer |
| `redis.js` | Mock | Vrai Redis | Vrai Redis |
| `server.js` | Skip workers | Démarrer workers | Démarrer workers |
| `sms.service.js` | Direct | Queue Bull | Queue Bull |
| `images.routes.js` | Stream R2 | Cache ou Stream | Stream R2 |

**Recommandation** : Si >100 abonnés SMS → **Railway** ou **Hybride**
