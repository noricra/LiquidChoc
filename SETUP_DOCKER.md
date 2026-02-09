# Installation Docker - 2 Options

## Option 1 : Docker Desktop (Recommandé pour débuter)

### Installation
```bash
# Télécharger et installer Docker Desktop
open https://www.docker.com/products/docker-desktop

# OU avec Homebrew
brew install --cask docker
```

**Après installation :**
1. Ouvrir Docker Desktop (icône baleine)
2. Attendre que "Docker Desktop is running" apparaisse
3. Puis lancer :

```bash
# Lancer MongoDB + Redis
docker-compose up -d

# Vérifier
docker ps
```

---

## Option 2 : Homebrew (Plus rapide pour tester maintenant)

```bash
# Installer MongoDB
brew tap mongodb/brew
brew install mongodb-community@7
brew services start mongodb-community@7

# Installer Redis
brew install redis
brew services start redis

# Vérifier que ça tourne
brew services list
```

**Puis modifier .env :**
```env
# MongoDB local (sans auth)
MONGODB_URI=mongodb://localhost:27017/liquidchoc-dev

# Redis local
REDIS_URL=redis://localhost:6379
```

**Tester les connexions :**
```bash
# Test MongoDB
mongosh mongodb://localhost:27017/liquidchoc-dev

# Test Redis
redis-cli ping
# Devrait répondre : PONG
```

---

## Quelle option choisir ?

**Option 1 (Docker)** : Mieux pour production-like, isolé, facile à reset
**Option 2 (Homebrew)** : Plus rapide pour tester maintenant

**Recommandation :** Commencez par **Option 2** pour tester rapidement, puis passez à Docker plus tard.
