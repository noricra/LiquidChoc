# Migration Guide - Ancien server.js → Backend Caméléon

## ✅ Migration complétée

L'ancien `server.js` monolithique (540 lignes) a été restructuré en architecture modulaire **Backend Caméléon**.

## 📁 Ancien vs Nouveau

### Avant (Monolithique)
```
server.js (540 lignes)
├── Imports
├── Schemas Mongoose inline
├── Routes inline
├── Logique métier mélangée
└── Pas de séparation des responsabilités
```

### Après (Modulaire)
```
backend/src/
├── config/       → Configuration centralisée + Sector-Aware
├── models/       → Modèles Mongoose
├── controllers/  → Logique métier
├── routes/       → Routes Express
├── services/     → Services (Stripe, SMS, Cloudinary)
├── middleware/   → Middleware
├── utils/        → Utilitaires
├── app.js        → Configuration Express
└── server.js     → Point d'entrée
```

## 🎨 Nouvelles fonctionnalités

### Backend Caméléon (Sector-Aware)
Le backend s'adapte automatiquement selon `SECTOR` dans `.env` :

- **food** : Templates alimentaires, durées courtes, SMS adaptés
- **games** : Templates jeux, durées moyennes, SMS ludiques
- **services** : Templates services, durées longues, SMS professionnels

### Variables d'environnement enrichies

Nouvelles variables dans `.env` :
```bash
SECTOR=food                         # Type de commerce
BUSINESS_NAME=La Pâtisserie du Coin # Nom du commerce
PRIMARY_COLOR=#FF6B35               # Couleur principale
MERCHANT_ADDRESS=123 Rue...         # Adresse
MERCHANT_PHONE=+1514...             # Téléphone
```

## 🔄 Ce qui a changé

### Scripts package.json
```diff
- "dev:backend": "nodemon server.js"
+ "dev:backend": "nodemon backend/src/server.js"

- "start": "node server.js"
+ "start": "node backend/src/server.js"
```

### Imports dans le code
```diff
- const Merchant = require('./models/Merchant')
+ const Merchant = require('../models/Merchant')

- require('dotenv').config()
+ const config = require('../config/env')
```

### Messages SMS
Les messages SMS sont maintenant générés dynamiquement selon le secteur via `config/sector.js`.

## 🚀 Déploiement

### Ancien workflow
1. Modifier le code pour chaque client
2. Déployer une version différente

### Nouveau workflow
1. **Même code source pour tous**
2. Créer un `.env` personnalisé par client
3. Déployer avec les variables d'environnement

### Exemple : Déployer 3 commerces

**Commerce 1 : Pâtisserie**
```bash
SECTOR=food
BUSINESS_NAME=Chez Marcel
PRIMARY_COLOR=#FF6B35
```

**Commerce 2 : Arcade**
```bash
SECTOR=games
BUSINESS_NAME=GameZone
PRIMARY_COLOR=#7B2CBF
```

**Commerce 3 : Salon**
```bash
SECTOR=services
BUSINESS_NAME=Salon Élégance
PRIMARY_COLOR=#06D6A0
```

## 📦 Archivage

L'ancien `server.js` est conservé à la racine pour référence. Il peut être supprimé après validation complète.

## ✅ Checklist de migration

- [x] Créer l'arborescence backend/src/
- [x] Extraire les modèles
- [x] Créer les controllers
- [x] Créer les routes
- [x] Créer les services
- [x] Implémenter Sector-Aware
- [x] Mettre à jour package.json
- [x] Mettre à jour .env.example
- [x] Tester la syntaxe
- [ ] Tester en local avec .env
- [ ] Valider tous les endpoints
- [ ] Tester le webhook Stripe
- [ ] Déployer sur staging
- [ ] Valider en production

## 🧪 Tester la migration

```bash
# 1. Copier .env.example
cp .env.example .env

# 2. Remplir les credentials
nano .env

# 3. Démarrer le backend
npm run dev:backend

# 4. Vérifier le banner Sector-Aware
# Vous devriez voir :
# ╔════════════════════════════════════════════════════════════╗
# ║                  BACKEND CAMÉLÉON                          ║
# ╚════════════════════════════════════════════════════════════╝

# 5. Tester un endpoint
curl http://localhost:3000/health
```

## 🐛 Troubleshooting

### Erreur "Missing required environment variables"
→ Vérifier que le `.env` contient toutes les variables requises

### Erreur "Invalid SECTOR"
→ SECTOR doit être 'food', 'games' ou 'services'

### Erreur "Cannot find module"
→ Vérifier que tous les fichiers sont dans backend/src/

## 📞 Support

En cas de problème, vérifier :
1. Syntaxe des fichiers : `node -c backend/src/**/*.js`
2. Variables d'environnement : `cat .env`
3. Logs du serveur : regarder la console au démarrage
