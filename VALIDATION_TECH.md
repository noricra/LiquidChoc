# Architecture Technique - LiquidaChoc

## 🎯 Concept Core

**SaaS de liquidation d'invendus via SMS**
- Architecture : Multi-tenant single-tenant (1 instance = 1 commerce)
- Backend Caméléon : Même code, comportement adapté via `.env`
- 3 secteurs : Food, Games, Services

## 🏗️ Stack

```
Frontend: React + Vite + Tailwind + Zustand
Backend:  Express + Node.js + Mongoose
Base:     MongoDB (isolée par commerce)
Paiement: Stripe Payment Links (compte dédié par commerce)
SMS:      Twilio (broadcast + confirmations)
Images:   Cloudinary
```

## 📐 Architecture Backend (32 fichiers modulaires)

```
backend/src/
├── config/
│   ├── env.js           → Validation des variables d'environnement
│   ├── sector.js        → ⭐ Logique Sector-Aware (templates, durées, SMS)
│   └── db|stripe|twilio → Clients configurés
│
├── models/Merchant.js   → Modèle single-tenant (embedded documents)
├── controllers/         → 8 controllers (setup, merchant, liquidation, webhook...)
├── routes/              → Routes Express modulaires
├── services/            → stripe, sms, cloudinary (logique métier isolée)
└── middleware/          → Gestion d'erreurs
```

## 🔄 Flux Principal

### 1. Création liquidation
```
Merchant → POST /api/liquidations/create
         → Controller récupère template + quantité
         → Service Stripe crée Payment Link
         → Save MongoDB
         → Service SMS envoie broadcast (selon SECTOR)
```

### 2. Achat client
```
Client → Paie via Payment Link Stripe
      → Webhook checkout.session.completed
      → Controller vérifie stock disponible
      → Crée Sale + génère pickupCode (LQ-XXXXXX)
      → Incrémente quantitySold
      → Si stock épuisé → désactive Payment Link
      → Service SMS envoie confirmation avec code pickup
```

### 3. Pickup
```
Client → Présente pickupCode au commerce
       → Merchant → PATCH /api/sales/:id/complete
       → Status: pending → completed
```

## 🎨 Backend Caméléon (Sector-Aware)

**Fichier clé : `config/sector.js`**

Configuration par secteur :
```javascript
SECTOR_CONFIGS = {
  food: {
    templates: { small: 25$→15$, medium: 25$→12.5$, large: 25$→10$ }
    liquidationDuration: 4h
    pickupDuration: 2h
    sms: "🔥 LIQUIDATION | Boîtes surprise..."
  },
  games: {
    templates: { small: 30$→18$, medium: 50$→25$, large: 80$→32$ }
    liquidationDuration: 6h
    pickupDuration: 24h
    sms: "🎮 PLACES DISPO | Session..."
  },
  services: { ... }
}
```

**Fonction : `generateSMS(type, data)`**
→ Génère automatiquement le message selon `SECTOR` configuré dans `.env`

## 🔐 Isolation & Déploiement

### 1 Instance = 1 Commerce

| Élément | Isolation |
|---------|-----------|
| MongoDB | Base dédiée par commerce |
| Stripe | Compte + clés dédiées (pas de leak) |
| Code | Partagé (même source) |
| Config | `.env` personnalisé par instance |

### Déploiement

```bash
# Commerce 1: Pâtisserie
.env → SECTOR=food, BUSINESS_NAME=Chez Marcel, MONGODB_URI=db1, STRIPE_KEY=sk_1
Déployer → Vercel Instance 1

# Commerce 2: Arcade
.env → SECTOR=games, BUSINESS_NAME=GameZone, MONGODB_URI=db2, STRIPE_KEY=sk_2
Déployer → Vercel Instance 2
```

**Résultat :** Même code, comportements différents !

## 🛡️ Gestion Stock (Stripe Payment Links)

**Problème :** Payment Links n'a pas d'inventory natif

**Solution :**
1. `quantitySold` incrémenté manuellement dans webhook
2. Si `quantitySold >= quantity` → désactive Payment Link + refund automatique
3. Vérification stock AVANT création de Sale

## 📱 SMS Throttling

- Twilio max 10 SMS/sec
- Service SMS envoie avec delay 100ms entre chaque
- Fonction `smsBroadcast()` en background (fire & forget)

## 🔌 Webhook Stripe (Point critique)

```javascript
// IMPORTANT: Raw body AVANT express.json()
app.use('/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())
```

→ Nécessaire pour vérifier la signature Stripe

## 📊 Modèle de Données (Single-tenant)

```javascript
Merchant {
  businessName, address, phone, primaryColor
  templates: [{ title, regularPrice, liquidaPrice, images }]
  subscribers: [{ phone, name, addedAt }]
  liquidations: [{
    templateId, title, images, prices,
    stripePaymentLinkId, stripePaymentLinkUrl,
    quantity, quantitySold, status, smsSentCount
  }]
  sales: [{
    liquidationId, stripeCheckoutSessionId,
    amount, pickupCode, customerPhone, status
  }]
}
```

**1 seul Merchant par instance** (single-tenant)

## 🚀 Scalabilité

- **Commerces :** Illimité (1 instance par commerce)
- **SMS/broadcast :** ~10/sec (limite Twilio)
- **Paiements :** Illimité (géré par Stripe)
- **Images :** 25GB gratuit Cloudinary par commerce

## ✅ Avantages Architecture

1. **Isolation totale** → Pas de leak données/clés entre clients
2. **Sector-Aware** → Adaptation automatique (Food/Games/Services)
3. **1 codebase** → Maintenance centralisée
4. **Plug & Play** → Branches Git par client pour custom
5. **Scalable** → Autant d'instances que nécessaire
6. **Rapide à déployer** → Copier .env + déployer

## ⚠️ Points d'attention

1. **Webhook Stripe** : Raw body obligatoire
2. **Stock épuisé** : Refund automatique si paiement après stock=0
3. **SMS throttling** : Delay 100ms entre SMS
4. **Phone format** : E.164 (+15141234567)
5. **Pickup code** : Charset sans ambiguïté (pas I/O/0/1)

## 🔜 Question Validation

**Est-ce que cette architecture tient la route pour :**
- ✅ Déployer rapidement 10+ commerces ?
- ✅ Isoler totalement les données/clés Stripe ?
- ✅ Maintenir 1 seul codebase ?
- ✅ Gérer les secteurs différents (Food/Games/Services) ?
- ⚠️ Y a-t-il des failles de sécurité ?
- ⚠️ Y a-t-il des bottlenecks de performance ?
