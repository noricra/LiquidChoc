# 🚀 Guide de déploiement - LiquidaChoc

## 📌 Architecture de déploiement

```
1 Repo Git
    ↓
Pour chaque nouveau commerce :
    ↓
┌─────────────────────────────────────────────┐
│ 1. Créer DB Atlas                           │
│ 2. Créer instance Vercel                    │
│ 3. Configurer variables d'environnement     │
│ 4. Initialiser DB avec merchant             │
│ 5. (Optionnel) Setup Upstash Redis          │
└─────────────────────────────────────────────┘
```

---

## 📦 Prérequis (une seule fois)

### 1. MongoDB Atlas (gratuit)
- Créer compte sur https://www.mongodb.com/cloud/atlas
- Créer un **Cluster** (M0 gratuit)
- Note: **1 cluster = N databases** (une par commerce)

### 2. Vercel (gratuit)
- Créer compte sur https://vercel.com
- Installer CLI : `npm i -g vercel`

### 3. Upstash Redis (optionnel, gratuit)
- Pour production : https://upstash.com
- Pour dev local : Redis Homebrew suffit

---

## 🏪 Déployer un nouveau commerce (Commerce A)

### Étape 1 : Créer la database MongoDB

**Dans Atlas :**
1. Allez dans **Database** → **Browse Collections**
2. Cliquez **+ Create Database**
3. Nom : `commerce-restaurant-a` (unique par commerce)
4. Collection : `merchants` (créée automatiquement)

### Étape 2 : Créer l'instance Vercel

**Option A : Via Dashboard**
```bash
1. https://vercel.com/new
2. Importer le repo Git
3. Nom du projet : commerce-restaurant-a
4. Framework Preset : Vite
5. Root Directory : .
6. Build Command : npm run build
7. Output Directory : dist
```

**Option B : Via CLI**
```bash
# Dans le repo
vercel

# Suivre les prompts :
# - Link to existing project? No
# - Project name: commerce-restaurant-a
# - Directory: .
# - Override settings? No
```

### Étape 3 : Configurer les variables d'environnement

**Dans Vercel Dashboard → Settings → Environment Variables :**

```env
# ─── Backend ─────────────────────────────────────────────────
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://commerce-restaurant-a.vercel.app

# ─── MongoDB Atlas ───────────────────────────────────────────
# Remplacer : user, password, cluster, DB_NAME
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/commerce-restaurant-a?retryWrites=true&w=majority

# ─── Upstash Redis (Production) ─────────────────────────────
# Créer sur https://upstash.com → New Database
REDIS_URL=rediss://default:password@your-redis.upstash.io:6379

# ─── Stripe (Compte du commerce) ────────────────────────────
# Clés de production (sk_live_..., pk_live_...)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ─── Twilio (Numéro dédié au commerce) ──────────────────────
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+15141234567

# ─── Cloudflare R2 (Bucket partagé) ─────────────────────────
R2_SECRET_KEY=xxx
R2_APPLICATION_KEY=xxx
R2_BUCKET_NAME=liquidchoc-prod
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com/liquidchoc-prod

# ─── Setup (Secret pour init DB) ────────────────────────────
# Générer avec : openssl rand -base64 32
SETUP_SECRET=random_secret_unique

# ─── Personnalisation Commerce ──────────────────────────────
SECTOR=food
BUSINESS_NAME=Restaurant ABC
PRIMARY_COLOR=#FF6B35
SECONDARY_COLOR=#004E89
ACCENT_COLOR=#06D6A0
MERCHANT_ADDRESS=123 Rue Principale, Montréal, QC
MERCHANT_PHONE=+15141234567
PICKUP_HOURS=18h-20h tous les jours
```

### Étape 4 : Déployer

```bash
# Via CLI
vercel --prod

# Ou via Dashboard → Deployments → Redeploy
```

### Étape 5 : Initialiser la database

**Une fois déployé, initialiser le merchant :**

```bash
# Méthode 1 : Via endpoint setup (recommandé)
curl -X POST https://commerce-restaurant-a.vercel.app/api/setup \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "VOTRE_SETUP_SECRET",
    "businessName": "Restaurant ABC",
    "address": "123 Rue Principale, Montréal",
    "phone": "+15141234567",
    "pickupHours": "18h-20h tous les jours"
  }'

# Méthode 2 : Via script (si SSH disponible)
# Connecter à Vercel CLI
vercel env pull
node scripts/init-db.js
```

### Étape 6 : Configurer Stripe Webhooks

1. Allez sur https://dashboard.stripe.com/webhooks
2. **Add endpoint**
3. URL : `https://commerce-restaurant-a.vercel.app/api/webhooks/stripe`
4. Events à écouter :
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copier le **Signing secret** (`whsec_...`)
6. Le mettre dans Vercel → `STRIPE_WEBHOOK_SECRET`

---

## 🔄 Déployer Commerce B (même repo)

**Répétez les étapes 1-6 avec :**
- Database : `commerce-restaurant-b`
- Projet Vercel : `commerce-restaurant-b`
- .env différent (autres credentials Stripe/Twilio/etc.)

---

## 🐛 Troubleshooting

### MongoDB connection failed

**Problème :** IP non whitelistée

**Solution :**
1. Atlas → Network Access
2. Add IP Address → `0.0.0.0/0` (permet toutes les IPs)
3. Attendre 2-3 min pour propagation

### Redis connection failed

**Problème :** REDIS_URL invalide

**Solutions :**
- Vérifier format : `rediss://` (avec double 's' pour TLS)
- Tester la connexion : `redis-cli -u "REDIS_URL"`
- Créer nouveau database sur Upstash

### Build failed on Vercel

**Problème :** `vite build` échoue

**Solutions :**
```bash
# Vérifier localement
npm run build

# Si erreur TypeScript, ajouter dans vite.config.js :
export default {
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
        warn(warning)
      }
    }
  }
}
```

### Webhooks Stripe ne marchent pas

**Problème :** Signature invalide

**Solutions :**
1. Vérifier `STRIPE_WEBHOOK_SECRET` dans Vercel
2. Re-créer le webhook dans Stripe Dashboard
3. Vérifier que l'URL est exacte (avec `/api/`)

---

## 📊 Monitoring

### Logs Vercel

```bash
# Via CLI
vercel logs commerce-restaurant-a --follow

# Via Dashboard
Deployments → [dernière] → Runtime Logs
```

### Vérifier santé de l'instance

```bash
curl https://commerce-restaurant-a.vercel.app/health
```

**Réponse attendue :**
```json
{
  "status": "ok",
  "instance": {
    "businessName": "Restaurant ABC",
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

---

## 🔐 Sécurité

### Secrets à ne JAMAIS commit

- `.env` (déjà dans .gitignore)
- Credentials Stripe/Twilio/MongoDB
- `SETUP_SECRET`

### Générer des secrets forts

```bash
# Pour SETUP_SECRET
openssl rand -base64 32

# Pour JWT_SECRET (si ajouté plus tard)
openssl rand -hex 64
```

### Rotation des secrets

Si une clé fuit :
1. Révoquer dans le service (Stripe/Twilio/Atlas)
2. Générer nouvelle clé
3. Mettre à jour dans Vercel
4. Redéployer

---

## 💰 Coûts estimés (par commerce)

| Service | Plan | Coût/mois |
|---------|------|-----------|
| Vercel | Hobby | **Gratuit** (100GB bandwidth) |
| MongoDB Atlas | M0 | **Gratuit** (512MB) |
| Upstash Redis | Free | **Gratuit** (10k requests/day) |
| Cloudflare R2 | Free | **Gratuit** (10GB storage) |
| Stripe | Standard | **2.9% + 0.30$** par transaction |
| Twilio | Pay-as-you-go | **~0.0075$** par SMS |

**Total fixe : 0$/mois** 🎉
**Coûts variables : Stripe + Twilio selon usage**

---

## 📚 Ressources

- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
- [Upstash Redis](https://docs.upstash.com/redis)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Twilio SMS](https://www.twilio.com/docs/sms)

---

## ✅ Checklist déploiement

Pour chaque nouveau commerce :

- [ ] Créer DB MongoDB Atlas
- [ ] Créer projet Vercel
- [ ] Configurer toutes les variables d'environnement
- [ ] Déployer (`vercel --prod`)
- [ ] Initialiser DB (endpoint `/api/setup`)
- [ ] Configurer webhook Stripe
- [ ] Tester `/health`
- [ ] Tester création template + upload photo
- [ ] Tester liquidation + SMS
- [ ] Tester paiement end-to-end
