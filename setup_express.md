# Setup Express - Déploiement en 15 minutes chrono

## ⏱️ TIMELINE

```
Minute 0-5   : Setup local + MongoDB Atlas
Minute 5-8   : Test local (localhost)
Minute 8-13  : Déploiement Railway
Minute 13-15 : Configuration webhooks Stripe
```

**TOTAL : 15 MINUTES**

---

## 📦 ÉTAPE 1 : SETUP LOCAL (5 min)

### **1.1 Créer projet (1 min)**

```bash
# Créer dossier
mkdir liquidachoc-mvp
cd liquidachoc-mvp

# Init npm
npm init -y

# Installer dépendances (toutes d'un coup)
npm install express mongoose cors stripe twilio dotenv

# Installer nodemon (dev only)
npm install --save-dev nodemon
```

---

### **1.2 Créer fichiers (2 min)**

**Copier-coller server.js depuis `app_commando.md`** :

```bash
# Créer fichier server.js
touch server.js

# Ouvrir avec VS Code (ou nano)
code server.js

# Copier-coller tout le contenu de app_commando.md (section Backend)
# Sauvegarder (Cmd+S)
```

**Copier-coller index.html depuis `app_commando.md`** :

```bash
# Créer fichier index.html
touch index.html

# Ouvrir
code index.html

# Copier-coller tout le contenu de app_commando.md (section Frontend)
# Sauvegarder
```

**Créer .env** :

```bash
touch .env
code .env
```

Contenu (à remplir étape suivante) :

```bash
# MongoDB
MONGODB_URI=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Server
PORT=3000
```

---

### **1.3 Setup MongoDB Atlas (2 min)**

**Option A : Si vous avez déjà un compte MongoDB Atlas**

1. Aller sur https://cloud.mongodb.com
2. Créer nouveau cluster (FREE tier M0)
3. Créer database user (username + password)
4. Whitelist IP : 0.0.0.0/0 (autoriser toutes IPs)
5. Copier connection string :
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/liquidachoc
   ```
6. Coller dans `.env` → `MONGODB_URI=...`

**Option B : Si pas de compte MongoDB** (skip pour l'instant, utiliser local)

```bash
# Installer MongoDB local (Mac)
brew tap mongodb/brew
brew install mongodb-community

# Démarrer MongoDB local
brew services start mongodb-community

# Mettre dans .env
MONGODB_URI=mongodb://localhost:27017/liquidachoc
```

---

### **1.4 Setup Stripe Test Keys (30 sec)**

1. Aller sur https://dashboard.stripe.com/test/apikeys
2. Copier **Secret key** (commence par `sk_test_...`)
3. Coller dans `.env` → `STRIPE_SECRET_KEY=sk_test_...`

**Note** : On configure le webhook secret plus tard (après déploiement).

---

### **1.5 Setup Twilio Trial (1 min 30)**

1. Aller sur https://www.twilio.com/try-twilio (créer compte gratuit)
2. Vérifier votre numéro de téléphone (SMS de confirmation)
3. Obtenir 15$ de crédit gratuit
4. Aller sur Console → Account Info :
   - Copier **Account SID** → `.env` → `TWILIO_ACCOUNT_SID=ACxxx`
   - Copier **Auth Token** → `.env` → `TWILIO_AUTH_TOKEN=xxx`
5. Aller sur Phone Numbers → Get a number :
   - Choisir un numéro canadien (+1 581 ou +1 418)
   - Copier le numéro → `.env` → `TWILIO_PHONE_NUMBER=+15819999999`

**IMPORTANT** : En mode Trial, Twilio envoie SMS qu'aux numéros vérifiés. Ajouter votre numéro :
- Console → Verified Caller IDs → Add (+1 votre numéro)
- Confirmer par SMS

---

## 🧪 ÉTAPE 2 : TEST LOCAL (3 min)

### **2.1 Démarrer serveur (10 sec)**

```bash
# Démarrer
npm start

# Ou avec nodemon (auto-reload)
npx nodemon server.js
```

**Vérifier logs** :
```
✅ MongoDB connected
🚀 Server running on http://localhost:3000
```

Si erreur MongoDB → Vérifier connection string dans `.env`.

---

### **2.2 Créer merchant test (1 min)**

**Ouvrir Postman (ou curl)** :

```bash
# Via curl (terminal)
curl -X POST http://localhost:3000/api/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "businessName": "Sushi Test",
    "phone": "+15811234567",
    "address": "123 Rue Racine E, Chicoutimi"
  }'
```

**Réponse attendue** :
```json
{
  "message": "Merchant created",
  "merchantId": "65f8a9b..."
}
```

**Copier le merchantId** (vous en aurez besoin).

---

### **2.3 Tester frontend (1 min)**

1. Ouvrir navigateur : http://localhost:3000
2. Login avec :
   - Email : `test@example.com`
   - Password : `password123`
3. Vérifier que le dashboard s'affiche
4. Cliquer sur "Moyen lot"
5. **NE PAS envoyer SMS encore** (pas d'abonnés)

**Si ça marche** : ✅ Backend + Frontend OK

**Si erreur** :
- Vérifier que server.js tourne
- Vérifier console navigateur (F12)
- Vérifier logs terminal

---

### **2.4 Ajouter abonné test (1 min)**

```bash
# Remplacer MERCHANT_ID par celui copié plus haut
# Remplacer PHONE par votre numéro (format +1XXXXXXXXXX)

curl -X POST http://localhost:3000/api/subscribers \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "MERCHANT_ID",
    "phone": "+15141234567",
    "name": "Test User"
  }'
```

**Vérifier SMS de bienvenue reçu** sur votre téléphone.

**Si pas reçu** :
- Vérifier que le numéro est vérifié sur Twilio (Verified Caller IDs)
- Vérifier format numéro (+1 obligatoire)
- Vérifier logs terminal (erreur Twilio ?)

---

## 🚀 ÉTAPE 3 : DÉPLOIEMENT RAILWAY (5 min)

### **3.1 Installer Railway CLI (1 min)**

```bash
# Mac/Linux
npm install -g @railway/cli

# Ou avec Homebrew (Mac)
brew install railway
```

**Vérifier installation** :
```bash
railway --version
```

---

### **3.2 Login Railway (30 sec)**

```bash
railway login
```

**Ouvre navigateur** → Connecter avec GitHub ou email.

**Confirmation terminal** : "Logged in as [votre email]"

---

### **3.3 Créer projet (1 min)**

```bash
# Init projet Railway
railway init

# Choisir :
# - "Create new project" (ou lier un existant)
# - Nom : "liquidachoc-mvp"
```

---

### **3.4 Ajouter variables d'environnement (2 min)**

**Copier-coller chaque variable depuis .env** :

```bash
# MongoDB
railway variables set MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/liquidachoc"

# Stripe
railway variables set STRIPE_SECRET_KEY="sk_test_xxx"

# Twilio
railway variables set TWILIO_ACCOUNT_SID="ACxxx"
railway variables set TWILIO_AUTH_TOKEN="xxx"
railway variables set TWILIO_PHONE_NUMBER="+15819999999"

# Port (Railway l'attribue automatiquement)
railway variables set PORT="3000"
```

**Note** : Webhook secret Stripe sera ajouté après (Étape 4).

---

### **3.5 Déployer (1 min 30)**

```bash
# Deploy
railway up

# Attendre 30-60 secondes (build + deploy)
```

**Vérifier déploiement** :
```bash
railway status
```

**Output attendu** :
```
✅ Service: liquidachoc-mvp
✅ Status: Running
✅ URL: https://liquidachoc-mvp-production.up.railway.app
```

**Copier l'URL** (vous en aurez besoin).

---

### **3.6 Tester en production (30 sec)**

**Ouvrir URL dans navigateur** :
```
https://liquidachoc-mvp-production.up.railway.app
```

**Login avec les mêmes credentials** :
- Email : `test@example.com`
- Password : `password123`

**Si ça marche** : ✅ Déploiement réussi !

**Si erreur 503/504** :
- Attendre 1-2 minutes (cold start)
- Vérifier logs : `railway logs`
- Vérifier variables : `railway variables`

---

## 🔗 ÉTAPE 4 : CONFIGURATION WEBHOOKS STRIPE (2 min)

### **4.1 Créer endpoint webhook (1 min)**

1. Aller sur https://dashboard.stripe.com/test/webhooks
2. Cliquer "Add endpoint"
3. URL : `https://VOTRE-URL-RAILWAY.up.railway.app/webhook`
   - Exemple : `https://liquidachoc-mvp-production.up.railway.app/webhook`
4. Events to send :
   - Cocher `checkout.session.completed`
   - (Optionnel : `payment_intent.succeeded`, `payment_intent.payment_failed`)
5. Cliquer "Add endpoint"

---

### **4.2 Copier Webhook Secret (1 min)**

1. Cliquer sur l'endpoint créé
2. Section "Signing secret" → Cliquer "Reveal"
3. Copier le secret (commence par `whsec_...`)

**Ajouter à Railway** :

```bash
railway variables set STRIPE_WEBHOOK_SECRET="whsec_xxx"
```

**Redémarrer service** (pour prendre en compte la variable) :

```bash
railway restart
```

---

### **4.3 Tester webhook (optionnel, 1 min)**

**Via Stripe CLI (test local)** :

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks vers Railway
stripe listen --forward-to https://VOTRE-URL-RAILWAY.up.railway.app/webhook
```

**Trigger test event** :
```bash
stripe trigger checkout.session.completed
```

**Vérifier logs Railway** :
```bash
railway logs
```

**Devrait voir** : `✅ Sale created: LQ-XXXX`

---

## ✅ ÉTAPE 5 : VALIDATION FINALE (30 sec)

**Checklist complète** :

- [ ] MongoDB connecté (logs "✅ MongoDB connected")
- [ ] Stripe keys configurées
- [ ] Twilio configuré (SMS de bienvenue reçu)
- [ ] Frontend accessible sur Railway URL
- [ ] Login fonctionne
- [ ] Webhook Stripe configuré
- [ ] Test end-to-end : Créer liquidation → Envoyer SMS → Payer (Stripe test card) → Vente apparaît

**Test end-to-end rapide** :

1. Login dashboard
2. Cliquer "Moyen lot"
3. Confirmer envoi SMS
4. Vérifier SMS reçu
5. Cliquer lien dans SMS → Page Stripe
6. Payer avec carte test : `4242 4242 4242 4242` (date future + CVC 123)
7. Retour dashboard → Vérifier vente dans liste

**Si 7/7 = 🎉 MVP DÉPLOYÉ ET FONCTIONNEL !**

---

## 🔧 TROUBLESHOOTING

### **Erreur : "MONGODB_URI is required"**

**Solution** :
```bash
# Vérifier variables Railway
railway variables

# Ajouter si manquante
railway variables set MONGODB_URI="..."
railway restart
```

---

### **Erreur : SMS non envoyé (Twilio 400)**

**Causes probables** :
1. Numéro non vérifié (Twilio trial) → Ajouter dans Verified Caller IDs
2. Format incorrect → Doit être +1XXXXXXXXXX (pas d'espaces)
3. Crédit épuisé → Vérifier Console Twilio (15$ gratuit normalement)

**Solution** :
```bash
# Vérifier logs
railway logs | grep "SMS"

# Test manuel avec curl
curl -X POST https://api.twilio.com/2010-04-01/Accounts/ACxxx/Messages.json \
  --data-urlencode "Body=Test" \
  --data-urlencode "From=+15819999999" \
  --data-urlencode "To=+15141234567" \
  -u ACxxx:your_auth_token
```

---

### **Erreur : Webhook Stripe timeout**

**Causes** :
1. Webhook secret incorrect → Vérifier `STRIPE_WEBHOOK_SECRET`
2. Railway service sleep (cold start) → Attendre 30 sec
3. MongoDB query lente → Vérifier index

**Solution** :
```bash
# Tester webhook avec Stripe CLI
stripe trigger checkout.session.completed

# Vérifier logs
railway logs --tail
```

---

### **Erreur : CORS (frontend ne peut pas appeler API)**

**Si frontend sur Vercel et backend sur Railway** :

**Modifier server.js** (ligne ~13) :

```javascript
app.use(cors({
  origin: '*', // Autoriser toutes origines (dev only)
  // En prod : origin: 'https://votre-frontend.vercel.app'
}));
```

**Redeploy** :
```bash
railway up
```

---

## 🎯 COMMANDES UTILES POST-DÉPLOIEMENT

### **Voir logs en temps réel**
```bash
railway logs --tail
```

### **Restart service**
```bash
railway restart
```

### **Lister variables**
```bash
railway variables
```

### **Supprimer variable**
```bash
railway variables delete VARIABLE_NAME
```

### **Ouvrir dashboard Railway**
```bash
railway open
```

### **Lier à un nouveau projet**
```bash
railway link
```

### **Rollback déploiement**
```bash
railway rollback
```

---

## 📝 MODIFICATION DU CODE EN PROD

**Workflow rapide** :

1. **Modifier code localement** (server.js ou index.html)
2. **Test local** : `npm start`
3. **Deploy** : `railway up`
4. **Vérifier** : Ouvrir URL Railway

**Temps total** : < 2 minutes par changement.

---

## 🚀 NEXT STEPS APRÈS DÉPLOIEMENT

### **1. Changer URL frontend dans index.html**

**Ligne 93 de index.html** :

```javascript
// AVANT
const API_URL = 'http://localhost:3000/api';

// APRÈS
const API_URL = 'https://VOTRE-URL-RAILWAY.up.railway.app/api';
```

**Redéployer** :
```bash
railway up
```

---

### **2. Créer merchant pour client réel**

```bash
curl -X POST https://VOTRE-URL-RAILWAY.up.railway.app/api/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "MotDePasseTemporaire123",
    "businessName": "Sushi Express",
    "phone": "+15811234567",
    "address": "123 Rue Racine E, Chicoutimi"
  }'
```

**Donner au client** :
- URL : `https://VOTRE-URL-RAILWAY.up.railway.app`
- Email : `client@example.com`
- Password : `MotDePasseTemporaire123` (lui dire de le changer)

---

### **3. Page d'inscription publique (optionnel)**

**Créer `subscribe.html`** (pour QR Code) :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inscrivez-vous aux alertes</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center p-4">
  <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
    <h1 class="text-2xl font-bold text-orange-600 mb-4">🔥 Alertes Liquidation</h1>
    <p class="text-gray-600 mb-6">Recevez des deals exclusifs par SMS</p>

    <input type="text" id="name" placeholder="Votre nom" class="w-full px-4 py-2 border rounded mb-4" />
    <input type="tel" id="phone" placeholder="Téléphone (+1...)" class="w-full px-4 py-2 border rounded mb-6" />

    <button onclick="subscribe()" class="w-full bg-orange-500 text-white py-3 rounded font-bold">
      S'inscrire
    </button>

    <p id="message" class="mt-4 text-sm"></p>
  </div>

  <script>
    const merchantId = 'MERCHANT_ID_ICI'; // À remplir

    async function subscribe() {
      const name = document.getElementById('name').value;
      const phone = document.getElementById('phone').value;

      if (!name || !phone) {
        alert('Remplissez tous les champs');
        return;
      }

      try {
        const res = await fetch('https://VOTRE-URL/api/subscribers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId, phone, name })
        });

        if (res.ok) {
          document.getElementById('message').textContent = '✅ Inscrit ! Vous recevrez un SMS de confirmation.';
          document.getElementById('message').className = 'mt-4 text-sm text-green-600';
        } else {
          const data = await res.json();
          document.getElementById('message').textContent = '❌ ' + data.error;
          document.getElementById('message').className = 'mt-4 text-sm text-red-600';
        }
      } catch (error) {
        alert('Erreur : ' + error.message);
      }
    }
  </script>
</body>
</html>
```

**Générer QR Code** (vers `https://VOTRE-URL/subscribe.html`) avec QR Code Generator.

---

## 📊 MONITORING (OPTIONNEL)

### **Ajouter Sentry (erreurs en prod)**

```bash
npm install @sentry/node
```

**Dans server.js (ligne 1)** :

```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: 'https://xxx@sentry.io/xxx',
  environment: process.env.NODE_ENV || 'production'
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Créer compte gratuit** : https://sentry.io (5k events/mois gratuit)

---

## ✅ RÉSUMÉ : 5 COMMANDES CRITIQUES

```bash
# 1. Installer dépendances
npm install express mongoose cors stripe twilio dotenv

# 2. Créer merchant test
curl -X POST http://localhost:3000/api/setup -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123","businessName":"Test","phone":"+1581","address":"123 Rue"}'

# 3. Déployer sur Railway
railway up

# 4. Ajouter webhook secret Stripe
railway variables set STRIPE_WEBHOOK_SECRET="whsec_xxx"

# 5. Voir logs en prod
railway logs --tail
```

---

## 🎉 FÉLICITATIONS !

**Si vous êtes arrivés ici, vous avez** :
- ✅ Un MVP fonctionnel en production
- ✅ URL publique (à donner aux clients)
- ✅ Backend + Frontend déployés
- ✅ Webhooks Stripe configurés
- ✅ SMS Twilio opérationnels

**Temps total** : < 15 minutes

**Next step** : Lire `prospects_chicoutimi.md` et aller pitcher demain ! 🚀
