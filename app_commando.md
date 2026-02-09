# App Commando - MVP Liquida-Choc en 5-7h

## 🎯 Philosophie : DONE > PERFECT

**Règles d'or** :
- 1 fichier backend (server.js)
- 1 fichier frontend (index.html)
- JavaScript pur (pas TypeScript)
- Pas de queue (boucle for simple)
- Stripe Payment Links (pas de checkout custom)
- MongoDB = 1 collection unique

**Temps estimé** : 5-7 heures MAX

---

## 📦 STRUCTURE DU PROJET (ultra-simple)

```
liquidachoc-mvp/
├── server.js          # Backend complet (300 lignes)
├── index.html         # Frontend complet (200 lignes)
├── package.json       # Dépendances
├── .env               # Variables environnement
└── README.md          # Instructions
```

**C'est tout. 4 fichiers.**

---

## 🔧 BACKEND COMPLET (server.js)

```javascript
// server.js - MVP Liquida-Choc Backend
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Stripe = require('stripe');
const twilio = require('twilio');

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Middleware
app.use(cors());
app.use('/webhook', express.raw({ type: 'application/json' })); // Pour webhook Stripe
app.use(express.json());
app.use(express.static('.')); // Sert index.html

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ==================== SCHÉMA MONGODB (ULTRA-SIMPLE) ====================

const merchantSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String, // ATTENTION: En prod, utiliser bcrypt
  businessName: String,
  phone: String,
  address: String,

  // Templates pré-configurés
  templates: {
    small: { name: String, price: Number, quantity: Number },
    medium: { name: String, price: Number, quantity: Number },
    large: { name: String, price: Number, quantity: Number }
  },

  // Abonnés SMS (dans le même doc pour simplicité)
  subscribers: [{
    phone: String,
    name: String,
    addedAt: { type: Date, default: Date.now }
  }],

  // Liquidations
  liquidations: [{
    stripePaymentLinkId: String,
    stripePaymentLinkUrl: String,
    productName: String,
    price: Number,
    quantity: Number,
    quantitySold: { type: Number, default: 0 },
    status: String, // 'active', 'sold_out', 'expired'
    createdAt: { type: Date, default: Date.now }
  }],

  // Ventes
  sales: [{
    liquidationId: String,
    stripeSessionId: String,
    amount: Number,
    pickupCode: String,
    customerPhone: String,
    status: String, // 'paid', 'completed'
    paidAt: Date
  }]
});

const Merchant = mongoose.model('Merchant', merchantSchema);

// ==================== HELPER FUNCTIONS ====================

// Générer code pickup simple
function generatePickupCode() {
  return 'LQ-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// Envoyer SMS (wrapper Twilio)
async function sendSMS(to, body) {
  try {
    await twilioClient.messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      body
    });
    console.log(`✅ SMS sent to ${to}`);
  } catch (error) {
    console.error(`❌ SMS failed to ${to}:`, error.message);
  }
}

// ==================== ROUTES AUTH ====================

// Login ultra-simple (PAS DE JWT pour gagner du temps)
// En production, utiliser JWT ou sessions
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const merchant = await Merchant.findOne({ email, password });

  if (!merchant) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({
    merchantId: merchant._id,
    businessName: merchant.businessName,
    stats: {
      subscribersCount: merchant.subscribers.length,
      liquidationsCount: merchant.liquidations.length,
      salesCount: merchant.sales.length
    }
  });
});

// ==================== ROUTES LIQUIDATIONS ====================

// Créer liquidation
app.post('/api/liquidations/create', async (req, res) => {
  const { merchantId, templateSize } = req.body; // 'small', 'medium', 'large'

  const merchant = await Merchant.findById(merchantId);
  if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

  const template = merchant.templates[templateSize];
  if (!template) return res.status(400).json({ error: 'Invalid template' });

  try {
    // Créer produit Stripe
    const product = await stripe.products.create({
      name: template.name,
      description: `Liquidation chez ${merchant.businessName}`
    });

    // Créer prix Stripe
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(template.price * 100), // En cents
      currency: 'cad'
    });

    // Créer Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        merchantId: merchant._id.toString(),
        productName: template.name,
        initialQuantity: template.quantity.toString()
      }
    });

    // Sauvegarder liquidation
    const liquidation = {
      stripePaymentLinkId: paymentLink.id,
      stripePaymentLinkUrl: paymentLink.url,
      productName: template.name,
      price: template.price,
      quantity: template.quantity,
      quantitySold: 0,
      status: 'active',
      createdAt: new Date()
    };

    merchant.liquidations.push(liquidation);
    await merchant.save();

    const liquidationId = merchant.liquidations[merchant.liquidations.length - 1]._id;

    res.json({
      liquidationId,
      paymentLinkUrl: paymentLink.url,
      quantity: template.quantity
    });

  } catch (error) {
    console.error('❌ Create liquidation failed:', error);
    res.status(500).json({ error: 'Failed to create liquidation' });
  }
});

// Envoyer SMS broadcast
app.post('/api/liquidations/:id/send', async (req, res) => {
  const { id } = req.params;
  const { merchantId } = req.body;

  const merchant = await Merchant.findById(merchantId);
  if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

  const liquidation = merchant.liquidations.id(id);
  if (!liquidation) return res.status(404).json({ error: 'Liquidation not found' });

  if (merchant.subscribers.length === 0) {
    return res.status(400).json({ error: 'No subscribers' });
  }

  // SMS template
  const smsBody = `🔥 LIQUIDATION | ${merchant.businessName}

${liquidation.productName}
🏷️ ${liquidation.price.toFixed(2)}$ (-50%)
📦 Stock: ${liquidation.quantity} disponibles

👉 Achetez maintenant:
${liquidation.stripePaymentLinkUrl}

⏱️ Valide aujourd'hui seulement
📍 ${merchant.address}

STOP pour ne plus recevoir ces alertes`;

  // Envoi SMS avec throttling simple (100ms entre chaque)
  res.json({ message: 'SMS sending started' });

  // Fire and forget (async)
  (async () => {
    for (const subscriber of merchant.subscribers) {
      await sendSMS(subscriber.phone, smsBody);
      await new Promise(resolve => setTimeout(resolve, 100)); // Throttle 100ms
    }
    console.log(`✅ Broadcast completed: ${merchant.subscribers.length} SMS sent`);
  })();
});

// Liste liquidations
app.get('/api/liquidations', async (req, res) => {
  const { merchantId } = req.query;

  const merchant = await Merchant.findById(merchantId);
  if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

  res.json({ liquidations: merchant.liquidations.slice(-10).reverse() }); // 10 dernières
});

// ==================== ROUTES SALES ====================

// Liste ventes
app.get('/api/sales', async (req, res) => {
  const { merchantId } = req.query;

  const merchant = await Merchant.findById(merchantId);
  if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

  res.json({ sales: merchant.sales.slice(-20).reverse() }); // 20 dernières
});

// Marquer vente comme complétée (pickup confirmé)
app.patch('/api/sales/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { merchantId } = req.body;

  const merchant = await Merchant.findById(merchantId);
  if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

  const sale = merchant.sales.id(id);
  if (!sale) return res.status(404).json({ error: 'Sale not found' });

  sale.status = 'completed';
  await merchant.save();

  res.json({ message: 'Sale completed' });
});

// ==================== ROUTES SUBSCRIBERS ====================

// Ajouter abonné (pour page publique d'inscription)
app.post('/api/subscribers', async (req, res) => {
  const { merchantId, phone, name } = req.body;

  const merchant = await Merchant.findById(merchantId);
  if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

  // Vérifier si déjà inscrit
  const existing = merchant.subscribers.find(s => s.phone === phone);
  if (existing) {
    return res.status(400).json({ error: 'Already subscribed' });
  }

  merchant.subscribers.push({ phone, name });
  await merchant.save();

  // SMS de bienvenue
  await sendSMS(phone, `🎉 Bienvenue ! Vous recevrez nos alertes liquidation de ${merchant.businessName}. Répondez STOP pour vous désabonner.`);

  res.json({ message: 'Subscribed successfully' });
});

// ==================== WEBHOOK STRIPE ====================

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Récupérer merchantId depuis metadata du Payment Link
    const paymentLink = await stripe.paymentLinks.retrieve(session.payment_link);
    const merchantId = paymentLink.metadata.merchantId;
    const initialQuantity = parseInt(paymentLink.metadata.initialQuantity);

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      console.error('❌ Merchant not found:', merchantId);
      return res.json({ received: true });
    }

    // Trouver la liquidation
    const liquidation = merchant.liquidations.find(
      l => l.stripePaymentLinkId === session.payment_link
    );

    if (!liquidation) {
      console.error('❌ Liquidation not found');
      return res.json({ received: true });
    }

    // Vérifier stock
    if (liquidation.quantitySold >= liquidation.quantity) {
      console.error('❌ Stock épuisé, refund nécessaire');
      // TODO: Déclencher refund automatique
      return res.json({ received: true });
    }

    // Créer vente
    const pickupCode = generatePickupCode();
    const sale = {
      liquidationId: liquidation._id.toString(),
      stripeSessionId: session.id,
      amount: session.amount_total / 100,
      pickupCode,
      customerPhone: session.customer_details?.phone || 'N/A',
      status: 'paid',
      paidAt: new Date()
    };

    merchant.sales.push(sale);

    // Incrémenter quantitySold
    liquidation.quantitySold += 1;

    // Marquer comme sold_out si tout vendu
    if (liquidation.quantitySold >= liquidation.quantity) {
      liquidation.status = 'sold_out';
      // Désactiver Payment Link
      await stripe.paymentLinks.update(liquidation.stripePaymentLinkId, { active: false });
    }

    await merchant.save();

    // Envoyer SMS confirmation au client
    if (session.customer_details?.phone) {
      await sendSMS(
        session.customer_details.phone,
        `✅ Achat confirmé chez ${merchant.businessName}!

Votre code de récupération:
${pickupCode}

📍 ${merchant.address}
⏰ À récupérer dans les 2 prochaines heures

Présentez ce code à votre arrivée. Merci ! 🌍`
      );
    }

    console.log(`✅ Sale created: ${pickupCode}`);
  }

  res.json({ received: true });
});

// ==================== ROUTE SETUP (pour créer compte test) ====================

app.post('/api/setup', async (req, res) => {
  const { email, password, businessName, phone, address } = req.body;

  const merchant = new Merchant({
    email,
    password, // ATTENTION: En prod, hasher avec bcrypt
    businessName,
    phone,
    address,
    templates: {
      small: { name: 'Petit lot', price: 15, quantity: 10 },
      medium: { name: 'Moyen lot', price: 12.5, quantity: 20 },
      large: { name: 'Gros lot', price: 10, quantity: 50 }
    },
    subscribers: [],
    liquidations: [],
    sales: []
  });

  await merchant.save();

  res.json({ message: 'Merchant created', merchantId: merchant._id });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

---

## 🎨 FRONTEND COMPLET (index.html)

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Liquida-Choc - Dashboard</title>

  <!-- Tailwind CSS via CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">

  <!-- Login Screen -->
  <div id="loginScreen" class="min-h-screen flex items-center justify-center px-4">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 class="text-3xl font-bold text-orange-600 mb-6 text-center">🔥 Liquida-Choc</h1>

      <input
        type="email"
        id="loginEmail"
        placeholder="Email"
        class="w-full px-4 py-2 border rounded mb-4"
      />

      <input
        type="password"
        id="loginPassword"
        placeholder="Mot de passe"
        class="w-full px-4 py-2 border rounded mb-6"
      />

      <button
        onclick="login()"
        class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded"
      >
        Connexion
      </button>

      <p id="loginError" class="text-red-500 text-sm mt-4 hidden"></p>
    </div>
  </div>

  <!-- Dashboard Screen -->
  <div id="dashboardScreen" class="hidden min-h-screen p-4">
    <div class="max-w-6xl mx-auto">

      <!-- Header -->
      <div class="bg-white p-6 rounded-lg shadow mb-6">
        <h1 class="text-2xl font-bold text-gray-900" id="businessName"></h1>

        <div class="grid grid-cols-3 gap-4 mt-4">
          <div class="bg-blue-50 p-4 rounded">
            <p class="text-sm text-gray-600">Abonnés SMS</p>
            <p class="text-2xl font-bold text-blue-600" id="subscribersCount">0</p>
          </div>
          <div class="bg-green-50 p-4 rounded">
            <p class="text-sm text-gray-600">Liquidations</p>
            <p class="text-2xl font-bold text-green-600" id="liquidationsCount">0</p>
          </div>
          <div class="bg-orange-50 p-4 rounded">
            <p class="text-sm text-gray-600">Ventes</p>
            <p class="text-2xl font-bold text-orange-600" id="salesCount">0</p>
          </div>
        </div>
      </div>

      <!-- Boutons Liquidation -->
      <div class="bg-white p-6 rounded-lg shadow mb-6">
        <h2 class="text-xl font-bold mb-4">🔥 Nouvelle Liquidation</h2>

        <div class="grid grid-cols-3 gap-4">
          <button
            onclick="createLiquidation('small')"
            class="bg-orange-400 hover:bg-orange-500 text-white py-12 rounded-lg font-bold text-lg"
          >
            🔥 Petit lot<br/>
            <span class="text-sm">10 items</span>
          </button>

          <button
            onclick="createLiquidation('medium')"
            class="bg-orange-500 hover:bg-orange-600 text-white py-12 rounded-lg font-bold text-lg"
          >
            🔥🔥 Moyen lot<br/>
            <span class="text-sm">20 items</span>
          </button>

          <button
            onclick="createLiquidation('large')"
            class="bg-orange-600 hover:bg-orange-700 text-white py-12 rounded-lg font-bold text-lg"
          >
            🔥🔥🔥 Gros lot<br/>
            <span class="text-sm">50 items</span>
          </button>
        </div>

        <p id="liquidationStatus" class="text-green-600 font-bold mt-4 hidden"></p>
      </div>

      <!-- Liste Ventes -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-4">📦 Ventes en attente</h2>

        <div id="salesList" class="space-y-2">
          <p class="text-gray-500 text-sm">Aucune vente pour le moment</p>
        </div>
      </div>

      <!-- Logout -->
      <div class="mt-6 text-center">
        <button
          onclick="logout()"
          class="text-gray-500 hover:text-gray-700 underline"
        >
          Déconnexion
        </button>
      </div>

    </div>
  </div>

  <!-- JavaScript -->
  <script>
    const API_URL = 'http://localhost:3000/api'; // Changer en prod
    let merchantId = null;
    let currentLiquidationId = null;

    // Login
    async function login() {
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      try {
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
          document.getElementById('loginError').textContent = 'Email ou mot de passe incorrect';
          document.getElementById('loginError').classList.remove('hidden');
          return;
        }

        const data = await res.json();
        merchantId = data.merchantId;

        // Afficher dashboard
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('dashboardScreen').classList.remove('hidden');

        // Remplir stats
        document.getElementById('businessName').textContent = data.businessName;
        document.getElementById('subscribersCount').textContent = data.stats.subscribersCount;
        document.getElementById('liquidationsCount').textContent = data.stats.liquidationsCount;
        document.getElementById('salesCount').textContent = data.stats.salesCount;

        // Charger ventes
        loadSales();

      } catch (error) {
        console.error('Login failed:', error);
        document.getElementById('loginError').textContent = 'Erreur de connexion';
        document.getElementById('loginError').classList.remove('hidden');
      }
    }

    // Créer liquidation
    async function createLiquidation(templateSize) {
      try {
        const res = await fetch(`${API_URL}/liquidations/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId, templateSize })
        });

        const data = await res.json();
        currentLiquidationId = data.liquidationId;

        // Confirmation
        const confirm = window.confirm(
          `Liquidation créée ! ${data.quantity} produits.\n\nEnvoyer SMS maintenant ?`
        );

        if (confirm) {
          await sendBroadcast(currentLiquidationId);
        }

      } catch (error) {
        console.error('Create liquidation failed:', error);
        alert('Erreur lors de la création');
      }
    }

    // Envoyer broadcast SMS
    async function sendBroadcast(liquidationId) {
      try {
        const res = await fetch(`${API_URL}/liquidations/${liquidationId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId })
        });

        const statusEl = document.getElementById('liquidationStatus');
        statusEl.textContent = '✅ SMS en cours d\'envoi !';
        statusEl.classList.remove('hidden');

        setTimeout(() => statusEl.classList.add('hidden'), 5000);

        // Recharger stats
        setTimeout(() => location.reload(), 2000);

      } catch (error) {
        console.error('Send broadcast failed:', error);
        alert('Erreur lors de l\'envoi SMS');
      }
    }

    // Charger ventes
    async function loadSales() {
      try {
        const res = await fetch(`${API_URL}/sales?merchantId=${merchantId}`);
        const data = await res.json();

        const salesList = document.getElementById('salesList');

        if (data.sales.length === 0) {
          salesList.innerHTML = '<p class="text-gray-500 text-sm">Aucune vente pour le moment</p>';
          return;
        }

        salesList.innerHTML = data.sales
          .filter(s => s.status === 'paid')
          .map(sale => `
            <div class="border p-4 rounded flex justify-between items-center">
              <div>
                <p class="font-bold text-lg">${sale.pickupCode}</p>
                <p class="text-sm text-gray-600">${sale.amount.toFixed(2)}$ - ${sale.customerPhone}</p>
                <p class="text-xs text-gray-400">${new Date(sale.paidAt).toLocaleString('fr-CA')}</p>
              </div>
              <button
                onclick="completeSale('${sale._id}')"
                class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                ✅ Remis
              </button>
            </div>
          `).join('');

      } catch (error) {
        console.error('Load sales failed:', error);
      }
    }

    // Marquer vente comme complétée
    async function completeSale(saleId) {
      try {
        await fetch(`${API_URL}/sales/${saleId}/complete`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId })
        });

        loadSales(); // Recharger liste

      } catch (error) {
        console.error('Complete sale failed:', error);
      }
    }

    // Logout
    function logout() {
      merchantId = null;
      document.getElementById('dashboardScreen').classList.add('hidden');
      document.getElementById('loginScreen').classList.remove('hidden');
      document.getElementById('loginEmail').value = '';
      document.getElementById('loginPassword').value = '';
    }

    // Auto-refresh ventes toutes les 10 secondes
    setInterval(() => {
      if (merchantId) loadSales();
    }, 10000);
  </script>

</body>
</html>
```

---

## 📋 PACKAGE.JSON

```json
{
  "name": "liquidachoc-mvp",
  "version": "1.0.0",
  "description": "MVP Liquida-Choc - Bouton de liquidation SMS",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "cors": "^2.8.5",
    "stripe": "^14.0.0",
    "twilio": "^4.19.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## 🔐 FICHIER .ENV

```bash
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/liquidachoc

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Twilio
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+15819999999

# Server
PORT=3000
```

---

## 🔄 FLUX TECHNIQUE WEBHOOK STRIPE

### **Problème : Comment identifier quelle liquidation a été payée ?**

**Solution** : Utiliser les **metadata du Payment Link Stripe**.

### **Étape par étape** :

1. **Création Payment Link** (ligne 133-156 de server.js)
```javascript
const paymentLink = await stripe.paymentLinks.create({
  line_items: [{ price: price.id, quantity: 1 }],
  metadata: {
    merchantId: merchant._id.toString(),      // <-- ID du commerçant
    productName: template.name,               // <-- Nom produit
    initialQuantity: template.quantity.toString() // <-- Stock initial
  }
});
```

2. **Webhook reçoit checkout.session.completed** (ligne 288)
```javascript
const session = event.data.object;
// session.payment_link = ID du Payment Link (ex: "plink_xxx")
```

3. **Récupérer le Payment Link depuis Stripe** (ligne 292)
```javascript
const paymentLink = await stripe.paymentLinks.retrieve(session.payment_link);
const merchantId = paymentLink.metadata.merchantId; // <-- Récupéré !
```

4. **Trouver la liquidation en DB** (ligne 300)
```javascript
const merchant = await Merchant.findById(merchantId);
const liquidation = merchant.liquidations.find(
  l => l.stripePaymentLinkId === session.payment_link
);
```

5. **Décrémenter stock manuellement** (ligne 323)
```javascript
liquidation.quantitySold += 1;

if (liquidation.quantitySold >= liquidation.quantity) {
  liquidation.status = 'sold_out';
  await stripe.paymentLinks.update(liquidation.stripePaymentLinkId, { active: false });
}
```

**Pourquoi ça marche** :
- Stripe stocke les metadata dans le Payment Link
- Le webhook `checkout.session.completed` contient `session.payment_link`
- On fait un `retrieve()` du Payment Link pour récupérer les metadata
- On utilise `merchantId` + `payment_link` pour trouver la liquidation exacte
- Stock géré manuellement en DB (pas de race condition car webhook = 1 seul thread)

---

## ⏱️ TEMPS ESTIMÉ PAR SECTION

| Tâche | Temps |
|-------|-------|
| Setup projet (npm init, install deps) | 15 min |
| Backend routes basiques (login, create, send) | 2h |
| Backend webhook Stripe | 1h |
| Frontend HTML + Tailwind | 1h30 |
| Frontend JavaScript (API calls) | 1h |
| Tests manuels (Postman + navigateur) | 1h |
| Debug + polish | 30 min |

**TOTAL : 5-7 heures**

---

## 🚀 DIFFÉRENCES AVEC VERSION COMPLEXE (54h)

| Feature | Version complexe | Version Commando | Gain temps |
|---------|------------------|------------------|------------|
| TypeScript | ✅ | ❌ (JS pur) | -10h |
| Queue (Bull + Redis) | ✅ | ❌ (boucle for) | -5h |
| Multi-fichiers | ✅ (20+ fichiers) | ❌ (2 fichiers) | -8h |
| React frontend | ✅ | ❌ (HTML + Tailwind CDN) | -12h |
| Tests unitaires | ✅ | ❌ | -6h |
| JWT auth | ✅ | ❌ (login simple) | -2h |
| MongoDB schemas complexes | ✅ (4 collections) | ❌ (1 collection) | -3h |
| CI/CD | ✅ | ❌ | -4h |
| Documentation | ✅ (exhaustive) | ⚠️ (minimale) | -4h |

**Total gagné : 54h → 7h = 47 heures**

---

## ✅ CHECKLIST DE VALIDATION MVP

Avant de déployer, vérifier :

- [ ] `npm install` fonctionne sans erreur
- [ ] MongoDB Atlas connecté (logs "✅ MongoDB connected")
- [ ] Stripe test keys configurées (.env)
- [ ] Twilio trial account configuré (.env)
- [ ] Login fonctionne (créer 1 merchant avec `/api/setup`)
- [ ] Boutons liquidation créent un Payment Link Stripe
- [ ] Clic "Envoyer SMS" envoie à au moins 1 numéro test
- [ ] Paiement Stripe déclenche webhook (test avec Stripe CLI)
- [ ] Vente apparaît dans liste dashboard
- [ ] Code pickup généré et visible

**Si 10/10 = SHIP ! 🚀**

---

## 🎯 CE QU'ON SKIP VOLONTAIREMENT (v1)

**Pour gagner du temps, on ignore** :

1. ❌ Sécurité avancée (bcrypt, JWT, rate limiting)
2. ❌ Gestion d'erreurs exhaustive
3. ❌ Logs structurés (Winston, Sentry)
4. ❌ Tests automatisés
5. ❌ Multi-tenant sophistiqué
6. ❌ Pagination (limite 10 dernières liquidations)
7. ❌ Webhooks Twilio (gestion STOP)
8. ❌ Refunds automatiques (si stock épuisé)
9. ❌ Dashboard analytics avancé
10. ❌ Mobile app (juste PWA via index.html)

**On peut ajouter ça APRÈS le premier client payant.**

---

## 🔥 PHILOSOPHY : DONE > PERFECT

**Principes appliqués** :

1. **Une seule collection MongoDB** → Pas de joins complexes
2. **Boucle for au lieu de queue** → Suffit pour 200-300 SMS
3. **Stripe Payment Links** → Pas besoin de checkout custom
4. **HTML + Tailwind CDN** → Pas de build step
5. **Pas de TypeScript** → Pas de compilation
6. **Fire and forget SMS** → Pas besoin d'attendre la réponse API
7. **Login ultra-simple** → Pas de JWT (pour MVP)
8. **2 fichiers totaux** → Facile à debug

**Résultat** : Un MVP FONCTIONNEL en 7h au lieu de 54h.

**Next step** : Lire `prospects_chicoutimi.md` pour savoir où aller demain pitcher ! 🎯
