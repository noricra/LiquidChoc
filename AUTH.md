# AUTH.md — Système d'authentification LiquidaChoc

## Vue d'ensemble

LiquidaChoc utilise **deux systèmes d'authentification** distincts :

1. **SETUP_SECRET** — Onboarding initial (une seule fois)
2. **ADMIN_PASSWORD** — Accès quotidien au dashboard admin

---

## 1. SETUP_SECRET — Onboarding initial

### Objectif
Protéger la création du merchant lors du **premier déploiement**. Empêche qu'un tiers crée le merchant avant le commerçant légitime.

### Quand est-il utilisé ?
**UNE SEULE FOIS**, lors de la première initialisation de l'instance :

```bash
POST /api/setup
Authorization: Bearer <SETUP_SECRET>

Body:
{
  "businessName": "Ma Pâtisserie",
  "address": "123 Rue Principale",
  "phone": "+15141234567",
  "pickupHours": "18h-20h"
}
```

### Flow complet

1. **Déploiement Railway** : Instance vide (DB vide, pas de merchant)
2. **Premier accès** : Admin appelle `/api/setup` avec `SETUP_SECRET` dans header
3. **Création merchant** : Document `Merchant` créé dans MongoDB
4. **Après setup** : Route `/api/setup` refuse toute nouvelle création (`Merchant already exists`)

### Configuration
```bash
SETUP_SECRET=random_secret_for_onboarding_98x7h3k2
```

### Comment utiliser /setup (étape par étape)

#### Étape 1 : Déploiement Railway
Tu viens de déployer ton instance sur Railway. L'app tourne mais la DB MongoDB est vide (pas de merchant).

#### Étape 2 : Récupérer SETUP_SECRET
Va dans Railway → Variables → copie la valeur de `SETUP_SECRET`

#### Étape 3 : Appeler /setup avec curl

Ouvre ton terminal et exécute :

```bash
curl -X POST https://ton-commerce.railway.app/api/setup \
  -H "Authorization: Bearer random_secret_for_onboarding_98x7h3k2" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "La Pâtisserie du Coin",
    "address": "123 Rue Principale, Montréal",
    "phone": "+15141234567",
    "pickupHours": "18h-20h tous les jours"
  }'
```

**Réponse attendue** :
```json
{
  "merchant": {
    "_id": "...",
    "businessName": "La Pâtisserie du Coin",
    "address": "123 Rue Principale, Montréal",
    "primaryColor": "#FF6B35",
    "themeMode": "dark"
  }
}
```

#### Étape 4 : Vérifier que ça fonctionne
Visite `https://ton-commerce.railway.app/login` → entre `ADMIN_PASSWORD` → tu dois voir le dashboard avec les infos du merchant.

#### Alternative : Utiliser Postman

1. Ouvre Postman
2. Crée une nouvelle requête `POST`
3. URL : `https://ton-commerce.railway.app/api/setup`
4. Headers :
   - `Authorization: Bearer random_secret_for_onboarding_98x7h3k2`
   - `Content-Type: application/json`
5. Body (raw JSON) :
   ```json
   {
     "businessName": "La Pâtisserie du Coin",
     "address": "123 Rue Principale, Montréal",
     "phone": "+15141234567",
     "pickupHours": "18h-20h tous les jours"
   }
   ```
6. Send

#### Que se passe-t-il après setup ?

- Le merchant est créé dans MongoDB
- Si tu réessayes d'appeler `/api/setup` → erreur `400 Merchant already exists`
- `SETUP_SECRET` ne sert plus à rien (tu peux le garder ou le changer, peu importe)
- L'app est prête : tu peux te connecter avec `ADMIN_PASSWORD`

#### Valeurs par défaut

Si tu n'envoies pas de body, le backend utilise les valeurs du `.env` :

```bash
BUSINESS_NAME=La Pâtisserie du Coin
MERCHANT_ADDRESS=123 Rue Principale, Montréal
MERCHANT_PHONE=+15141234567
PICKUP_HOURS=18h-20h tous les jours
```

Donc tu peux aussi faire :

```bash
curl -X POST https://ton-commerce.railway.app/api/setup \
  -H "Authorization: Bearer random_secret_for_onboarding_98x7h3k2" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Et le merchant sera créé avec les valeurs du .env Railway.

### Sécurité
✅ **Secret partagé** : Seul le déployeur connaît ce secret
✅ **Usage unique** : Impossible de recréer un merchant
⚠️ **Pas de rotation** : Après setup, ce secret ne sert plus
⚠️ **Transmission** : Doit être transmis de manière sécurisée (Bitwarden, 1Password, Signal)

---

## 2. ADMIN_PASSWORD — Accès quotidien (système actuel)

### Objectif
Protéger l'accès au **dashboard admin** contre tout accès non autorisé.

### Flow

1. Commerçant visite `https://commerce1.railway.app/`
2. **Redirection automatique** → `/login` (car pas de token)
3. Entre `ADMIN_PASSWORD` dans formulaire
4. Backend vérifie : `password === process.env.ADMIN_PASSWORD`
5. Si OK : retourne `{ token: ADMIN_PASSWORD }`
6. Frontend stocke token dans **localStorage**
7. Toutes requêtes futures : header `Authorization: Bearer <token>`

### Routes protégées
- `/api/merchant` (GET, PUT)
- `/api/templates` (POST, DELETE)
- `/api/subscribers` (GET, DELETE)
- `/api/liquidations` (GET, POST, DELETE)
- `/api/sales` (GET)
- `/api/upload` (POST)

### Routes publiques
- `/api/login` (connexion)
- `/api/subscribers` (POST) — QR code signup
- `/api/liquidations/:id` (GET) — Page produit client
- `/api/create-checkout-session` (POST) — Paiement Stripe
- `/webhook` (POST) — Webhook Stripe

### Configuration
```bash
ADMIN_PASSWORD=mySecurePass123
```

### Sécurité

✅ **Persistant** : Token stocké dans `localStorage` → pas besoin de se reconnecter
✅ **Auto-logout** : 401 → supprime token + redirect `/login`
✅ **Simple** : Pas de JWT, pas d'expiration, pas de refresh

⚠️ **Vulnérabilités** :

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Password visible dans .env** | Admin Railway = accès total | Utiliser Railway Secret Management + limiter accès équipe |
| **Token = Password** | Vol de token = accès permanent | Acceptable pour single-tenant (1 commerce = 1 instance isolée) |
| **Pas d'expiration** | Token volé reste valide | Vider `localStorage` côté client ou changer `ADMIN_PASSWORD` |
| **HTTPS obligatoire** | HTTP = token interceptable | ✅ Railway force HTTPS automatiquement |
| **XSS** | Script malveillant peut voler token | ✅ React échappe HTML par défaut |

### Pourquoi ce design ?

**Contexte** : Architecture **single-tenant** (1 instance = 1 commerce)

- Pas besoin de multi-users (pas de roles Owner/Staff/Viewer)
- Pas besoin de JWT complexe avec refresh tokens
- Commerçant utilise toujours le **même appareil** (iPad en caisse)
- Token persistant = UX optimale (jamais de re-login)

---

## 3. Alternative : MAGIC LINK (ADMIN_TOKEN)

### Concept

Au lieu de taper un password, le commerçant reçoit un **lien unique** :

```
https://commerce1.railway.app/auth/f7d9a2b4-3c8e-4f1a-9b2d-6e5c8a7d4f3b
```

1 clic → authentifié à vie (token stocké dans `localStorage`)

### Flow proposé

1. **Configuration** :
   ```bash
   ADMIN_TOKEN=f7d9a2b4-3c8e-4f1a-9b2d-6e5c8a7d4f3b
   ```

2. **Route backend** :
   ```js
   router.get('/auth/:token', (req, res) => {
     if (req.params.token !== config.adminToken) {
       return res.status(403).send('Invalid link')
     }
     res.send(`
       <script>
         localStorage.setItem('token', '${config.adminToken}')
         window.location.href = '/'
       </script>
     `)
   })
   ```

3. **Transmission** :
   - Déployeur envoie lien via **Signal** ou **WhatsApp** (messages éphémères)
   - Commerçant clique 1 fois → authentifié pour toujours

### Avantages
✅ **Zéro friction** : Pas de password à retenir
✅ **Mobile-friendly** : QR code ou lien cliquable
✅ **Même sécurité** : Token = secret partagé

### Inconvénients
⚠️ **Lien interceptable** : Si transmis par email non chiffré
⚠️ **Pas de révocation** : Changer token nécessite redéploiement
⚠️ **Historique navigateur** : URL reste dans l'historique (contient le token)

### Comparaison

| Critère | ADMIN_PASSWORD | ADMIN_TOKEN (Magic Link) |
|---------|----------------|--------------------------|
| UX commerçant | Taper password 1 fois | Cliquer lien 1 fois |
| Sécurité transmission | Password par SMS/Signal | Lien par Signal (messages éphémères) |
| Rotation | Facile (var Railway) | Facile (var Railway) |
| Risque exposition | .env visible admin Railway | URL visible historique navigateur |
| Révocation | Changer var → logout auto | Changer var → logout auto |

**Recommandation** :

- **ADMIN_PASSWORD** si commerçant tech-savvy (peut taper password)
- **ADMIN_TOKEN** si commerçant non-tech (juste cliquer un lien)

---

## 4. Sécurité globale — Questions/Réponses

### Est-ce sécurisé pour production ?

**OUI**, pour le contexte single-tenant :

✅ **Isolation par instance** : Chaque commerce a sa propre instance Railway
✅ **HTTPS forcé** : Railway termine TLS automatiquement
✅ **Secrets isolés** : Variables Railway invisibles entre instances
✅ **DB isolée** : 1 database MongoDB par commerce

**Limites acceptables** :

⚠️ Token non expirant → Acceptable car commerçant utilise toujours même appareil
⚠️ Pas de 2FA → Overkill pour un commerce local avec 1-2 utilisateurs
⚠️ Token = password → Acceptable car single-tenant (pas de roles)

### Que se passe-t-il si le token est volé ?

**Scénario** : Attaquant obtient `ADMIN_PASSWORD` ou `ADMIN_TOKEN`

**Impact** :
- Accès total au dashboard admin de CE commerce uniquement
- Peut créer liquidations, voir ventes, gérer abonnés
- **NE PEUT PAS** :
  - Accéder à d'autres instances (isolation Railway)
  - Modifier Stripe (clés Stripe séparées)
  - Accéder à la DB directement (pas de credentials MongoDB exposées)

**Mitigation** :
1. Changer `ADMIN_PASSWORD` dans Railway
2. Toutes sessions existantes invalidées instantanément
3. Commerçant doit se re-logger

### Faut-il implémenter JWT avec refresh tokens ?

**NON**, car :

- **Single-tenant** : 1 instance = 1 seul "compte admin"
- **Même appareil** : Commerçant utilise toujours iPad en caisse
- **Complexité inutile** : JWT rotation = overhead sans bénéfice réel ici

**Quand JWT serait pertinent** :
- Multi-tenant (1 instance = 100 commerces)
- Roles (Owner, Manager, Staff)
- Accès depuis multiples appareils/navigateurs

### Comment revoquer l'accès immédiatement ?

**Méthode 1** : Changer `ADMIN_PASSWORD` dans Railway
→ Effet immédiat sur prochaine requête

**Méthode 2** : Commerçant vide `localStorage` côté client
→ Logout manuel

**Pas de besoin** :
- Pas de session côté serveur à invalider
- Pas de token blacklist nécessaire
- Architecture stateless = simple

---

## 5. Recommandations finales

### Pour déploiement production

1. **Utiliser ADMIN_TOKEN (Magic Link)** pour UX optimale
2. **Générer token fort** : `openssl rand -hex 32`
3. **Transmettre via Signal** (messages éphémères activés)
4. **Activer HTTPS** : ✅ Automatique sur Railway
5. **Limiter accès Railway** : Seul propriétaire a accès aux variables
6. **Monitoring** : Logger tentatives login échouées (TODO : implémenter rate limiting)

### Variables à configurer

```bash
# Onboarding (usage unique)
SETUP_SECRET=random_secret_123

# Accès quotidien (méthode 1 : password)
ADMIN_PASSWORD=mySecurePass123

# Accès quotidien (méthode 2 : magic link)
ADMIN_TOKEN=f7d9a2b4-3c8e-4f1a-9b2d-6e5c8a7d4f3b
```

### Migration ADMIN_PASSWORD → ADMIN_TOKEN

Si tu veux passer au Magic Link :

1. Ajouter variable `ADMIN_TOKEN` dans Railway
2. Ajouter route `GET /auth/:token` dans backend
3. Envoyer lien `https://commerce1.railway.app/auth/<ADMIN_TOKEN>` au commerçant
4. Supprimer `/login` page (optionnel, garder comme fallback)

---

## Conclusion

Le système actuel (**ADMIN_PASSWORD**) est **sécurisé pour production** dans le contexte single-tenant.

**Magic Link** (**ADMIN_TOKEN**) offre une **meilleure UX** sans compromettre la sécurité.

Les deux approches reposent sur un **secret partagé** stocké dans Railway et transmis de manière sécurisée au commerçant.

Pour un commerce local avec 1-2 utilisateurs sur le même appareil, ce design est **adapté, simple et maintenable**.
