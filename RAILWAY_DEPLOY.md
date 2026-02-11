# Déploiement Railway - Guide Complet

## Branche Railway

Cette branche `railway` est optimisée pour Railway avec :
- ✅ Bull workers activés (SMS queue pour 300+ abonnés)
- ✅ Redis réel (pas de mock)
- ✅ Pas de timeout
- ✅ Filesystem read-write

---

## Étape 1 : Créer compte Railway

1. Aller sur https://railway.app
2. Sign up with GitHub
3. Autoriser l'accès au repo `LiquidChoc`

---

## Étape 2 : Créer nouveau projet

### Option A : Via Dashboard (recommandé)

1. **New Project** → **Deploy from GitHub repo**
2. Sélectionner : `noricra/LiquidChoc`
3. **Branch** : Choisir `railway`
4. Railway va :
   - Détecter Node.js automatiquement
   - Lire `railway.json` pour la config
   - Installer les dépendances
   - Builder le frontend (`npm run build`)

### Option B : Via CLI

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Login
railway login

# Init dans le repo
railway init

# Link au projet
railway link
```

---

## Étape 3 : Ajouter Redis

**Dans Railway Dashboard** :
1. Cliquer sur votre projet
2. **New** → **Database** → **Add Redis**
3. Railway crée automatiquement `REDIS_URL`

---

## Étape 4 : Variables d'environnement

**Dans Railway Dashboard → Variables** :

Copier toutes ces variables :

```bash
# MongoDB (votre MongoDB Atlas existant)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/commerce-A

# Redis (fourni automatiquement par Railway)
REDIS_URL=${{Redis.REDIS_URL}}

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15141234567

# Cloudflare R2
R2_SECRET_KEY=b66e9808e42b4027df23685e8905ed0d35fbef3fdd203eb8fe30d97ad8e0f184
R2_APPLICATION_KEY=0c8a48bdb0bb369848de67e95eeae4f1
R2_BUCKET_NAME=liquidchoc-testdev
R2_ENDPOINT=https://f7cb986453a22fd1d1793a78181aecc1.r2.cloudflarestorage.com

# Setup
SETUP_SECRET=changeme_avec_une_valeur_aléatoire

# Backend Caméléon
SECTOR=food
BUSINESS_NAME=Mon Commerce TGTG
PRIMARY_COLOR=#006644
SECONDARY_COLOR=#F7F7F7
ACCENT_COLOR=#006644
MERCHANT_ADDRESS=123 Rue Test, Montréal, QC
MERCHANT_PHONE=+15141234567
PICKUP_HOURS=18h-20h tous les jours

# Frontend URL (fourni par Railway)
FRONTEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Node
NODE_ENV=production
PORT=3000
```

---

## Étape 5 : Déployer

Railway déploie automatiquement dès que vous :
- Pushez sur la branche `railway`
- Ou cliquez sur **Deploy** dans le dashboard

**Premier déploiement** :
- Durée : 3-5 minutes
- Railway va :
  1. Cloner le repo (branche `railway`)
  2. `npm install`
  3. `npm run build` (frontend)
  4. `npm start` (backend)

**Logs en temps réel** :
- Railway Dashboard → **Deployments** → **View Logs**

---

## Étape 6 : Configurer Stripe Webhook

Une fois déployé, Railway vous donne une URL publique :
```
https://liquidchoc-production.up.railway.app
```

1. Aller sur https://dashboard.stripe.com/webhooks
2. **Add endpoint** :
   ```
   https://votre-app.railway.app/webhook
   ```
3. **Events** : `checkout.session.completed`
4. Copier le **Signing secret** → Ajouter dans Railway Variables :
   ```
   STRIPE_WEBHOOK_SECRET=whsec_nouveau_secret
   ```
5. **Redeploy** Railway

---

## Étape 7 : Tester

### Test /health
```bash
curl https://votre-app.railway.app/health
```

Vous devriez voir :
```json
{
  "status": "ok",
  "instance": {
    "businessName": "Mon Commerce TGTG",
    "sector": "food"
  },
  "services": {
    "mongodb": true,
    "redis": true,
    "stripe": true,
    "twilio": true
  }
}
```

### Test liquidation avec 300 abonnés

1. Créer une liquidation
2. Railway logs montrera :
   ```
   Bull workers started (SMS queue)
   SMS Broadcast enqueued: 300 subscribers
   Processing SMS broadcast job...
   ```
3. Pas de timeout ! Les SMS seront envoyés progressivement via la queue

---

## Monitoring

### Logs
**Railway Dashboard → Deployments → View Logs**

Cherchez :
- `Redis connected` ✅
- `MongoDB connected` ✅
- `Bull workers started` ✅
- `Server running on port 3000` ✅

### Métriques
**Railway Dashboard → Metrics**
- CPU usage
- Memory usage
- Network traffic

---

## Scaling

### Vertical (plus de ressources)
**Railway Dashboard → Settings → Resources**
- **Starter** : 512 MB RAM, 1 vCPU ($5/mois)
- **Developer** : 8 GB RAM, 8 vCPU ($20/mois)

### Horizontal (plusieurs instances)
Railway supporte le scaling horizontal :
```bash
railway scale --replicas 2
```

---

## Coûts Railway

### Plan Hobby ($5/mois)
- 512 MB RAM
- 1 GB storage
- ✅ Suffisant pour 1-3 commerces avec <500 abonnés chacun

### Plan Pro ($20/mois)
- 8 GB RAM
- 100 GB storage
- ✅ Pour 10+ commerces ou >1000 abonnés par commerce

### Usage-based
- $0.000231/GB-hour (RAM)
- $0.10/GB (bandwidth)
- Estimation : **$10-15/mois** pour usage moyen

---

## Multi-tenant sur Railway

Pour déployer **N commerces** :

### Option 1 : N projets Railway (isolation complète)
```
Commerce A → Projet Railway A → DB commerce-a
Commerce B → Projet Railway B → DB commerce-b
```

### Option 2 : 1 projet avec N databases MongoDB
```
1 Projet Railway → Redis partagé
                 → DB commerce-a
                 → DB commerce-b
                 → DB commerce-c
```

**Recommandation** : Option 1 pour isolation et scaling indépendant

---

## Troubleshooting

### ❌ Redis connection failed
**Cause** : Variable `REDIS_URL` pas définie
**Solution** : Vérifier que le service Redis est ajouté et `REDIS_URL=${{Redis.REDIS_URL}}`

### ❌ Workers not starting
**Cause** : Ancien code serverless détecté
**Solution** : Vérifier que vous êtes bien sur la branche `railway`

### ❌ Timeout SMS broadcast
**Cause** : Pas possible sur Railway ! Si ça arrive :
**Solution** : Vérifier les logs Bull workers

### ❌ 404 sur images
**Cause** : R2 credentials invalides
**Solution** : Vérifier `R2_SECRET_KEY`, `R2_APPLICATION_KEY`, `R2_ENDPOINT`

---

## Différences Railway vs Vercel

| Feature | Vercel (branche dev) | Railway (branche railway) |
|---------|----------------------|---------------------------|
| Architecture | Serverless | Long-running container |
| Bull workers | ❌ Désactivés | ✅ Actifs |
| Redis | ❌ Mock | ✅ Natif |
| SMS >100 abonnés | ❌ Timeout | ✅ Queue Bull |
| Timeout | 10-60s | ✅ Illimité |
| Prix | 🆓 Free | 💰 $5-20/mois |

---

## Commandes utiles

```bash
# Voir les logs en temps réel
railway logs

# Redéployer
railway up

# Ouvrir l'app
railway open

# Variables d'env
railway variables

# Shell dans le container
railway run bash
```

---

## Support

- **Documentation** : https://docs.railway.app
- **Community** : https://discord.gg/railway
- **Status** : https://status.railway.app

---

Votre application est maintenant prête pour 300+ abonnés sans timeout ! 🚀
