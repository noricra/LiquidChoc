# Architecture Multi-Tenant - 10 Commerces & Scale

## Table des matières
1. [Images orphelines (problème upload/annulation)](#1-images-orphelines)
2. [Architecture multi-tenant (10 commerces)](#2-architecture-multi-tenant)
3. [Gestion 300+ abonnés par commerce](#3-optimisation-300-abonnés)
4. [Système de crédits SMS Twilio](#4-système-de-crédits-sms)
5. [Ce qui est partagé vs séparé](#5-partagé-vs-séparé)

---

## 1. Images Orphelines

### Problème
Quand un utilisateur :
1. Upload une image pour un produit
2. Annule avant de créer le produit
3. **L'image reste sur R2** sans possibilité de suppression

### Solution A : Cleanup automatique (24h)

**Ajouter un job de nettoyage quotidien**

```javascript
// backend/src/jobs/cleanupOrphanedImages.job.js
const AWS = require('aws-sdk')
const { r2Config } = require('../config/storage')
const Merchant = require('../models/Merchant')

/**
 * Nettoie les images R2 orphelines (uploadées mais pas dans la DB)
 * Exécuté une fois par jour
 */
async function cleanupOrphanedImages() {
  const s3 = new AWS.S3({
    endpoint: r2Config.endpoint,
    accessKeyId: r2Config.applicationKey,
    secretAccessKey: r2Config.secretKey,
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
  })

  const config = require('../config/env')
  const businessName = config.branding.businessName
  const cleanBusinessName = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')

  // Liste toutes les images R2
  const listParams = {
    Bucket: r2Config.bucketName,
    Prefix: `${cleanBusinessName}/products/`
  }

  const r2Objects = await s3.listObjectsV2(listParams).promise()

  // Récupère toutes les images de la DB
  const merchant = await Merchant.getMerchant()
  const dbImages = new Set()

  // Images des templates
  merchant.templates.forEach(t => {
    t.images.forEach(img => {
      const key = `${cleanBusinessName}/products/${img}`
      dbImages.add(key)
    })
  })

  // Images des liquidations
  merchant.liquidations.forEach(l => {
    l.images.forEach(img => {
      const key = `${cleanBusinessName}/products/${img}`
      dbImages.add(key)
    })
  })

  // Supprimer les orphelines (>24h)
  const now = Date.now()
  const oneDayAgo = now - (24 * 60 * 60 * 1000)

  let deleted = 0
  for (const obj of r2Objects.Contents || []) {
    const isOrphaned = !dbImages.has(obj.Key)
    const isOld = new Date(obj.LastModified).getTime() < oneDayAgo

    if (isOrphaned && isOld) {
      await s3.deleteObject({
        Bucket: r2Config.bucketName,
        Key: obj.Key
      }).promise()

      console.log(`Deleted orphaned image: ${obj.Key}`)
      deleted++
    }
  }

  console.log(`Cleanup complete: ${deleted} orphaned images deleted`)
  return { deleted, total: r2Objects.Contents?.length || 0 }
}

module.exports = { cleanupOrphanedImages }
```

**Planifier le job (cron)**

```javascript
// backend/src/workers/index.js
const cron = require('node-cron')
const { cleanupOrphanedImages } = require('../jobs/cleanupOrphanedImages.job')

function startWorkers() {
  // SMS broadcast workers (existant)
  smsBroadcastQueue.process('broadcast', 1, async (job) => {
    return await processSMSBroadcast(job)
  })

  // Cleanup images orphelines (nouveau) - chaque jour à 3h du matin
  cron.schedule('0 3 * * *', async () => {
    console.log('Running orphaned images cleanup...')
    try {
      const result = await cleanupOrphanedImages()
      console.log(`Cleanup result:`, result)
    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  })

  console.log('Workers started (SMS queue + Image cleanup)')
}
```

**Installer node-cron** :
```bash
npm install node-cron
```

### Solution B : Upload avec "productId temporaire"

**Modification du workflow frontend**

```javascript
// src/components/TemplateForm.jsx
const [tempProductId] = useState(() => uuidv4()) // Généré au mount

const handleImageUpload = async (file) => {
  // Upload avec productId temporaire
  const formData = new FormData()
  formData.append('file', file)
  formData.append('productId', tempProductId)
  formData.append('temporary', 'true') // Marquer comme temporaire

  const { data } = await axios.post('/api/upload', formData)
  setImages([...images, data.url])
}

const handleSubmit = async () => {
  // Créer le template
  const template = await axios.post('/api/templates', {
    title,
    description,
    regularPrice,
    liquidaPrice,
    images,
    tempProductId // Inclure pour marquer comme "confirmé"
  })
}

const handleCancel = async () => {
  // Notifier le backend pour nettoyer
  if (images.length > 0) {
    await axios.delete(`/api/upload/temp/${tempProductId}`)
  }
  onClose()
}
```

**Backend : endpoint de nettoyage immédiat**

```javascript
// backend/src/routes/upload.routes.js
router.delete('/upload/temp/:productId', async (req, res) => {
  const { productId } = req.params

  const config = require('../config/env')
  const businessName = config.branding.businessName
  const cleanBusinessName = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')

  const s3 = new AWS.S3({ /* ... */ })

  // Lister et supprimer toutes les images du productId
  const listParams = {
    Bucket: r2Config.bucketName,
    Prefix: `${cleanBusinessName}/products/${productId}/`
  }

  const objects = await s3.listObjectsV2(listParams).promise()

  for (const obj of objects.Contents || []) {
    await s3.deleteObject({
      Bucket: r2Config.bucketName,
      Key: obj.Key
    }).promise()
  }

  res.json({ deleted: objects.Contents?.length || 0 })
})
```

**Recommandation** : **Utiliser les deux** (Solution A + B)
- Solution B : Nettoyage immédiat quand l'utilisateur annule
- Solution A : Filet de sécurité pour les cas où l'utilisateur ferme le navigateur

---

## 2. Architecture Multi-Tenant

### Pour 10 commerces, 2 stratégies possibles :

### Stratégie 1 : Multi-tenant single-instance (1 Railway)

```
1 Railway Projet
├── 1 Redis (partagé)
├── 1 MongoDB Atlas Cluster
│   ├── DB: commerce-a
│   ├── DB: commerce-b
│   └── DB: commerce-j (10 DBs)
└── Code déployé avec variable MERCHANT_ID
```

**Avantages** :
- ✅ Moins cher ($5-10/mois total)
- ✅ 1 seul deployment
- ✅ Redis partagé (économie)

**Désavantages** :
- ❌ Tous les commerces tombent si crash
- ❌ Un commerce lent ralentit les autres
- ❌ Scaling difficile

### Stratégie 2 : Multi-tenant multi-instance (10 Railway) ⭐ **RECOMMANDÉ**

```
Commerce A → Railway Projet A
           → MongoDB: commerce-a
           → Twilio: +15141111111
           → Stripe: account-a

Commerce B → Railway Projet B
           → MongoDB: commerce-b
           → Twilio: +15142222222
           → Stripe: account-b

...10 instances
```

**Avantages** :
- ✅ **Isolation complète** : Un crash n'affecte pas les autres
- ✅ **Scaling indépendant** : Commerce avec 300 abonnés peut avoir plus de RAM
- ✅ **Facturation séparée** : Chaque commerce paie son usage
- ✅ **Meilleure sécurité** : Pas de risque de data leak entre commerces

**Désavantages** :
- ❌ Plus cher ($5-10/mois × 10 = $50-100/mois)
- ❌ 10 deployments à gérer

**Coûts détaillés** :

| Élément | Stratégie 1 (1 instance) | Stratégie 2 (10 instances) |
|---------|--------------------------|----------------------------|
| Railway | $10/mois | $5/mois × 10 = $50/mois |
| MongoDB Atlas | $9/mois (M2) | $9/mois (M2, 10 DBs) |
| Twilio | Variable | Variable × 10 |
| Cloudflare R2 | $0 (10GB free) | $0 (10GB free) |
| **TOTAL** | **~$20/mois** | **~$60/mois** |

**Recommandation** : **Stratégie 2** pour :
- Production (meilleure fiabilité)
- Commerces qui paient leur abonnement (passer le coût au commerce)

**Prix de revente suggéré** :
- $15-30/mois par commerce (couvre les $5-10 Railway + marge)

---

## 3. Optimisation 300+ Abonnés

### Problèmes potentiels

#### A. Timeout SMS (RÉSOLU avec Railway)
- ✅ Bull queue : Pas de timeout
- ✅ Workers asynchrones : Traitement en background
- ✅ Throttling : 120ms entre chaque SMS (respecte Twilio rate limit)

#### B. Performance MongoDB avec 300 subscribers

**Index à ajouter** :

```javascript
// backend/src/models/Merchant.js
merchantSchema.index({ 'subscribers.phone': 1 }) // Recherche rapide par téléphone
merchantSchema.index({ 'liquidations.status': 1 }) // Filtrer liquidations actives
merchantSchema.index({ 'sales.pickupCode': 1 }) // Recherche rapide pickup code
merchantSchema.index({ 'sales.status': 1, 'sales.createdAt': -1 }) // Liste ventes
```

#### C. Broadcast pour 300 abonnés

**Temps estimé** :
- 300 SMS × 120ms = **36 secondes** (acceptable)
- Avec rate limit Twilio : ~8 SMS/sec
- **Total : 37-40 secondes** pour 300 abonnés

**Optimisation possible (si >500 abonnés)** :

```javascript
// backend/src/jobs/smsBroadcast.job.js
async function processSMSBroadcast(job) {
  const { subscribers, message } = job.data

  // Traiter par batch de 10 (parallèle)
  const batchSize = 10
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (sub) => {
        try {
          await sendSMS(sub.phone, message)
          job.progress((i + 1) / subscribers.length * 100)
        } catch (error) {
          logger.warn({ err: error }, 'SMS failed in batch')
        }
      })
    )

    // Throttle entre batches (1 seconde)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}
```

Avec cette optimisation :
- 300 SMS / 10 batch × 1s = **30 secondes** au lieu de 40s

#### D. Stock race condition (DÉJÀ PROTÉGÉ)

✅ Déjà implémenté dans FIXES_COMPLETED.md :
- Webhook utilise transactions MongoDB
- Quantité gérée de façon atomique
- Refund automatique si stock épuisé

---

## 4. Système de Crédits SMS

### Problème
Twilio facture les SMS. Comment les commerces rechargent ?

### Solution A : Prépayé avec crédits

**Schéma de données** :

```javascript
// Ajouter au merchantSchema
const merchantSchema = new mongoose.Schema({
  // ... existing fields

  billing: {
    smsCredits: { type: Number, default: 0 }, // Nombre de SMS restants
    smsUsed: { type: Number, default: 0 }, // Total utilisés
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro'],
      default: 'free'
    },
    // Plans:
    // free: 50 SMS/mois
    // starter: 500 SMS/mois ($15/mois)
    // pro: illimité ($30/mois)
  },

  alerts: {
    lowCredits: { type: Boolean, default: false }, // <10 SMS restants
    outOfCredits: { type: Boolean, default: false } // 0 SMS
  }
})
```

**Vérification avant envoi** :

```javascript
// backend/src/services/sms.service.js
async function smsBroadcast(merchant, liquidation) {
  // Vérifier les crédits AVANT d'envoyer
  const subscribersCount = merchant.subscribers.length

  if (merchant.billing.smsCredits < subscribersCount) {
    throw new Error(`Crédits insuffisants. Requis: ${subscribersCount}, Disponibles: ${merchant.billing.smsCredits}`)
  }

  // Enqueue le broadcast
  const job = await enqueueSMSBroadcast({
    merchantId: merchant._id.toString(),
    liquidationId: liquidation._id.toString(),
    subscribers: merchant.subscribers.map(s => ({ phone: s.phone, name: s.name })),
    message
  })

  return subscribersCount
}
```

**Décrémenter après envoi** :

```javascript
// backend/src/jobs/smsBroadcast.job.js
async function processSMSBroadcast(job) {
  const { merchantId, subscribers, message } = job.data

  let sent = 0
  for (const sub of subscribers) {
    try {
      await sendSMS(sub.phone, message)
      sent++

      // Décrémenter 1 crédit par SMS envoyé
      await Merchant.findByIdAndUpdate(merchantId, {
        $inc: {
          'billing.smsCredits': -1,
          'billing.smsUsed': 1
        }
      })
    } catch (error) {
      logger.warn({ err: error }, 'SMS failed')
    }

    await new Promise(resolve => setTimeout(resolve, 120))
  }

  // Alerter si crédits faibles
  const merchant = await Merchant.findById(merchantId)
  if (merchant.billing.smsCredits < 10 && !merchant.alerts.lowCredits) {
    await Merchant.findByIdAndUpdate(merchantId, {
      'alerts.lowCredits': true
    })

    // Envoyer email au commerce
    await sendLowCreditsAlert(merchant)
  }

  return { sent, total: subscribers.length }
}
```

**Page de recharge (frontend)** :

```javascript
// src/pages/Billing.jsx
export default function Billing() {
  const [credits, setCredits] = useState(0)

  useEffect(() => {
    axios.get('/api/merchant').then(res => {
      setCredits(res.data.merchant.billing.smsCredits)
    })
  }, [])

  const handleRecharge = async (amount) => {
    // Stripe Checkout pour acheter des crédits
    const { data } = await axios.post('/api/billing/create-checkout', {
      credits: amount // 100 crédits = $10
    })

    window.location.href = data.url
  }

  return (
    <div>
      <h1>Crédits SMS</h1>
      <p>Crédits restants : {credits}</p>

      <button onClick={() => handleRecharge(100)}>
        Acheter 100 SMS - $10
      </button>
      <button onClick={() => handleRecharge(500)}>
        Acheter 500 SMS - $40 (économie $10!)
      </button>
      <button onClick={() => handleRecharge(1000)}>
        Acheter 1000 SMS - $70 (économie $30!)
      </button>
    </div>
  )
}
```

**Backend Stripe pour crédits** :

```javascript
// backend/src/controllers/billing.controller.js
async function createCreditCheckout(req, res) {
  const { credits } = req.body

  const pricing = {
    100: 1000,   // 100 SMS = $10.00
    500: 4000,   // 500 SMS = $40.00
    1000: 7000   // 1000 SMS = $70.00
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'cad',
        product_data: {
          name: `${credits} crédits SMS`,
        },
        unit_amount: pricing[credits],
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${config.frontendUrl}/billing/success`,
    cancel_url: `${config.frontendUrl}/billing`,
    metadata: {
      merchantId: req.merchant._id.toString(),
      credits: credits.toString(),
      type: 'sms_credits'
    }
  })

  res.json({ url: session.url })
}
```

**Webhook Stripe pour créditer** :

```javascript
// backend/src/controllers/webhook.controller.js
if (event.type === 'checkout.session.completed') {
  const session = event.data.object

  if (session.metadata.type === 'sms_credits') {
    const merchantId = session.metadata.merchantId
    const credits = parseInt(session.metadata.credits)

    await Merchant.findByIdAndUpdate(merchantId, {
      $inc: { 'billing.smsCredits': credits },
      'alerts.lowCredits': false,
      'alerts.outOfCredits': false
    })

    console.log(`Added ${credits} SMS credits to merchant ${merchantId}`)
  }
}
```

### Solution B : Pay-as-you-go (facturation mensuelle)

Au lieu de prépayé, facturer chaque mois basé sur l'usage :

```javascript
// À la fin du mois (cron job)
cron.schedule('0 0 1 * *', async () => {
  const merchants = await Merchant.find()

  for (const merchant of merchants) {
    const smsUsed = merchant.billing.smsUsed
    const cost = smsUsed * 0.10 // $0.10 par SMS

    // Créer invoice Stripe
    const invoice = await stripe.invoices.create({
      customer: merchant.stripeCustomerId,
      auto_advance: true,
    })

    await stripe.invoiceItems.create({
      customer: merchant.stripeCustomerId,
      invoice: invoice.id,
      amount: Math.round(cost * 100),
      currency: 'cad',
      description: `${smsUsed} SMS envoyés en ${new Date().toLocaleString('fr-CA', { month: 'long', year: 'numeric' })}`
    })

    // Réinitialiser le compteur
    merchant.billing.smsUsed = 0
    await merchant.save()
  }
})
```

**Recommandation** : **Solution A (prépayé)** pour :
- Contrôle des dépenses pour le commerce
- Pas de mauvaise surprise en fin de mois
- Plus simple à gérer

---

## 5. Partagé vs Séparé

### Architecture recommandée (10 commerces)

| Ressource | Partagé | Séparé | Recommandation |
|-----------|---------|--------|----------------|
| **Code Source** | ✅ 1 repo GitHub | | ✅ **PARTAGÉ** |
| **Railway Projet** | | ✅ 10 projets | ✅ **SÉPARÉ** (isolation) |
| **MongoDB Cluster** | ✅ 1 cluster | | ✅ **PARTAGÉ** (économie) |
| **MongoDB Database** | | ✅ 10 DBs | ✅ **SÉPARÉ** (sécurité) |
| **Redis** | | ✅ 10 Redis | ✅ **SÉPARÉ** (1 par Railway) |
| **Cloudflare R2 Bucket** | ✅ 1 bucket | | ✅ **PARTAGÉ** (avec dossiers séparés) |
| **Twilio Account** | ❓ | ❓ | **DÉPEND** (voir ci-dessous) |
| **Stripe Account** | | ✅ 10 accounts | ✅ **SÉPARÉ** (légal) |

### Détails

#### 1. Code Source : **PARTAGÉ** ✅
- 1 repo GitHub
- 3 branches : `dev`, `main` (Vercel), `railway` (Railway)
- Déploiement : Chaque Railway projet pointe vers le même repo mais avec des variables d'env différentes

#### 2. Railway : **SÉPARÉ** ✅
```
Commerce A → https://liquidchoc-commerce-a.up.railway.app
Commerce B → https://liquidchoc-commerce-b.up.railway.app
...
```

**Avantages** :
- Crash d'un commerce n'affecte pas les autres
- Scaling indépendant
- Logs séparés

#### 3. MongoDB : **Cluster PARTAGÉ, Databases SÉPARÉES** ✅

```
MongoDB Atlas (1 cluster M2 - $9/mois)
├── commerce-a (DB)
├── commerce-b (DB)
└── commerce-j (DB)
```

**Variables d'env par commerce** :
```bash
# Commerce A
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/commerce-a

# Commerce B
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/commerce-b
```

**Avantages** :
- $9/mois au lieu de $90/mois (10 clusters)
- Backup centralisé
- Gestion simplifiée

**Sécurité** :
- Chaque DB est isolée
- Pas de cross-database queries possibles
- Credentials peuvent être différents par DB

#### 4. Redis : **SÉPARÉ** ✅

Chaque Railway projet a son propre Redis (fourni par Railway).

**Pourquoi pas partagé ?**
- Bull queues nécessitent isolation
- Risque de collision de job IDs

#### 5. Cloudflare R2 : **BUCKET PARTAGÉ, Dossiers SÉPARÉS** ✅

```
Bucket: liquidchoc-prod
├── commerce-a/
│   └── products/
│       ├── uuid1/image1.jpg
│       └── uuid2/image2.jpg
├── commerce-b/
│   └── products/
│       └── uuid3/image3.jpg
└── commerce-j/
    └── products/
```

**Avantages** :
- 10 GB gratuits par mois (suffit pour 10 commerces)
- Pas de coût additionnel
- Gestion centralisée

**Sécurité** :
- Chaque commerce a son dossier
- Path construction basé sur `BUSINESS_NAME` (déjà implémenté)

#### 6. Twilio : **2 OPTIONS**

##### Option A : 1 Compte Twilio, 10 numéros ✅ **RECOMMANDÉ**
```
Twilio Account (1)
├── +15141111111 (Commerce A)
├── +15142222222 (Commerce B)
└── +15149999999 (Commerce J)
```

**Avantages** :
- ✅ Moins cher : $1/mois par numéro = $10/mois total
- ✅ Gestion centralisée
- ✅ 1 seule facture

**Configuration** :
```bash
# Commerce A
TWILIO_ACCOUNT_SID=AC... (même pour tous)
TWILIO_AUTH_TOKEN=xxx (même pour tous)
TWILIO_PHONE_NUMBER=+15141111111 (différent)

# Commerce B
TWILIO_ACCOUNT_SID=AC... (même)
TWILIO_AUTH_TOKEN=xxx (même)
TWILIO_PHONE_NUMBER=+15142222222 (différent)
```

##### Option B : 10 Comptes Twilio séparés
```
Twilio Account A → +15141111111
Twilio Account B → +15142222222
```

**Avantages** :
- ✅ Isolation complète
- ✅ Chaque commerce gère son propre compte

**Désavantages** :
- ❌ 10 inscriptions Twilio
- ❌ 10 factures à gérer
- ❌ Plus complexe

**Recommandation** : **Option A** (1 compte, 10 numéros)

#### 7. Stripe : **SÉPARÉ OBLIGATOIRE** ✅

**Légalement**, chaque commerce **DOIT** avoir son propre compte Stripe.

```
Commerce A → Stripe Connect Account A
Commerce B → Stripe Connect Account B
```

**Pourquoi obligatoire ?**
- Chaque commerce reçoit les paiements directement
- Déclaration fiscale séparée
- Comptabilité séparée

**Stripe Connect** permet de créer des sub-accounts :

```javascript
// Créer un connected account pour chaque commerce
const account = await stripe.accounts.create({
  type: 'standard',
  country: 'CA',
  email: 'commerce-a@example.com',
  business_type: 'individual',
})

// Puis utiliser ce compte pour les paiements
const session = await stripe.checkout.sessions.create({
  // ...
  payment_intent_data: {
    application_fee_amount: 50, // Votre commission (0.50$)
    transfer_data: {
      destination: account.id, // Compte du commerce
    },
  },
}, {
  stripeAccount: account.id
})
```

---

## Résumé Architecture Recommandée

```
┌─────────────────────────────────────────────────┐
│         1 Repo GitHub (branches: dev, railway)  │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┼──────────────┐
        │             │              │
        ▼             ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Railway A    │ │ Railway B    │ │ Railway J    │
│ Redis A      │ │ Redis B      │ │ Redis J      │
└──────────────┘ └──────────────┘ └──────────────┘
        │             │              │
        ▼             ▼              ▼
┌──────────────────────────────────────────────────┐
│   MongoDB Atlas (1 cluster, 10 databases)        │
│   - commerce-a, commerce-b, ..., commerce-j      │
└──────────────────────────────────────────────────┘
        │             │              │
        ▼             ▼              ▼
┌──────────────────────────────────────────────────┐
│   Cloudflare R2 (1 bucket, 10 dossiers)          │
│   - commerce-a/, commerce-b/, ..., commerce-j/   │
└──────────────────────────────────────────────────┘
        │             │              │
        ▼             ▼              ▼
┌──────────────────────────────────────────────────┐
│   Twilio (1 account, 10 numéros)                 │
│   - +1514111..., +1514222..., +1514999...        │
└──────────────────────────────────────────────────┘
        │             │              │
        ▼             ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Stripe A     │ │ Stripe B     │ │ Stripe J     │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## Coûts Mensuels (10 commerces)

| Service | Coût | Note |
|---------|------|------|
| Railway (10×) | $50 | $5/mois par commerce |
| MongoDB Atlas | $9 | 1 cluster M2, 10 DBs |
| Cloudflare R2 | $0 | <10GB = gratuit |
| Twilio numéros | $10 | $1/mois par numéro |
| Twilio SMS | Variable | ~$0.01 par SMS |
| Stripe | $0 | Pas de frais mensuels |
| **TOTAL fixe** | **$69/mois** | |

**Prix de revente suggéré** : $25-35/mois par commerce
**Marge** : $15-25/mois par commerce × 10 = **$150-250/mois de profit**

---

## Checklist Déploiement Multi-Tenant

### Pour chaque nouveau commerce :

- [ ] **Railway** : Créer nouveau projet
- [ ] **MongoDB** : Créer nouvelle DB `commerce-{name}`
- [ ] **Twilio** : Acheter nouveau numéro
- [ ] **Stripe** : Créer connected account
- [ ] **Variables d'env** : Copier et adapter
- [ ] **Test** : Créer liquidation + SMS
- [ ] **Webhook Stripe** : Configurer avec URL Railway
- [ ] **Domaine** : (optionnel) Pointer vers Railway

Temps estimé : **15-20 minutes** par commerce

---

**Prêt à scaler à 10 commerces !** 🚀
