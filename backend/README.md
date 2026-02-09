# Backend Caméléon - Architecture Sector-Aware

## 🎯 Concept

**Multi-tenant Single-tenant** : Chaque commerce a sa propre instance déployée avec ses propres variables d'environnement. Le même code source s'adapte automatiquement selon le secteur (Food/Games/Services).

## 🏗️ Architecture

```
backend/src/
├── config/           → Configuration centralisée
│   ├── env.js        → Chargement des variables d'env
│   ├── sector.js     → Système Sector-Aware (Food/Games/Services)
│   ├── db.js         → Connexion MongoDB
│   ├── stripe.js     → Client Stripe
│   ├── twilio.js     → Client Twilio
│   └── cloudinary.js → Client Cloudinary
│
├── models/           → Modèles Mongoose
│   └── Merchant.js   → Modèle principal (single-tenant)
│
├── controllers/      → Logique métier
│   ├── setup.controller.js
│   ├── merchant.controller.js
│   ├── template.controller.js
│   ├── subscriber.controller.js
│   ├── liquidation.controller.js
│   ├── sale.controller.js
│   ├── webhook.controller.js
│   └── upload.controller.js
│
├── routes/           → Routes Express
│   ├── index.js      → Point d'entrée centralisé
│   └── *.routes.js   → Routes modulaires
│
├── services/         → Services métier
│   ├── stripe.service.js
│   ├── sms.service.js
│   └── cloudinary.service.js
│
├── middleware/       → Middleware Express
│   ├── errorHandler.js
│   └── notFound.js
│
├── utils/            → Utilitaires
│   └── helpers.js
│
├── app.js            → Configuration Express
└── server.js         → Point d'entrée principal
```

## 🎨 Backend Caméléon - Sector-Aware

Le système s'adapte automatiquement selon la variable `SECTOR` dans le `.env` :

### **Food** (Restaurants, Pâtisseries)
- Templates : Small/Medium/Large (boîtes surprise)
- Durée liquidation : 4h
- Durée pickup : 2h
- SMS personnalisés pour l'alimentaire

### **Games** (Salles de jeux, Arcades)
- Templates : Session 1h/2h/3h
- Durée liquidation : 6h
- Durée pickup : 24h
- SMS personnalisés pour les loisirs

### **Services** (Salons, Spas)
- Templates : Express/Standard/Premium
- Durée liquidation : 12h
- Durée pickup : 48h
- SMS personnalisés pour les services

## 🔧 Configuration

### Variables d'environnement requises

```bash
# Secteur (détermine le comportement)
SECTOR=food  # food | games | services

# Branding
BUSINESS_NAME=La Pâtisserie du Coin
PRIMARY_COLOR=#FF6B35
MERCHANT_ADDRESS=123 Rue Principale, Montréal
MERCHANT_PHONE=+15141234567

# Intégrations
MONGODB_URI=mongodb+srv://...
STRIPE_SECRET_KEY=sk_xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
```

## 🚀 Déploiement

### 1 Instance = 1 Commerce

Chaque commerce a :
- Sa propre base MongoDB
- Ses propres clés Stripe (isolation totale)
- Son propre `.env` avec personnalisation
- Le même code source

### Workflow Git

```bash
# Branche main → code source partagé
git checkout main

# Pour un client spécifique
git checkout -b client/patisserie-marcel
# Modifier .env avec les variables du client
# Déployer sur Vercel/Railway avec ce .env
```

## 📦 Modularité Plug & Play

L'architecture permet de :
- Modifier une route sans toucher aux autres
- Ajouter un nouveau secteur dans `config/sector.js`
- Créer une branche par client pour customisations
- Déployer en 1 commande

## 🧪 Test local

```bash
# Copier .env.example vers .env
cp .env.example .env

# Modifier .env avec vos credentials

# Démarrer
npm run dev:backend
```

## 📡 Webhook Stripe

Le webhook DOIT être configuré avec `/webhook` (raw body).

Events à écouter :
- `checkout.session.completed`

## 🔐 Sécurité

- 1 instance = 1 commerce = isolation totale
- Clés Stripe ne leakent jamais entre clients
- SETUP_SECRET pour onboarding initial
- Validation des variables au démarrage

## 📝 Notes importantes

- Le modèle `Merchant` est **single-tenant** (1 seul merchant par instance)
- Les SMS utilisent les templates du secteur configuré
- Les couleurs et logos viennent du `.env`
- Pas d'auth multi-utilisateur (single-tenant)
