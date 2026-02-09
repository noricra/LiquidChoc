# Liquida-Choc — Design System

## Philosophie

Mobile-first radical. Chaque décision de design part du doigt sur l'écran. Le rendu cible une app native iOS/Android — pas un site web responsive. Inspiré par Too Good To Go : cartes généreuses, images centrales, espace respirant.

---

## Theming — Variables CSS

Injectées à l'initialisation via `/api/setup`. Aucun contrôle design exposé au commerçant après setup.

```css
:root {
  --primary-color: #FF6B35;   /* couleur principale du commerce */
  --bg-color: #FFFFFF;        /* fond app */
  --card-color: #F8F9FA;      /* fond des cartes */
  --text-color: #000000;      /* texte principal */
  --text-muted: #64748B;      /* descriptions, labels secondaires */
}
```

### Mode Light (Restauration, Boulangerie)
| Variable | Valeur |
|----------|--------|
| --bg-color | `#FFFFFF` |
| --card-color | `#F8F9FA` |
| --text-color | `#000000` |
| --text-muted | `#64748B` (slate-500) |

### Mode Dark (Bowling, Loisirs)
| Variable | Valeur |
|----------|--------|
| --bg-color | `#0A0A0A` |
| --card-color | `#1A1A1A` |
| --text-color | `#FFFFFF` |
| --text-muted | `#9CA3AF` (gray-400) |

---

## Tokens de style — Règles strictes

### Ombres
Aucune shadow par défaut de Tailwind. Une seule ombre utilisée dans l'app :

```
shadow-[0_8px_30px_rgb(0,0,0,0.04)]
```

Effet : carte qui flotte légèrement. Pas de shadow-md, shadow-lg, shadow-xl.
En mode dark, l'ombre monte à `rgb(0,0,0,0.12)`.

### Rayon de coins
| Élément | Classe |
|---------|--------|
| Cartes produit | `rounded-[2.5rem]` |
| Boutons principaux | `rounded-full` |
| Boutons secondaires | `rounded-full` |
| Inputs | `rounded-[1.25rem]` |
| Badges | `rounded-full` |
| Image dans carte | coins haut arrondis correspondant à la carte (`rounded-t-[2.5rem]`) |

### Typographie
Police : **Inter** (ou Geist si disponible). Import via Google Fonts ou bundlé.

| Élément | Classes |
|---------|---------|
| Prix liquidation | `font-black text-2xl` (très gras, grande taille) |
| Prix original (barré) | `font-medium text-sm line-through text-slate-400` |
| Titre carte | `font-bold text-lg` |
| Description | `text-slate-500 text-sm leading-relaxed` |
| Label/badge | `font-semibold text-xs uppercase tracking-wider` |

### Micro-interactions
Tous les boutons cliquables portent :

```
active:scale-95 transition-transform duration-150 ease-out
```

Aucune exception. C'est ce qui donne le feedback tactile sur mobile.

### Couleurs fonctionnelles
| Usage | Couleur |
|-------|---------|
| Réduction badge | Fond `var(--primary-color)`, texte blanc, `font-black` |
| Prix liquidation | `var(--primary-color)` |
| Bouton CTA principal | Fond `var(--primary-color)`, texte blanc |
| Texte secondaire | `var(--text-muted)` |

---

## Composants

### Carte Produit (ProductCard)

Structure visuelle, utilisée partout où un produit est affiché.

```
┌─────────────────────────────┐  ← rounded-[2.5rem], shadow-[0_8px_30px_rgb(0,0,0,0.04)]
│                             │     fond : var(--card-color)
│   IMAGE  (aspect-ratio 16/9)│  ← object-cover, rounded-t-[2.5rem]
│   object-cover              │
│                             │
├─────────────────────────────┤
│  Badge  -60%                │  ← rounded-full, fond primary, font-black text-xs
│                             │
│  Titre du produit           │  ← font-bold text-lg, var(--text-color)
│  Description courte         │  ← text-slate-500 text-sm
│                             │
│  12,50$   ~~25,00$~~        │  ← prix liq en font-black + primary, prix orig barré
│                             │
│  [  Quantité  ] [ LIQUIDER ]│  ← boutons rounded-full, active:scale-95
└─────────────────────────────┘
```

- L'image est obligatoire visuellement. En cas d'absence : placeholder avec une couleur unie + icone produit centrée.
- Le badge de réduction est positionné en `absolute` en haut à gauche de l'image, avec un petit offset (top-3 left-3).
- Le bouton LIQUIDER est `w-full` sur mobile, `font-bold`, couleur primary.

### Carte Produit — Version Client (/liquidation/:id)

Page dédiée, pas une carte dans une grille. Layout vertical plein écran.

```
┌─────────────────────────────┐
│                             │
│   IMAGE plein écran         │  ← aspect-ratio 16/9 ou plus grand, object-cover
│                             │     pas de rounded en haut (bord de l'écran)
│   Badge -60% (absolute)     │
└─────────────────────────────┘
│                             │
│   Titre                     │  ← font-black text-2xl
│   Description longue        │  ← text-slate-500 leading-relaxed
│                             │
│   12,50$   ~~25,00$~~       │
│   Places restantes : 3      │  ← texte urgent si < 5, couleur danger
│                             │
│                             │
│                             │  ← espace pour que le footer ne cache pas le contenu
└─────────────────────────────┘
┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  ← Footer glassmorphism (voir ci-dessous)
│  [ Payer avec Stripe  ]     │
└─────────────────────────────┘
```

### Footer Glassmorphism (PaymentFooter)

Collé en bas de l'écran (`fixed bottom-0`). Superposé au contenu.

```css
backdrop-blur-md bg-white/80 border-t border-white/20
```

En mode dark : `bg-black/70`.

Contient uniquement le bouton de paiement :
- `w-full` (ou avec padding horizontal pour des marges côtés)
- `rounded-full`
- `active:scale-95 transition-transform`
- Fond `var(--primary-color)`, texte blanc, `font-bold text-lg`
- Le contenu scrolle derrière avec un padding-bottom suffisant pour ne pas être caché.

---

## Empty States & Skeletons

### Skeletons (pendant le chargement)

Chaque composant qui charge des données a une version skeleton. Même forme, même taille, pas de contenu.

**Carte Skeleton :**
```
┌─────────────────────────────┐  ← même rounded-[2.5rem], même shadow
│                             │
│   BLOC GRIS (image)         │  ← animate-pulse, même aspect-ratio 16/9
│                             │     bg-slate-200 (light) / bg-slate-700 (dark)
├─────────────────────────────┤
│  ████████ (titre)           │  ← bloc animé, h-4, w-3/4
│  ██████████████ (desc)      │  ← bloc animé, h-3, w-full
│  █████  ████████            │  ← bloc animé prix
│                             │
│  [████████████████████]     │  ← bloc bouton animé, rounded-full
└─────────────────────────────┘
```

Animation : `animate-pulse` (Tailwind built-in). Pas de shimmer custom pour le MVP.
Couleurs skeleton : `bg-slate-200` en light, `bg-slate-700` en dark.

**Grille Dashboard Skeleton :** même nombre de cartes que la dernière session (ou 3 par défaut si première visite). Les skeletons apparaissent instantanément, pas de delay.

### Empty States (quand il n'y a rien à afficher)

Chaque liste vide a un état illustré, pas juste un texte.

**Bibliothèque vide (Dashboard, aucun template) :**
```
┌─────────────────────────────┐
│                             │
│         🛒                  │  ← icone grande (48px), couleur muted
│                             │
│   Votre bibliothèque        │  ← font-bold text-lg
│   est vide                  │
│                             │
│   Créez votre premier       │  ← text-slate-500 text-sm, centré
│   produit à liquider        │
│                             │
│  [ + Créer un produit ]     │  ← bouton CTA, même style que le FAB
│                             │
└─────────────────────────────┘
```

- Centré verticalement dans l'espace disponible.
- Icone : simple emoji ou SVG minimaliste. Pas d'illustration complexe.
- Le bouton CTA est identique au FAB (+) en style.

**Aucun abonné encore :**
Même layout, icone 📱, texte "Aucun abonné au Club Privé SMS. Partagez votre QR code !", bouton "Partager le QR code".

**Aucune liquidation active :** icone ⚡, texte "Aucune vente flash en cours."

---

## Pages

### Dashboard Commerçant

Layout :
```
┌─────────────────────────────┐
│  [Logo]  Commerce    👤     │  ← header fixe, fond var(--card-color)
│  👥 128 abonnés             │  ← badge Club Privé SMS
├─────────────────────────────┤
│                             │
│  [Carte] [Carte]            │  ← grille 1 col mobile, 2 col tablet
│  [Carte] [Carte]            │     chaque carte = ProductCard avec Quantité + LIQUIDER
│                             │
│  → Empty State si vide      │
│  → Skeleton si loading      │
│                             │
│              [+]            │  ← FAB coin bas-droite, rounded-full,
└─────────────────────────────┘     shadow, active:scale-95, couleur primary
```

Le FAB (+) ouvre un modal/sheet pour créer un nouveau template (Titre, Description, Prix Régulier, Prix Liquida, Image URL).

### Page Liquidation Client (/liquidation/:id)

Layout décrit dans "Carte Produit — Version Client" ci-dessus.

- Pas de navigation complexe. Arrivée directe via le lien SMS.
- En haut à gauche : flèche retour simple (si historique disponible).
- "Places restantes" se met en rouge (`text-red-500`) si ≤ 5 et clignotant subtil (`animate-pulse`).
- Si sold out : le footer montre "Épuisé" en gris, bouton désactivé.

---

## Route Admin — Setup Commerce

```
POST /api/setup
```

Réservée au développeur. Configuré une fois à l'initialisation.

Corps de la requête :
```json
{
  "nomCommerce": "Le Petit Resto",
  "primaryColor": "#FF6B35",
  "themeMode": "light",
  "stripeSecret": "sk_live_...",
  "twilioSid": "AC...",
  "twilioAuth": "...",
  "twilioNumber": "+15141234567"
}
```

Ce qui se passe :
1. Les valeurs sont persistées (env ou DB config).
2. Les variables CSS sont générées à partir de `primaryColor` + `themeMode`.
3. Les clés Stripe/Twilio sont stockées de façon sécurisée.
4. Aucune page de settings design n'est exposée après ça.

---

## Workflow Vente Flash

1. Le commerçant clique **LIQUIDER** sur une carte (avec quantité choisie).
2. Backend génère un **Payment Link Stripe** avec le stock correspondant.
3. Backend crée le doc `Liquidation` en statut `draft`.
4. Backend enqueue un job Bull qui :
   - Récupère tous les subscribers actifs du commerce.
   - Envoie le SMS à chacun (throttle 100ms entre chaque) :
     ```
     FLASH @[Commerce] : [Produit] à [Prix] au lieu de [PrixReg] ! Places limitées : [Lien]
     ```
   - Met à jour le statut en `active`.
5. Le client reçoit le SMS → ouvre le lien → atterrit sur `/liquidation/:id`.
6. Le client paie via Stripe → webhook `checkout.session.completed` → Sale créée → SMS de confirmation avec pickupCode.

---

## Bibliothèque de Produits (Templates)

Chaque commerce possède une liste de templates réutilisables. Un template n'est pas une liquidation — c'est un moule.

Champs :
| Champ | Type | Exemple |
|-------|------|---------|
| titre | string | "Panier de restes du soir" |
| description | string | "Soupe, pain, fromage..." |
| prixRegulier | number | 25.00 |
| prixLiquida | number | 10.00 |
| imageUrl | string (URL) | CDN ou upload |
| secteur | enum | food / loisirs / services |

Le secteur influence uniquement le placeholder d'image si aucune image n'est fournie.

---

## Résumé des classes Tailwind utilisées

```
Cartes :          rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]
Images :          aspect-video object-cover rounded-t-[2.5rem]
Boutons CTA :     rounded-full active:scale-95 transition-transform duration-150
Inputs :          rounded-[1.25rem]
Badge réduction : rounded-full font-black text-xs
Prix :            font-black text-2xl (color: primary)
Prix barré :      font-medium text-sm line-through text-slate-400
Descriptions :    text-slate-500 text-sm leading-relaxed
Footer pay :      fixed bottom-0 backdrop-blur-md bg-white/80 border-t border-white/20
Skeletons :       animate-pulse bg-slate-200 (light) / bg-slate-700 (dark)
FAB :             rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95
```
