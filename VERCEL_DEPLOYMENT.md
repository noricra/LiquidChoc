# Déploiement Vercel - LiquidaChoc

## Architecture

L'application a été adaptée pour fonctionner sur Vercel avec une architecture serverless :

- **Frontend** : Servi comme site statique depuis `/dist` (build Vite)
- **Backend** : Serverless Function dans `/api/index.js` qui wrap l'app Express
- **SMS** : Envoi direct sans Bull workers (mode serverless)

## Différences Dev vs Production

| Composant | Dev Local | Production Vercel |
|-----------|-----------|-------------------|
| Backend | Long-running Express server | Serverless Function |
| Bull Workers | ✅ Actifs (Redis requis) | ❌ Désactivés |
| SMS Queue | ✅ Via Bull + Redis | ❌ Envoi direct avec throttle |
| Redis | ✅ Requis | ❌ Non utilisé |

## Configuration Vercel

### 1. Créer un projet Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel
```

### 2. Variables d'environnement

Dans le dashboard Vercel (Settings → Environment Variables), ajouter :

```bash
# MongoDB (1 DB par commerce)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/commerce-A

# Stripe (compte isolé)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (1 numéro par commerce)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+15141234567

# Cloudflare R2 Storage
R2_SECRET_KEY=xxx
R2_APPLICATION_KEY=xxx
R2_BUCKET_NAME=liquidchoc-prod
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com

# Setup initial
SETUP_SECRET=random_secret_for_onboarding

# Backend Caméléon
SECTOR=food
BUSINESS_NAME=La Pâtisserie du Coin
PRIMARY_COLOR=#FF6B35
SECONDARY_COLOR=#004E89
ACCENT_COLOR=#06D6A0
MERCHANT_ADDRESS=123 Rue Principale, Montréal
MERCHANT_PHONE=+15141234567
PICKUP_HOURS=18h-20h tous les jours

# Frontend URL (votre domaine Vercel)
FRONTEND_URL=https://votre-app.vercel.app

# Node environment
NODE_ENV=production

# Serverless flag (automatique sur Vercel via VERCEL=1)
# IS_SERVERLESS=true
```

### 3. Webhook Stripe

Après déploiement, configurer le webhook Stripe :

1. Aller sur https://dashboard.stripe.com/webhooks
2. Créer un endpoint : `https://votre-app.vercel.app/webhook`
3. Écouter ces événements :
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copier le `STRIPE_WEBHOOK_SECRET` dans Vercel

## Limitations en mode Serverless

### SMS Broadcast

En production Vercel, les SMS sont envoyés **directement** (pas via queue Bull) :

- ✅ Avantage : Pas besoin de Redis
- ⚠️ Limitation : Timeout Vercel (10 secondes par défaut, 60s max)
- ⚠️ Performance : ~8 SMS/sec avec throttle de 120ms

**Pour de gros broadcasts (>100 abonnés)**, considérer :

1. **Upstash QStash** : Service queue externe compatible Vercel
2. **Vercel Background Functions** (beta)
3. **Déployer sur Railway/Render** : Pour les workers Bull

### Redis/Bull Workers

Les workers Bull sont **désactivés** en production Vercel car les serverless functions ne peuvent pas maintenir des processus long-running.

Si vous avez besoin des workers Bull :
- Déployer le backend sur Railway, Render ou Heroku
- Ou utiliser Upstash QStash comme alternative

## Multi-tenant (N instances)

Pour déployer plusieurs instances (1 par commerce) :

```bash
# Commerce A
vercel --prod --name liquidchoc-commerce-a

# Commerce B
vercel --prod --name liquidchoc-commerce-b
```

Chaque instance a :
- Ses propres variables d'env (BUSINESS_NAME, SECTOR, etc.)
- Sa propre DB MongoDB (MONGODB_URI différent)
- Son propre numéro Twilio
- Son propre compte Stripe

## Domaines personnalisés

Dans Vercel Dashboard → Domains :
- Ajouter `patisserie-coin.com`
- Ajouter `sallejeux-chicoutimi.com`
- etc.

## Monitoring

- **Logs** : Vercel Dashboard → Deployments → View Function Logs
- **Performance** : Vercel Analytics (activer dans Settings)
- **Errors** : Intégrer Sentry (optionnel)

## Troubleshooting

### 404 sur les routes API

- Vérifier que `vercel.json` existe à la racine
- Vérifier que `/api/index.js` existe
- Vérifier les rewrites dans `vercel.json`

### MongoDB connection timeout

- Whitelister `0.0.0.0/0` dans MongoDB Atlas Network Access
- Vérifier que `MONGODB_URI` est correcte

### Webhook Stripe ne se vérifie pas

- Vérifier que `STRIPE_WEBHOOK_SECRET` est le bon (celui du webhook Vercel, pas local)
- Tester avec Stripe CLI : `stripe trigger checkout.session.completed`

### Timeout SMS broadcast

Si >80 abonnés, le broadcast peut timeout (60s max sur Vercel).
Solutions :
1. Augmenter timeout dans `vercel.json` (max 60s sur Hobby, 300s sur Pro)
2. Utiliser Upstash QStash
3. Déployer backend ailleurs pour les workers

## Déploiement automatique

Vercel détecte automatiquement les push sur GitHub :

1. Connecter le repo GitHub dans Vercel Dashboard
2. Chaque push sur `main` → déploiement automatique
3. Branches → preview deployments

## Coûts

**Vercel Hobby (gratuit)** :
- 100 GB bandwidth/mois
- 100h serverless function execution/mois
- Timeout 10s (60s avec config)

**Vercel Pro ($20/mois)** :
- 1 TB bandwidth
- 1000h serverless execution
- Timeout 300s (5 min)

Pour >100 abonnés SMS, considérer Vercel Pro ou déployer ailleurs.
