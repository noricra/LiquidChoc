# Avant le déploiement

---

## 1. Comptes à créer

- **MongoDB Atlas** — créer un cluster gratuit, copier l'URI (`mongodb+srv://...`)
- **Stripe** — créer un compte, aller dans Développeurs → Clés API, copier la clé secrète (`sk_live_...`)
- **Stripe webhook** — Développeurs → Webhooks → Créer endpoint avec l'URL Railway (`https://xxx.up.railway.app/webhook`), sélectionner `checkout.session.completed`, copier le signing secret (`whsec_...`)
- **Twilio** — créer un compte, copier Account SID + Auth Token
- **Twilio numéro** — acheter un numéro canadien (+1 514... ou autre)

---

## 2. Fichier `.env`

Copier `.env.example` → `.env`, remplir avec les valeurs réelles :

```
MONGODB_URI=mongodb+srv://...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15141234567
SETUP_SECRET=$(openssl rand -hex 32)   ← générer une fois, garder
PORT=3000
```

---

## 3. Bugs à corriger dans le code

| Fichier | Ligne | Problème | Fix |
|---|---|---|---|
| `src/main.jsx` | — | Le service worker n'est jamais enregistré → PWA ne s'installe pas | Ajouter `navigator.serviceWorker.register('/sw.js')` après le render |
| `src/components/Toast.jsx` | 19 | Classe `animate-bounce-once` n'existe pas dans Tailwind → animation silencieusement ignorée | Changer par `animate-bounce` ou supprimer la classe |
| `server.js` | 22 | `cors({ origin: true })` reflète toutes les origins | En prod : remplacer par `cors({ origin: process.env.FRONTEND_URL })` et ajouter `FRONTEND_URL` au `.env` |
| `server.js` | 82 | `mongoose.connect` sans timeout → hang si Atlas est down | Ajouter `{ serverSelectionTimeoutMS: 5000 }` |
| `server.js` | 161–163 | `merchant.templates.small?.toObject()` crash si template est `undefined` | Ajouter un fallback : `...(merchant.templates.small?.toObject() \|\| {})` |
| `server.js` | 410–413 | Stock épuisé dans le webhook → log warning mais pas de refund. Le client paie sans recevoir | Appeler `stripe.refunds.create({ payment_intent: session.payment_intent })` dans ce bloc |
| `package.json` | 10 | Script `start` = `node server.js` sans build préalable → `dist/` inexistant en prod | Changer en `"start": "npm run build && node server.js"` |
| Racine | — | Pas de `.gitignore` → `node_modules/` et `.env` risquent d'être committés | Créer `.gitignore` avec `node_modules/`, `.env`, `dist/` |

---

## 4. UX à améliorer

- **`src/App.jsx`** — `fetchMerchant()` seulement au mount initial. Les stats du Dashboard sont outdated après créer une liquidation. → Re-fetch à chaque retour sur `/`
- **Route 404** — une URL inconnue affiche une page blanche. → Ajouter un `<Route path="*">` avec un composant simple
- **`src/pages/Subscribe.jsx`** — pas de validation du format téléphone avant le POST. → Vérifier au minimum 10 chiffres client-side avant d'appeler l'API
- **`src/pages/Subscribers.jsx`** — le QR code est chargé via CDN jsdelivr. Si le CDN tombe, pas de QR. → Remplacer par `npm install qrcode-generator` et un import direct
- **SMS avec emojis** (`🔥🏷️📦👉⏱️📍`) — certains carriers les garblent. Tester avec les 3 carriers canadiens (Bell, Telus, Rogers) avant le launch. Si problème, retirer les emojis des SMS broadcast + confirmation

---

## 5. Déploiement Railway

- Créer un projet Railway, connecter le repo Git
- **Build command :** `npm install`
- **Start command :** `npm run build && node server.js` (ou changer le script `start` dans package.json)
- Ajouter toutes les variables d'env (même chose que `.env`)
- Obtenir l'URL du domaine → mettre à jour `FRONTEND_URL` dans les vars Railway
- Mettre à jour le webhook Stripe avec cette même URL

---

## 6. Init après déploiement — une seule fois

```bash
curl -X POST https://VOTRE-URL.up.railway.app/api/setup \
  -H "Authorization: Bearer VOTRE_SETUP_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Nom du Commerce","address":"123 Rue Example, Montréal"}'
```

Après ça, `/api/setup` retourne 400 pour toujours. Route verrouillée.

---

## 7. Test local avant deploy

```bash
npm install
npm run dev

# Stripe CLI dans un autre terminal :
stripe login
stripe listen --forward-to localhost:3000/webhook

# Init le merchant :
curl -X POST http://localhost:3000/api/setup \
  -H "Authorization: Bearer $(grep SETUP_SECRET .env | cut -d= -f2)" \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Test Commerce","address":"123 Rue Test"}'
```

---

## 8. Nettoyage optionnel

- Les `console.log` / `console.error` dans `server.js` → conditionner sur `process.env.NODE_ENV !== 'production'` ou garder (Railway les capture dans les logs)
- `postcss.config.js` et `tailwind.config.js` utilisent `export default` mais le projet est CJS (`require` dans server.js). Ça marche mais génère un warning au build. Fix : renommer en `.mjs`
- `module.exports = { app, Merchant }` dans server.js → inutile en prod, aucun impact

---

## 9. Ce qu'il faut connaître pour debugger

### MongoDB — paradigme choc (comme SQLite → Postgres pour toi)

Tu connais SQL : tables séparées, JOINs. MongoDB c'est l'inverse. Ici tout est dans **un seul document**. `subscribers`, `liquidations`, `sales` sont des tableaux **à l'intérieur** du doc Merchant. Pas de JOIN, pas de requête séparée.

```
Postgres/SQLite          →    MongoDB (ici)
─────────────────────────────────────────────
SELECT * FROM sales      →    merchant.sales
  WHERE merchant_id = X        (déjà dans le doc)

sales.find(id)           →    merchant.sales.id(id)
                               ↑ méthode Mongoose spéciale

DELETE FROM sales        →    merchant.sales.pull({ _id: id })
  WHERE id = X                 await merchant.save()
                               ↑ TOUJOURS sauvegarder le parent

INSERT INTO sales        →    merchant.sales.push({ ... })
                               await merchant.save()
```

Pièges classiques :
- Tu modifie un subdoc mais tu oublies `merchant.save()` → rien n'est sauvegardé
- Tu cherche un subdoc avec `.find()` → ça retourne un tableau, pas un doc unique. Utilise `.id()`
- Atlas MongoDB a une limite de 16 MB par document. Si un merchant accumule des milliers de sales → problème. Pour un MVP c'est fine (plusieurs centaines de ventes avant d'atteindre la limite)

Pour explorer la DB en direct : télécharge **MongoDB Compass** (GUI gratuit). Connecte avec ton URI Atlas. Tu vois tout visuellement comme pgAdmin pour Postgres.

---

### Express middleware — l'ordre ça compte

```js
// ✅ CET ORDRE EST CRITIQUE
app.use('/webhook', express.raw({ type: 'application/json' }))  // ← AVANT
app.use(express.json())                                          // ← APRÈS
```

Si tu inverse ces deux lignes, le webhook Stripe reçoit un objet JSON déjà parsé au lieu d'un Buffer. La vérification de signature (`constructEvent`) échoue avec une erreur cryptique. Le symptôme : `"invalid signature"` même si ta clé `whsec_` est correcte.

Même raisonnement que ton IPN NowPayments — le body doit être raw pour la signature.

---

### Stripe webhook — comment debugger

En dev, Stripe ne peut pas atteindre localhost. Tu dois utiliser **Stripe CLI** :

```bash
stripe listen --forward-to localhost:3000/webhook
```

Ça te donne un `whsec_` temporaire à mettre dans ton `.env` (différent du whsec prod). Si un webhook échoue :

1. Stripe Dashboard → Développeurs → Webhooks → clic sur ton endpoint → onglet "Tentatives"
2. Tu vois chaque event, le HTTP status code que ton serveur a retourné, et le body
3. Tu peux re-envoyer un event depuis là

En prod sur Railway : tes `console.log` dans le webhook apparaissent dans les Railway Logs. C'est le seul endroit où tu vois ce qui se passe.

---

### Async fire & forget — le SMS broadcast

Le broadcast envoie la réponse HTTP immédiatement, puis continue à envoyer les SMS en background dans la même requête Node.js. **Pas de queue, pas de retry.**

Si Railway redémarre le serveur au milieu d'un broadcast → les SMS restants ne sont jamais envoyés. Personne ne sera averti.

Pour debugger : le `console.log` à la fin (`SMS broadcast done : X/Y envoyés`) te dit combien ont réussi. Si X < Y, les erreurs sont loggées ligne par ligne juste au-dessus.

Pour fixer (plus tard, pas urgent pour MVP) : remplacer par une vraie queue comme **Bull** avec Redis, ou utiliser un service comme **Resend** / **SendGrid** qui gère le retry.

---

### Vite proxy vs prod — "ça marche en dev mais pas en prod"

En dev (`npm run dev`) : Vite tourne sur le port 5173. Quand le frontend appelle `/api/merchant`, Vite **proxy** la requête vers `localhost:3000` (Express). Les deux serveurs sont séparés.

En prod (`node server.js`) : il n'y a qu'Express. Il sert le `dist/` statique ET les routes `/api`. Un seul serveur, un seul port.

Si quelque chose marche en dev mais pas en prod :
- Vérifie que la route API existe vraiment dans `server.js`
- Vérifie que `dist/` a été buildé (si tu changeas du code frontend sans re-faire `npm run build`, l'ancienne version est servie)

---

### Zustand — données stales dans l'UI

Le store `useMerchantStore` fetche les données une seule fois au mount de l'app. Si tu crées une liquidation puis tu retournes sur le Dashboard, les stats sont **pas à jour** parce que le store n'a pas re-fetché.

Symptôme : "j'ai créé une liquidation mais le compteur montre encore 0"

Fix : appeler `fetchMerchant()` dans un `useEffect` de chaque page qui a besoin de données fraîches, pas seulement dans `App.jsx`.

---

### MongoDB Atlas — connexion qui échoue en prod

Les 3 raisons classiques :

1. **IP whitelist** — Atlas bloque les connexions par défaut. Aller dans Atlas → Security → Network Access → ajouter `0.0.0.0/0` (autorise toutes les IPs). En prod Railway les IPs changent donc c'est le seul moyen simple.
2. **URI mal copiée** — un caractère spécial dans le mot de passe casse l'URI. Encoder le mot de passe en URL-encode si nécessaire.
3. **Timeout** — si Atlas est loin ou slow, `mongoose.connect` hang indéfiniment sans les options de timeout. D'où le `serverSelectionTimeoutMS: 5000` dans les bugs à corriger.

---

### PWA sur iOS — c'est une autre histoire

Chrome/Android : le navigateur envoie un event `beforeinstallprompt` automatiquement. Tu catches l'event, tu montres un bouton, c'est fait.

Safari/iOS : **aucun event**. Le seul moyen d'installer est que l'utilisateur tasse manuellement "Partager → Sur l'écran d'accueil". C'est pourquoi `InstallPrompt.jsx` détecte le user-agent iOS et affiche les instructions en 2 étapes.

Pour tester sur iOS en dev : connecte ton iPhone au même réseau WiFi, ouvre Safari, tape `http://192.168.x.x:5173`. Le service worker et le manifest doivent être accessibles sur HTTPS en prod (Railway le fait automatiquement) — en local sur HTTP ça n'installe pas.
