# 🚀 Quick Start - Backend Caméléon

## ✅ Ce qui a été fait

### Restructuration complète (540 lignes → Architecture modulaire)

**32 fichiers créés** | **1657 lignes de code** | **8 dossiers**

```
backend/src/
├── config/        → 7 fichiers (env, sector, db, stripe, twilio, cloudinary)
├── models/        → 1 fichier  (Merchant single-tenant)
├── controllers/   → 8 fichiers (setup, merchant, template, subscriber, liquidation, sale, webhook, upload)
├── routes/        → 9 fichiers (index + 8 routes modulaires)
├── services/      → 3 fichiers (stripe, sms, cloudinary)
├── middleware/    → 2 fichiers (errorHandler, notFound)
├── utils/         → 1 fichier  (helpers)
├── app.js         → Configuration Express
└── server.js      → Point d'entrée avec banner Sector-Aware
```

### Système Sector-Aware implémenté

3 secteurs configurés dans `config/sector.js` :
- **FOOD** : Restaurants, Pâtisseries
- **GAMES** : Salles de jeux, Arcades
- **SERVICES** : Salons, Spas, Coiffeurs

Chaque secteur a :
- Templates de prix différents
- Durées de liquidation adaptées
- Messages SMS personnalisés
- Logique métier spécifique

## 🔧 Prochaines étapes

### 1. Configuration locale

```bash
# Copier .env.example
cp .env.example .env

# Éditer avec vos credentials
nano .env
```

Variables **obligatoires** :
```bash
MONGODB_URI=mongodb+srv://...
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx
SECTOR=food                    # food | games | services
BUSINESS_NAME=Votre Commerce
```

### 2. Test local

```bash
# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer le backend
npm run dev:backend
```

Vous devriez voir :
```
╔════════════════════════════════════════════════════════════╗
║                  BACKEND CAMÉLÉON                          ║
║  🏪 Business: Votre Commerce                               ║
║  🍽️  Sector:  Food                                         ║
╚════════════════════════════════════════════════════════════╝
✅ Server running on http://localhost:3000
```

### 3. Tester les endpoints

```bash
# Health check
curl http://localhost:3000/health

# Setup initial (une seule fois)
curl -X POST http://localhost:3000/api/setup \
  -H "Authorization: Bearer VOTRE_SETUP_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Test Commerce"}'

# Get merchant info
curl http://localhost:3000/api/merchant
```

### 4. Webhook Stripe (local)

```bash
# Terminal 1: Serveur
npm run dev:backend

# Terminal 2: Stripe CLI
stripe listen --forward-to localhost:3000/webhook
```

### 5. Déploiement Vercel/Railway

```bash
# Option 1: Vercel
vercel --prod

# Option 2: Railway
railway up

# Configurer les variables d'environnement dans le dashboard
```

## 📚 Documentation

- `backend/README.md` → Architecture détaillée
- `MIGRATION.md` → Guide de migration
- `ARCHITECTURE.md` → Vue d'ensemble
- `.env.example` → Variables complètes avec exemples

## 🎨 Exemples de configuration

### Commerce 1: Pâtisserie (Food)
```bash
SECTOR=food
BUSINESS_NAME=La Pâtisserie du Coin
PRIMARY_COLOR=#FF6B35
MERCHANT_ADDRESS=123 Rue Principale, Montréal
```

### Commerce 2: Arcade (Games)
```bash
SECTOR=games
BUSINESS_NAME=GameZone Arcade
PRIMARY_COLOR=#7B2CBF
MERCHANT_ADDRESS=789 Rue Ludique, Montréal
```

### Commerce 3: Salon (Services)
```bash
SECTOR=services
BUSINESS_NAME=Salon Élégance
PRIMARY_COLOR=#06D6A0
MERCHANT_ADDRESS=321 Avenue Belle, Montréal
```

## ✅ Checklist de validation

- [ ] Backend démarre sans erreur
- [ ] Banner Sector-Aware s'affiche
- [ ] Endpoint /health retourne OK
- [ ] Setup merchant fonctionne
- [ ] Créer un template
- [ ] Créer une liquidation
- [ ] Webhook Stripe fonctionne
- [ ] SMS envoyés (si Twilio configuré)
- [ ] Frontend se connecte au backend

## 🐛 Troubleshooting

### Erreur "Missing required environment variables"
→ Vérifier que `.env` contient MONGODB_URI, STRIPE_SECRET_KEY, TWILIO_*

### Erreur "Invalid SECTOR"
→ SECTOR doit être 'food', 'games' ou 'services' (minuscules)

### Erreur "Cannot find module"
→ Vérifier que `node_modules` est installé : `npm install`

### Webhook Stripe échoue
→ Vérifier STRIPE_WEBHOOK_SECRET dans `.env`

## 🎯 Avantages du Backend Caméléon

✅ **Modularité** → Modifier une route sans toucher aux autres
✅ **Sector-Aware** → Adaptation automatique au type de commerce
✅ **Plug & Play** → Branches Git par client pour customisations
✅ **Scalable** → Autant d'instances que de commerces
✅ **Maintenable** → 1 codebase, documentation claire

## 📞 Support

En cas de problème :
1. Vérifier les logs du serveur
2. Consulter MIGRATION.md
3. Tester avec `node -c backend/src/**/*.js`
