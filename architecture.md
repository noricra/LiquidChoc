# Architecture Backend Caméléon - Vue d'ensemble

## 🎯 Philosophie

**"Un seul code, mille visages"**

Le Backend Caméléon utilise une architecture **Multi-tenant Single-tenant** :
- **1 instance déployée = 1 commerce** (isolation totale)
- **Même code source** pour tous les commerces
- **Personnalisation via .env** (Sector-Aware)

## 🏗️ Structure technique

```
LiquidChoc/
│
├── backend/src/              → Backend modulaire
│   ├── config/               → Configuration Sector-Aware
│   │   ├── env.js            → Chargement + validation variables
│   │   ├── sector.js         → ★ Logique Sector-Aware
│   │   ├── db.js             → MongoDB
│   │   ├── stripe.js         → Stripe (isolé par instance)
│   │   ├── twilio.js         → Twilio
│   │   └── cloudinary.js     → Cloudinary
│   │
│   ├── models/
│   │   └── Merchant.js       → Modèle single-tenant
│   │
│   ├── controllers/          → 8 controllers (logique métier)
│   ├── routes/               → Routes modulaires
│   ├── services/             → Logique métier isolée
│   ├── middleware/           → Gestion d'erreurs
│   ├── utils/                → Helpers
│   │
│   ├── app.js                → Configuration Express
│   └── server.js             → ★ Point d'entrée avec banner Sector-Aware
│
├── src/                      → Frontend React
├── .env.example              → ★ Template avec variables Sector-Aware
└── MIGRATION.md              → Guide de migration

★ = Spécifique au Backend Caméléon
```

## 🎨 Système Sector-Aware

Le fichier `backend/src/config/sector.js` définit 3 secteurs avec templates, durées et SMS personnalisés.

Voir backend/README.md pour plus de détails.
