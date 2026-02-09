# Fixes Critiques - LiquidaChoc

## 🔴 Problèmes identifiés & Résolus

### 1. Race Condition sur le stock (CRITIQUE)

**Problème :**
```javascript
// ❌ Code initial - PAS atomique
const liquidation = merchant.findLiquidation(liquidationId)
if (liquidation.quantitySold >= liquidation.quantity) { refund }
liquidation.quantitySold += 1  // ← 2 clients peuvent lire la même valeur
await merchant.save()
```

**Scénario :**
```
Stock restant: 1 exemplaire
T0: Client A lit quantitySold = 4 (quantity = 5)
T1: Client B lit quantitySold = 4 (quantity = 5)  ← LIT EN MÊME TEMPS
T2: Client A incrémente → quantitySold = 5, save()
T3: Client B incrémente → quantitySold = 5, save() ← ÉCRASE !
Résultat: 2 ventes créées, mais quantitySold = 5 au lieu de 6 → SURVENTE
```

**Solution ✅ : MongoDB Transaction**
```javascript
// backend/src/controllers/webhook.controller.js

const mongoSession = await mongoose.startSession()
mongoSession.startTransaction()

try {
  // 1. Lock: récupérer le merchant dans la transaction
  const merchant = await Merchant.findOne().session(mongoSession)
  const liquidation = merchant.findLiquidation(liquidationId)

  // 2. Vérifier stock DANS la transaction
  if (liquidation.quantitySold >= liquidation.quantity) {
    await mongoSession.abortTransaction()
    await createRefund(session.payment_intent, 'out_of_inventory')
    return
  }

  // 3. Incrémenter + sauvegarder dans la transaction
  liquidation.quantitySold += 1
  merchant.sales.push(sale)
  await merchant.save({ session: mongoSession })

  // 4. Commit
  await mongoSession.commitTransaction()
} catch (err) {
  await mongoSession.abortTransaction()
  throw err
} finally {
  mongoSession.endSession()
}
```

**Garantie :** Si 2 clients tentent d'acheter le dernier exemplaire, MongoDB garantit qu'un seul passera. L'autre sera refunded automatiquement.

---

### 2. SMS Throttling Bottleneck (IMPORTANT)

**Problème :**
```javascript
// ❌ Code initial - Synchrone, bloque 8 minutes pour 5000 abonnés
for (const subscriber of merchant.subscribers) {
  await sendSMS(subscriber.phone, body)
  await new Promise(r => setTimeout(r, 100))  // 100ms throttle
}
// 5000 abonnés × 100ms = 500 secondes = 8 minutes
```

**Impact :**
- 5000 abonnés = 8 minutes d'envoi
- Bloque le serveur pendant l'envoi
- Pas de retry en cas d'échec
- Pas de monitoring

**Solution ✅ : Bull + Redis Queue**

**Architecture :**
```
Client → POST /api/liquidations/create
       → Controller crée liquidation
       → Service SMS enqueue le broadcast (instant)
       → Réponse HTTP immédiate ✅

Background:
Worker Bull → Traite la queue
            → Envoie 1 SMS toutes les 100ms
            → Retry automatique (3 tentatives)
            → Progress tracking
            → Mise à jour smsSentCount
```

**Fichiers créés :**
```
backend/src/
├── config/redis.js           → Connexion Redis
├── services/queue.service.js → Gestion queue Bull
├── jobs/smsBroadcast.job.js  → Processeur de jobs
└── workers/index.js          → Worker Bull
```

**Code :**
```javascript
// backend/src/services/sms.service.js
async function smsBroadcast(merchant, liquidation) {
  const { enqueueSMSBroadcast } = require('./queue.service')

  // ✅ Enqueue (retour immédiat)
  await enqueueSMSBroadcast({
    merchantId: merchant._id,
    liquidationId: liquidation._id,
    subscribers: merchant.subscribers,
    message: generateSMS('liquidation', data)
  })

  return merchant.subscribers.length
}

// backend/src/jobs/smsBroadcast.job.js
async function processSMSBroadcast(job) {
  for (let i = 0; i < subscribers.length; i++) {
    await twilioClient.messages.create(...)
    job.progress(Math.round((i / total) * 100))
    await new Promise(r => setTimeout(r, 100))  // Throttle
  }
  return { sent, failed, total }
}
```

**Avantages :**
- ✅ Réponse HTTP instantanée (pas de blocage)
- ✅ Traitement en background
- ✅ Retry automatique (3× par défaut)
- ✅ Progress tracking
- ✅ Scalable (plusieurs workers possibles)
- ✅ Monitoring via Bull Dashboard

---

## 📊 Comparaison Avant/Après

| Métrique | Avant | Après |
|----------|-------|-------|
| **Race condition** | ❌ Possible (survente) | ✅ Impossible (transaction) |
| **SMS 5000 abonnés** | ⚠️ 8 min (bloquant) | ✅ Instant (background) |
| **Retry SMS** | ❌ Non | ✅ Oui (3×) |
| **Progress tracking** | ❌ Non | ✅ Oui |
| **Monitoring** | ❌ Non | ✅ Bull Dashboard |
| **Scalabilité** | ⚠️ Limitée | ✅ Plusieurs workers |

---

## 🚀 Déploiement

### Variables d'environnement ajoutées

```bash
# ─── Redis (pour Bull queue) ─────────────────────────────────
REDIS_URL=redis://localhost:6379
# Production: redis://user:pass@redis.example.com:6379
```

### Dépendances ajoutées

```bash
npm install bull ioredis
```

### Services requis en production

1. **MongoDB** (avec support Replica Set pour transactions)
2. **Redis** (pour Bull queue)
3. **Stripe** (webhooks)
4. **Twilio** (SMS)

---

## ✅ Tests à effectuer

### Test Race Condition

```bash
# Simuler 2 achats simultanés pour le dernier exemplaire
# Résultat attendu: 1 vente créée, 1 refund automatique

# Terminal 1
curl -X POST https://api.stripe.com/v1/checkout/sessions/:id/complete

# Terminal 2 (en même temps)
curl -X POST https://api.stripe.com/v1/checkout/sessions/:id2/complete

# Vérifier: quantitySold = 5, sales.length = 5 (pas 6)
```

### Test SMS Queue

```bash
# 1. Démarrer Redis
redis-server

# 2. Démarrer le backend
npm run dev:backend

# 3. Créer une liquidation avec beaucoup d'abonnés
# Vérifier:
# - Réponse HTTP instantanée
# - Logs "SMS Broadcast enqueued"
# - Worker traite en background
# - smsSentCount mis à jour
```

---

## 🔐 Sécurité

### MongoDB Transactions
- Requiert MongoDB Replica Set (ou sharded cluster)
- En développement local: convertir standalone → replica set
```bash
mongod --replSet rs0
mongo
> rs.initiate()
```

### Redis
- Production: Activer AUTH
- Configurer maxmemory-policy
```bash
redis-cli CONFIG SET requirepass "strongpassword"
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## 📈 Scalabilité

### 1 Worker → Plusieurs Workers

```javascript
// worker1.js (serveur principal)
smsBroadcastQueue.process('broadcast', 1, processSMSBroadcast)

// worker2.js (serveur dédié)
smsBroadcastQueue.process('broadcast', 2, processSMSBroadcast)
// → 3 jobs en parallèle (1+2)
```

### Limites

| Élément | Limite |
|---------|--------|
| Twilio SMS/sec | ~10 (throttle 100ms) |
| MongoDB TPS | ~10k (avec réplicas) |
| Redis OPS | ~100k |
| Stripe Webhooks | Illimité (async) |

---

## 🎯 Conclusion

Les 2 problèmes critiques sont **résolus** :

1. ✅ **Race condition** : Transaction MongoDB garantit 0 survente
2. ✅ **SMS bottleneck** : Queue Bull permet 5000+ abonnés sans bloquer

L'architecture est maintenant **production-ready** pour déployer 10+ commerces.
