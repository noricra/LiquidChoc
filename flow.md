# Flow - Liquida-Choc | Diagrammes de flux complets

## Vue d'ensemble du système

```mermaid
graph TB
    A[Commerçant] -->|1. Clique bouton liquidation| B[Backend API]
    B -->|2. Crée Payment Link Stripe| C[Stripe]
    B -->|3. Envoie SMS broadcast| D[Twilio]
    D -->|4. SMS reçu| E[Clients abonnés]
    E -->|5. Clique lien dans SMS| F[Page de paiement Stripe]
    F -->|6. Paiement validé| C
    C -->|7. Webhook payment.succeeded| B
    B -->|8. SMS de confirmation| E
    B -->|9. Notification push| A
    A -->|10. Remise du produit| E
```

---

## Flux détaillé par étape

### 📱 **FLUX 1 : Inscription du client (Opt-in SMS)**

**Objectif** : Recruter des abonnés SMS pour le commerçant.

```mermaid
sequenceDiagram
    participant Client
    participant QRCode
    participant LandingPage
    participant Backend
    participant Database

    Client->>QRCode: Scan QR Code à la caisse
    QRCode->>LandingPage: Redirect vers /subscribe/:merchantId
    LandingPage->>Client: Formulaire (Nom + Téléphone)
    Client->>LandingPage: Soumet formulaire
    LandingPage->>Backend: POST /api/subscribe
    Backend->>Database: Vérifie si téléphone existe
    alt Nouveau client
        Backend->>Database: INSERT subscriber
        Backend->>Client: SMS de bienvenue (Twilio)
        Backend->>LandingPage: Succès + Message de confirmation
    else Déjà inscrit
        Backend->>LandingPage: Erreur : "Vous êtes déjà inscrit"
    end
    LandingPage->>Client: Affiche statut d'inscription
```

**Points clés :**
- **Double opt-in** : Pas nécessaire (complique le flow), mais envoyer un SMS de bienvenue pour confirmer
- **Validation téléphone** : Format international (+1XXXXXXXXXX)
- **Anti-spam** : Rate limit sur l'endpoint (max 5 inscriptions/IP/heure)
- **RGPD-friendly** : Lien de désinscription dans chaque SMS

---

### 🔴 **FLUX 2 : Création de la liquidation (Action du commerçant)**

**Objectif** : Le commerçant déclenche une vente flash en 1 clic.

```mermaid
sequenceDiagram
    participant Merchant
    participant AdminUI
    participant Backend
    participant Stripe
    participant Database

    Merchant->>AdminUI: Clique bouton "Liquidation"
    AdminUI->>Merchant: Modal : Sélectionne template
    Note over AdminUI: Templates pré-configurés:<br/>Petit lot (10 items, -40%)<br/>Moyen lot (20 items, -50%)<br/>Gros lot (50 items, -60%)
    Merchant->>AdminUI: Sélectionne "Moyen lot"
    AdminUI->>Backend: POST /api/liquidations/create
    Backend->>Stripe: Crée Payment Link
    Note over Stripe: - Prix: 12.50$ (au lieu de 25$)<br/>- Quantité max: 20<br/>- inventory[quantity] = 20<br/>- inventory[enabled] = true
    Stripe-->>Backend: Retourne paymentLinkUrl
    Backend->>Database: INSERT liquidation (status: active)
    Backend-->>AdminUI: Retourne liquidation ID + link
    AdminUI->>Merchant: Affiche confirmation
    Note over AdminUI: "Prêt à envoyer à 247 abonnés"
```

**Points clés :**
- **Templates pré-configurés** : Évite la saisie manuelle (gain de temps)
- **Inventory management** : Géré côté Stripe (pas de double vente)
- **Validation** : Le commerçant peut prévisualiser avant d'envoyer
- **Rollback** : Possibilité d'annuler avant l'envoi SMS

---

### 📨 **FLUX 3 : Envoi SMS broadcast (via Twilio)**

**Objectif** : Notifier tous les abonnés sans surcharger l'API Twilio.

```mermaid
sequenceDiagram
    participant Merchant
    participant AdminUI
    participant Backend
    participant Queue
    participant TwilioWorker
    participant Twilio
    participant Subscribers

    Merchant->>AdminUI: Clique "Envoyer maintenant"
    AdminUI->>Backend: POST /api/liquidations/:id/send
    Backend->>Queue: Enqueue SMS job
    Note over Queue: Bull Queue (Redis)<br/>Throttling: 10 SMS/seconde
    loop Pour chaque subscriber
        Queue->>TwilioWorker: Dispatch SMS job
        TwilioWorker->>Twilio: Envoie SMS
        Note over Twilio: Message:<br/>"🔥 LIQUIDATION : Sushis à -50%<br/>12.50$ au lieu de 25$<br/>Cliquez ici: [lien]"
        Twilio->>Subscribers: SMS livré
        TwilioWorker->>Backend: Log delivery status
    end
    Backend->>AdminUI: WebSocket update (247/247 envoyés)
    AdminUI->>Merchant: Notification "Envoi terminé"
```

**Points clés :**
- **Rate limiting Twilio** : 10 SMS/sec (limite par défaut, ajustable)
- **Gestion d'erreurs** : Retry 3x si échec, puis skip
- **Tracking** : Delivery status loggé en DB (delivered, failed, pending)
- **Coût** : ~0.0079$ CAD/SMS × 247 = ~1.95$ par campagne
- **Unsubscribe** : Lien "STOP" dans chaque SMS (exigence légale)

---

### 💳 **FLUX 4 : Achat client (via Stripe Payment Link)**

**Objectif** : Le client paie en ligne, Stripe gère le stock automatiquement.

```mermaid
sequenceDiagram
    participant Client
    participant SMS
    participant StripeCheckout
    participant Stripe
    participant Backend
    participant Database

    Client->>SMS: Reçoit SMS avec lien
    Client->>SMS: Clique sur le lien
    SMS->>StripeCheckout: Redirect vers Payment Link
    StripeCheckout->>Client: Page de paiement
    Note over StripeCheckout: Affiche:<br/>- Produit + prix<br/>- Stock restant (ex: 18/20)<br/>- Timer (optionnel)
    Client->>StripeCheckout: Remplit infos carte
    StripeCheckout->>Stripe: Valide paiement

    alt Stock disponible
        Stripe->>Stripe: Décrémente inventory (-1)
        Stripe->>StripeCheckout: Paiement réussi
        Stripe->>Backend: Webhook checkout.session.completed
        Backend->>Database: UPDATE sale (status: paid)
        Backend->>Client: SMS confirmation + code pickup
        StripeCheckout->>Client: Page de succès
    else Stock épuisé
        Stripe->>StripeCheckout: Erreur "Plus de stock"
        StripeCheckout->>Client: Message d'erreur
    end
```

**Points clés :**
- **Gestion du stock** : 100% côté Stripe (atomic, pas de race condition)
- **UX** : Stock en temps réel visible sur la page de paiement
- **Sécurité** : Stripe gère 3D Secure si nécessaire
- **Frais** : 2.9% + 0.30$ par transaction (standard Stripe)
- **Code pickup** : Généré automatiquement (ex: #LQ-A4B2) pour validation commerçant

---

### ✅ **FLUX 5 : Confirmation et pickup**

**Objectif** : Le commerçant valide la remise du produit.

```mermaid
sequenceDiagram
    participant Client
    participant Merchant
    participant AdminUI
    participant Backend
    participant Database

    Client->>Merchant: Se présente avec SMS de confirmation
    Note over Client: Affiche code pickup: #LQ-A4B2
    Merchant->>AdminUI: Ouvre liste des ventes en attente
    AdminUI->>Backend: GET /api/sales?status=paid
    Backend->>Database: SELECT sales WHERE status = 'paid'
    Database-->>Backend: Retourne liste
    Backend-->>AdminUI: Affiche ventes (avec codes)
    Merchant->>AdminUI: Cherche code #LQ-A4B2
    AdminUI->>Merchant: Affiche détails (produit, nom client)
    Merchant->>AdminUI: Clique "Confirmer remise"
    AdminUI->>Backend: PATCH /api/sales/:id/complete
    Backend->>Database: UPDATE sale (status: completed)
    Backend->>Merchant: SMS "Merci pour votre achat !"
    Backend-->>AdminUI: Succès
    AdminUI->>Merchant: Notification "Vente complétée"
```

**Points clés :**
- **Validation simple** : Scan code ou recherche manuelle
- **Historique** : Toutes les ventes loggées pour comptabilité
- **Feedback client** : SMS de remerciement automatique (optionnel)
- **Analytics** : Temps moyen entre achat et pickup tracké

---

### 🔄 **FLUX 6 : Gestion des cas limites**

#### **Cas 1 : Client ne vient pas chercher le produit**

```mermaid
sequenceDiagram
    participant System
    participant Database
    participant Merchant
    participant Client
    participant Stripe

    System->>Database: Cron job (toutes les heures)
    Database->>System: SELECT sales WHERE status='paid' AND createdAt < NOW() - 2h
    alt Vente expirée
        System->>Merchant: SMS "Client X n'est pas venu chercher"
        System->>Database: UPDATE sale (status: expired)
        Note over System: Option 1: Garder l'argent (politique stricte)<br/>Option 2: Rembourser (meilleure UX)
        System->>Stripe: Refund payment (si option 2)
        System->>Client: SMS "Produit non récupéré, vous avez été remboursé"
    end
```

**Recommandation** :
- **Phase 1** : Garder l'argent (politique affichée clairement : "À récupérer sous 2h")
- **Phase 2** : Remboursement automatique (meilleure réputation, moins de friction)

---

#### **Cas 2 : Stock épuisé avant la fin de la liquidation**

```mermaid
sequenceDiagram
    participant Stripe
    participant Backend
    participant Database
    participant Merchant

    Stripe->>Backend: Webhook payment.succeeded (dernier item)
    Backend->>Database: SELECT liquidation WHERE id = X
    Database-->>Backend: inventory_sold = 20/20
    Backend->>Database: UPDATE liquidation (status: sold_out)
    Backend->>Merchant: Push notification "SOLD OUT en 8 minutes !"
    Note over Backend: Stripe bloque automatiquement<br/>les nouveaux paiements
```

**Points clés :**
- **Aucune action requise** : Stripe gère le blocage automatiquement
- **Feedback commerçant** : Notification de succès (boost moral)

---

#### **Cas 3 : Annulation de liquidation par le commerçant**

```mermaid
sequenceDiagram
    participant Merchant
    participant AdminUI
    participant Backend
    participant Stripe
    participant Database
    participant Clients

    Merchant->>AdminUI: Clique "Annuler la liquidation"
    AdminUI->>Merchant: Modal confirmation
    Merchant->>AdminUI: Confirme annulation
    AdminUI->>Backend: POST /api/liquidations/:id/cancel
    Backend->>Stripe: Désactive Payment Link
    Backend->>Database: UPDATE liquidation (status: cancelled)

    alt Des ventes ont déjà été faites
        Backend->>Stripe: Refund all payments
        Backend->>Clients: SMS "Liquidation annulée, vous êtes remboursé"
    else Aucune vente
        Backend->>AdminUI: Simple confirmation
    end
```

**Points clés :**
- **Utilisé rarement** : Cas d'urgence (erreur de prix, problème produit)
- **Coût** : Frais Stripe non remboursables (à assumer)

---

## 🎯 Métriques à tracker en temps réel

### **Pour le commerçant (Dashboard)**

```mermaid
graph LR
    A[Liquidation active] --> B[SMS envoyés: 247]
    A --> C[Stock restant: 12/20]
    A --> D[Revenu généré: 100$]
    A --> E[Temps écoulé: 8min]
    A --> F[Taux de conversion: 3.2%]
```

### **KPIs système (Admin backend)**

- **Delivery rate SMS** : % de SMS livrés avec succès
- **Click-through rate** : % de clics sur le lien
- **Conversion rate** : % d'achats après clic
- **Temps moyen de vente** : Durée entre envoi SMS et sold out
- **Revenu par campagne** : Moyenne par type de commerce
- **Taux de pickup** : % de produits effectivement récupérés

---

## 🚀 Optimisations futures (v2)

### **1. Smart scheduling**
- Détection automatique des patterns de liquidation
- Suggestion : "Vos sushis se vendent mieux le mardi à 19h"

### **2. Segmentation des abonnés**
- Tags : "Aime les sushis", "Budget serré", "Achète souvent"
- Envoi ciblé : +30% de conversion

### **3. Gamification**
- "Vous êtes le 3e acheteur aujourd'hui ! Encore 2 achats = badge fidélité"
- Boost engagement

### **4. Multi-commerce**
- Un client inscrit à 5 commerces
- Gestion centralisée des préférences

---

## ✅ Checklist de validation du flow

Avant de passer au code, vérifier :

- [ ] **Stripe Payment Links supporte inventory management** : OUI (confirmé)
- [ ] **Twilio rate limit acceptable** : 10 SMS/sec = 600/min (OK pour 10 clients × 200 abonnés)
- [ ] **Webhook Stripe → Backend sécurisé** : Signature validation obligatoire
- [ ] **Gestion des fuseaux horaires** : UTC en DB, conversion locale en UI
- [ ] **RGPD/CASL compliance** : Opt-in explicite + lien de désabonnement
- [ ] **Coûts SMS prévisibles** : Budget max/campagne défini (ex: 2$)
- [ ] **Rollback strategy** : Annulation possible jusqu'à l'envoi SMS

---

## 📱 Wireframe du SMS (exemple réel)

```
🔥 LIQUIDATION | Sushi Express

Plateaux sushis mixtes
🏷️ 12.50$ au lieu de 25$ (-50%)
📦 Stock: 20 disponibles

👉 Achetez maintenant:
https://buy.stripe.com/abc123

⏱️ Valide jusqu'à 22h ce soir
📍 Pickup: 123 rue Racine E

STOP pour ne plus recevoir ces alertes
```

**Longueur** : ~160 caractères (1 SMS = coût minimal)

---

## 🎨 Wireframe de la page Stripe (personnalisée)

### **Header**
```
🔥 Liquidation Flash - Sushi Express
⏱️ Se termine dans 2h15
```

### **Produit**
```
Plateaux de sushis mixtes (12 pièces)
Prix normal: 25.00$
Prix flash: 12.50$ (-50%)

Stock restant: 12/20
⚡ Dépêchez-vous !
```

### **Call-to-action**
```
[Acheter maintenant - 12.50$]

✅ Paiement sécurisé par Stripe
📍 À récupérer sous 2h au 123 rue Racine E
```

---

## 🔐 Sécurité du flow

### **Protections implémentées**

1. **Webhook signature verification** (Stripe)
   - Empêche les faux paiements

2. **Rate limiting** (Express + Redis)
   - 100 req/min/IP sur endpoints publics
   - 10 req/min sur /api/subscribe (anti-spam)

3. **Code pickup unique** (UUID court)
   - Empêche les fraudes de pickup

4. **HTTPS obligatoire** (Let's Encrypt)
   - Toutes les communications chiffrées

5. **Validation téléphone** (libphonenumber)
   - Format international uniquement

6. **SQL injection** (ORM Mongoose)
   - Requêtes paramétrées par défaut

7. **XSS protection** (React + helmet.js)
   - Sanitization automatique

---

## 🎯 Temps de réponse cibles

| Étape | Temps max | Statut |
|-------|-----------|--------|
| Création Payment Link (Stripe) | < 2s | ⚡ Critique |
| Envoi SMS broadcast (247 SMS) | < 30s | ⚠️ Important |
| Webhook processing | < 500ms | ⚡ Critique |
| Dashboard load time | < 1s | ✅ Nice to have |

---

**Next steps** : Voir `architecture.md` pour l'implémentation technique de ces flows.
