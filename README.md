# LiquidaChoc 🍫

SaaS de liquidation d'invendus via SMS pour commerces locaux.

## 🚀 Démarrage rapide (Dev local avec Docker)

### 1. Installer Docker Desktop

**macOS :**
```bash
brew install --cask docker
# Ou télécharger depuis https://www.docker.com/products/docker-desktop
```

**Windows/Linux :** Téléchargez Docker Desktop depuis https://www.docker.com/products/docker-desktop

### 2. Lancer MongoDB + Redis

```bash
# Lancer les containers en arrière-plan
docker-compose up -d

# Vérifier qu'ils tournent
docker ps
```

Vous devriez voir :
- `liquidchoc-mongodb` sur port 27017
- `liquidchoc-redis` sur port 6379

### 3. Configuration

```bash
# Copier le fichier env local
cp .env.local .env

# Installer les dépendances
npm install
```

### 4. Lancer l'app

```bash
# Lance backend (port 3000) + frontend (port 5173) en parallèle
npm run dev
```

Ouvrez http://localhost:5173

### 5. Arrêter Docker

```bash
# Arrêter les containers
docker-compose down

# Arrêter ET supprimer les données
docker-compose down -v
```

---

## 📦 Commandes Docker utiles

```bash
# Voir les logs MongoDB
docker logs liquidchoc-mongodb

# Voir les logs Redis
docker logs liquidchoc-redis

# Se connecter à MongoDB (shell)
docker exec -it liquidchoc-mongodb mongosh -u admin -p password123

# Se connecter à Redis (cli)
docker exec -it liquidchoc-redis redis-cli

# Redémarrer un service
docker-compose restart mongodb
docker-compose restart redis
```

---

## 🏗️ Architecture

**1 code source → N instances Vercel (1 par commerce)**

- **Backend :** Express + MongoDB + Stripe + Twilio + Bull/Redis
- **Frontend :** React + Vite + Tailwind
- **Storage :** Cloudflare R2 (max 5 photos par produit)
- **Paiement :** Stripe Checkout intégré (modal)

Chaque instance a son propre `.env` qui configure automatiquement :
- Nom du commerce
- Couleurs du thème
- Database MongoDB (isolée)
- Numéro Twilio
- Compte Stripe

Voir `claude.md` pour la documentation complète.

---

## 🔧 Scripts npm

```bash
npm run dev              # Lance backend + frontend en parallèle
npm run dev:backend      # Lance uniquement le backend (port 3000)
npm run dev:frontend     # Lance uniquement le frontend (port 5173)
npm run build            # Build frontend pour production
npm start                # Lance backend en production
```

---

## 📱 Fonctionnalités

### Commerçant
- Créer des templates de produits avec **jusqu'à 5 photos**
- Lancer des liquidations avec quantité définie
- Envoi SMS automatique aux abonnés
- Dashboard avec stats en temps réel

### Client
- Reçoit SMS avec lien vers page produit
- **Carousel de photos** (navigation flèches + bullets)
- Paiement **dans l'app** via Stripe Checkout
- Reçoit code pickup par SMS après paiement

---

## 🌐 Déploiement Production

### Vercel (1 instance = 1 commerce)

1. Créer un nouveau projet Vercel
2. Connecter le repo Git
3. Ajouter les variables d'environnement (copie du `.env`)
4. Deploy !

### MongoDB Atlas

- Créer 1 database par commerce : `commerce-a`, `commerce-b`, etc.
- Whitelist les IPs Vercel (ou `0.0.0.0/0` pour dev)

### Cloudflare R2

- 1 bucket partagé pour tous les commerces
- Dossiers automatiquement séparés par timestamp

### Stripe Webhooks

Endpoint : `https://commerce-a.vercel.app/api/webhooks/stripe`

Events :
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

---

## 🐛 Troubleshooting

**MongoDB connection error :**
```bash
# Vérifier que Docker tourne
docker ps

# Redémarrer MongoDB
docker-compose restart mongodb
```

**Redis connection error :**
```bash
# Redémarrer Redis
docker-compose restart redis
```

**Stripe webhook signature invalid :**
```bash
# Tester en local avec Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copier le whsec_... dans .env
```

---

## 📚 Documentation

Voir `claude.md` pour :
- Architecture détaillée
- Modèles de données
- API routes
- Flow utilisateur complet
- Points critiques (webhooks, stock, upload, etc.)

---

## 🤝 Support

Questions ? Ouvrez une issue ou consultez `claude.md`.
