# ✅ Checklist Test Complet - LiquidaChoc

## 🎯 Objectif : Tester le flow complet de A à Z

```
Commerçant crée produit → Lance liquidation → Client reçoit SMS →
Client voit page produit → Paie → Reçoit code pickup
```

---

## 1️⃣ Setup initial (À FAIRE MAINTENANT)

### ✅ Backend démarré
- [x] MongoDB connecté
- [x] Redis connecté
- [x] Stripe configuré
- [x] Twilio configuré
- [x] Server running sur port 3000

### ❌ Créer le premier Merchant dans la DB

**Option A : Via endpoint setup (recommandé)**
```bash
# Créer le merchant initial
curl -X POST http://localhost:3000/api/setup \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "dev_secret",
    "businessName": "Test Restaurant",
    "address": "123 Rue Test, Montréal",
    "phone": "+15141234567",
    "pickupHours": "18h-20h"
  }'
```

**Option B : Via MongoDB directement**
```bash
mongosh "mongodb+srv://..." testdev

db.merchants.insertOne({
  businessName: "Test Restaurant",
  address: "123 Rue Test, Montréal",
  phone: "+15141234567",
  pickupHours: "18h-20h",
  description: "Restaurant de test",
  profileImageUrl: "",
  primaryColor: "#FF6B35",
  themeMode: "dark",
  templates: [],
  subscribers: [],
  liquidations: [],
  sales: [],
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### ❌ Lancer le Frontend
```bash
# Dans un nouveau terminal
npm run dev:frontend

# Ouvrir http://localhost:5173
```

---

## 2️⃣ Test du flow commerçant (Frontend)

### Page `/catalogue` - Créer un template

- [ ] Ouvrir http://localhost:5173/catalogue
- [ ] Cliquer sur le bouton "+" (en bas à droite)
- [ ] **Uploader 5 photos** (tester carousel)
- [ ] Remplir :
  - Titre : "Croissants du matin"
  - Description : "Croissants frais de la veille"
  - Prix régulier : 25.00
  - Prix liquida : 12.50
- [ ] Cliquer "Ajouter au catalogue"
- [ ] Vérifier que le template apparaît avec la 1ère photo

### Lancer une liquidation

- [ ] Cliquer sur le template créé
- [ ] Modal s'ouvre → choisir quantité : 5
- [ ] Cliquer "Liquider"
- [ ] Vérifier console backend : SMS envoyés (ou erreur Twilio si pas d'abonnés)

---

## 3️⃣ Test du flow client (Page publique)

### Ajouter un abonné (pour recevoir SMS)

**Option A : Via QR code**
- [ ] Aller sur `/subscribe`
- [ ] Scanner le QR code avec téléphone
- [ ] Entrer votre vrai numéro (format: +15141234567)
- [ ] Soumettre

**Option B : Via curl**
```bash
curl -X POST http://localhost:3000/api/subscribers/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+15141234567",
    "name": "Test User"
  }'
```

### Tester la page produit publique

1. **Récupérer l'ID de la liquidation**
```bash
curl -s http://localhost:3000/api/liquidations | python3 -m json.tool
# Copier le _id d'une liquidation active
```

2. **Ouvrir la page produit**
```
http://localhost:5173/liquidation/{ID_COPIE}
```

3. **Vérifier l'affichage**
- [ ] Carousel avec 5 photos (flèches + bullets)
- [ ] Nom du produit
- [ ] Prix réduit + prix barré + badge réduction
- [ ] Description
- [ ] Adresse pickup
- [ ] Horaires pickup
- [ ] Stock restant
- [ ] Bouton "Payer — $12.50"

---

## 4️⃣ Test du paiement Stripe

### ⚠️ IMPORTANT : Mode test Stripe

Vous êtes en mode test (`pk_test_...`). Utilisez ces cartes de test :

**Carte qui fonctionne :**
- Numéro : `4242 4242 4242 4242`
- Date : n'importe quelle date future
- CVC : 123
- Code postal : 12345

**Carte qui échoue (pour tester erreurs) :**
- Numéro : `4000 0000 0000 0002`

### Flow de paiement

- [ ] Cliquer sur "Payer — $12.50"
- [ ] Modal Stripe s'ouvre (reste dans l'app)
- [ ] Remplir :
  - Email : test@test.com
  - Téléphone : +15141234567
  - Carte : 4242 4242 4242 4242
- [ ] Cliquer "Payer"
- [ ] **Redirection vers `/success`**
- [ ] Vérifier message de confirmation

### Vérifier le webhook

**Console backend doit afficher :**
```
Webhook received: checkout.session.completed
Sale created with pickup code: LQ-XXXX
SMS sent to +15141234567
```

**En base de données :**
```bash
# Vérifier que la sale a été créée
curl -s http://localhost:3000/api/sales | python3 -m json.tool
```

---

## 5️⃣ Test SMS (Twilio)

### ⚠️ Twilio en mode test

Avec les credentials actuels, Twilio est probablement en **mode Trial** :
- SMS envoyés uniquement aux numéros vérifiés
- Allez sur https://console.twilio.com/us1/develop/phone-numbers/manage/verified
- Ajoutez votre numéro de téléphone

### Vérifier les SMS envoyés

**2 SMS doivent être envoyés :**

1️⃣ **SMS de liquidation** (après création)
```
🔥 LIQUIDATION | Test Restaurant
Croissants du matin
🏷️ 12.5$ au lieu de 25$ (-50%)
📦 Stock: 5 disponibles
👉 http://localhost:5173/liquidation/abc123
⏱️ Valide aujourd'hui seulement
📍 Pickup: 123 Rue Test, Montréal - 18h-20h
STOP pour ne plus recevoir ces alertes
```

2️⃣ **SMS de confirmation** (après paiement)
```
✅ Paiement confirmé !
Votre code pickup : LQ-XXXX
📍 Test Restaurant - 123 Rue Test, Montréal
🕐 18h-20h
Valide 2h. Présentez ce code sur place.
```

---

## 6️⃣ Points bloquants possibles

### ❌ Pas de Stripe webhook en local

**Problème :** Le webhook Stripe ne peut pas atteindre localhost

**Solution :** Utiliser Stripe CLI
```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Écouter les webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copier le webhook secret (whsec_...)
# Le mettre dans .env → STRIPE_WEBHOOK_SECRET
```

### ❌ Upload R2 échoue

**Problème :** Credentials R2 invalides

**Solution temporaire :** Désactiver upload ou utiliser URLs de test
```js
// Dans TemplateForm.jsx, remplacer l'upload par :
const uploaded = [
  'https://via.placeholder.com/800x600/FF6B35/FFFFFF?text=Photo+1',
  'https://via.placeholder.com/800x600/004E89/FFFFFF?text=Photo+2'
]
```

### ❌ SMS Twilio échouent

**Problème :** Numéro non vérifié en mode Trial

**Solutions :**
1. Ajouter votre numéro sur console.twilio.com
2. OU ignorer les SMS et tester uniquement le flow paiement

---

## 7️⃣ Checklist finale (Test 100% complet)

- [ ] Backend démarré (MongoDB + Redis + Stripe + Twilio)
- [ ] Frontend démarré (port 5173)
- [ ] Merchant créé en DB
- [ ] Template créé avec 5 photos
- [ ] Liquidation lancée
- [ ] Abonné ajouté
- [ ] SMS de liquidation reçu (ou ignoré si Twilio Trial)
- [ ] Page produit `/liquidation/:id` affichée avec carousel
- [ ] Paiement Stripe complété (carte test)
- [ ] Redirection vers `/success`
- [ ] Sale créée en DB avec pickupCode
- [ ] SMS de confirmation reçu (ou ignoré)
- [ ] Dashboard `/` affiche les stats à jour

---

## 🎉 Résultat attendu

Si tout fonctionne :

1. Le **commerçant** voit :
   - Son catalogue de produits
   - Les liquidations actives
   - Les ventes avec codes pickup
   - Stats en temps réel

2. Le **client** voit :
   - Page produit magnifique avec carousel
   - Paiement fluide dans l'app
   - Confirmation immédiate
   - SMS avec code pickup

3. **En base de données** :
   - 1 Merchant
   - N Templates
   - N Liquidations
   - N Sales avec pickupCodes
   - N Subscribers

---

## 🐛 Debug

Si quelque chose ne marche pas :

```bash
# Logs backend
# Terminal où tourne npm run dev:backend

# Logs MongoDB
mongosh "mongodb+srv://..." testdev
db.merchants.findOne()
db.merchants.findOne().templates
db.merchants.findOne().sales

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/merchant
curl http://localhost:3000/api/liquidations
curl http://localhost:3000/api/sales
```
