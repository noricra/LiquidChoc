# Roadmap - Plan d'action 4 mois pour maximiser vos revenus

## 🎯 Objectif final (Jour 120)

**Situation de départ** (Aujourd'hui) :
- 0 client
- 0$ de revenu
- Portfolio technique solide
- 4 mois disponibles

**Situation visée** (Dans 4 mois) :
- 10+ clients actifs sur 3 produits
- 2 000$+/mois de MRR
- Asset revendable 15k-25k$
- Cash immédiat : 8k-12k$ générés
- Option : Revenus passifs 400-800$/mois depuis l'Asie

---

## 📅 TIMELINE GLOBALE (16 SEMAINES)

```
MOIS 1 (Semaines 1-4) : LIQUIDA-CHOC
├─ Semaine 1 : Dev MVP
├─ Semaine 2 : Prospection + 3 clients pilotes
├─ Semaine 3 : Optimisation + témoignages
└─ Semaine 4 : Scale à 5-7 clients

MOIS 2 (Semaines 5-8) : REVIEWBOOST
├─ Semaine 5 : Dev ReviewBoost
├─ Semaine 6 : Cross-sell clients Liquida + 2 nouveaux
├─ Semaine 7 : Acquérir 5 clients total ReviewBoost
└─ Semaine 8 : Optimisation + automation

MOIS 3 (Semaines 9-12) : RESERVABOT
├─ Semaine 9-10 : Dev ReservaBot (55h)
├─ Semaine 11 : Lancer avec 3 salons pilotes
└─ Semaine 12 : Scale à 6 clients ReservaBot

MOIS 4 (Semaines 13-16) : SCALE + EXIT
├─ Semaine 13-14 : Push acquisition (objectif : 25+ clients total)
├─ Semaine 15 : Automatisation support + documentation
└─ Semaine 16 : Vente asset OU setup revenus passifs
```

---

## 🗓️ DÉTAIL SEMAINE PAR SEMAINE

### **MOIS 1 : LIQUIDA-CHOC**

#### **Semaine 1 : Dev MVP (50h)**

**Lundi-Mercredi (30h)** : Backend + Intégrations
```bash
Jour 1 (10h) :
- [x] Setup projet (Express + MongoDB Atlas)
- [x] Models (Merchant, Subscriber, Liquidation, Sale)
- [x] Stripe Payment Links (création + webhooks)
- [x] Test : Créer payment link manuellement

Jour 2 (10h) :
- [x] Twilio SMS (envoi simple)
- [x] Queue system (Bull + Upstash Redis)
- [x] Job SMS broadcast (throttling 10/sec)
- [x] Test : Envoyer 50 SMS de test

Jour 3 (10h) :
- [x] Webhooks Stripe (checkout.session.completed)
- [x] Logique création Sale + pickup code
- [x] SMS confirmation client
- [x] Test end-to-end : Achat → SMS confirmation
```

**Jeudi-Vendredi (20h)** : Frontend + Polish
```bash
Jour 4 (10h) :
- [x] Dashboard React (login, stats, templates)
- [x] Bouton "Créer liquidation" (3 templates)
- [x] Bouton "Envoyer SMS" (avec confirmation)
- [x] Liste ventes en attente (avec codes pickup)

Jour 5 (10h) :
- [x] Page d'inscription SMS (QR Code)
- [x] Mobile-responsive (Tailwind)
- [x] Deploy backend (Railway)
- [x] Deploy frontend (Vercel)
- [x] Test complet : Inscription → Liquidation → Achat → Pickup
```

**Livrables fin Semaine 1** :
- ✅ MVP fonctionnel (production-ready)
- ✅ URL live (pour démos)
- ✅ 1 compte de test complet (merchant + 10 subscribers)

---

#### **Semaine 2 : Prospection + 3 clients pilotes (30h)**

**Lundi : Préparation (5h)**
```bash
Matin (3h) :
- Lister 20 prospects cibles (sushis, boulangeries, cafés rue Racine/Talbot)
- Créer deck de pitch (5 slides max : Problème, Solution, Démo, Pricing, CTA)
- Préparer vidéo de démo (2 min, screencast Loom)

Après-midi (2h) :
- Imprimer flyers (10 exemplaires)
- Design QR Code générique (Canva)
- Répéter pitch devant miroir (5× minimum)
```

**Mardi-Mercredi : Cold outreach (10h)**
```bash
Stratégie A : Walk-in (présentiel)
- 10h-12h : Visiter 5 commerces rue Racine
  "Bonjour, je suis étudiant à l'UQAC en info. Je développe un système
   pour réduire le gaspillage alimentaire. Vous auriez 2 minutes ?"

- 14h-16h : Visiter 5 commerces boulevard Talbot
  Même pitch

Stratégie B : Email + DM Instagram
- Envoyer 10 emails personnalisés (template ci-dessous)
- 10 DMs Instagram à des cafés/restos Chicoutimi

Template email :
---
Objet : Réduire votre gaspillage alimentaire (UQAC projet étudiant)

Bonjour [Nom],

Je suis [Votre nom], étudiant français en informatique à l'UQAC.

Je développe un système qui aide les commerces comme le vôtre à vendre
leurs produits périssables avant qu'ils n'expirent (au lieu de les jeter).

Exemple concret : Vos sushis/viennoiseries de fin de journée → SMS à vos
clients réguliers → Vente en 30 min à -50%.

Pas d'abonnement : vous ne payez que 10% sur les ventes que vous n'auriez
jamais faites (vs jeter à la poubelle).

Je cherche 3 commerces pilotes pour tester gratuitement 2 semaines.
Intéressé ? Je passe vous voir demain entre 10h-16h.

Cordialement,
[Votre nom]
[Votre téléphone]
---
```

**Jeudi : Follow-ups + Closing (8h)**
```bash
Matin (4h) :
- Rappeler les prospects intéressés (téléphone ou en personne)
- Démo live sur votre téléphone (5 min par prospect)
- Objectif : Closer 2 clients minimum

Après-midi (4h) :
- Setup comptes clients (création merchant DB)
- Configuration templates (prix, produits)
- Formation en personne (30 min/client)
- Imprimer QR Codes personnalisés
```

**Vendredi : 3e client + Support (7h)**
```bash
Matin (4h) :
- Dernière poussée acquisition (objectif : 3e client)
- Installer le 3e client si signé

Après-midi (3h) :
- Monitoring : Vérifier que les 3 clients testent le système
- Support réactif (répondre en < 1h à tout message)
- Fixer un check-in call lundi prochain
```

**Livrables fin Semaine 2** :
- ✅ 3 clients pilotes actifs
- ✅ Au moins 1 liquidation réussie (preuve de concept)
- ✅ Feedback clients documenté

---

#### **Semaine 3 : Optimisation + Témoignages (25h)**

**Lundi : Check-in clients (5h)**
```bash
- Appeler chaque client (30 min/client)
- Questions à poser :
  * "Combien de produits vendus cette semaine ?"
  * "Combien d'argent récupéré vs jeté ?"
  * "Problèmes rencontrés ?"
  * "Note sur 10 ?"

- Prendre notes détaillées (pour témoignages)
```

**Mardi-Mercredi : Itérations produit (12h)**
```bash
Bugs à fixer (si remontés) :
- SMS non reçus (vérifier Twilio logs)
- Payment Link expiré (ajuster durée)
- Dashboard lent (optimiser queries)

Features rapides (quick wins) :
- Ajout d'un 4e template ("Custom" avec saisie manuelle)
- Export CSV des ventes (pour compta client)
- Notification push navigateur quand vente
```

**Jeudi : Capture de témoignages (5h)**
```bash
Matin (3h) :
- Filmer témoignage vidéo (smartphone suffit)
  Script :
  "Bonjour, je suis [Nom], propriétaire de [Commerce].
   Avant Liquida-Choc, je jetais 150$/semaine de produits.
   Maintenant, je récupère 70$ en moyenne par liquidation.
   En 2 semaines, j'ai sauvé 280$. Je recommande à 100%."

Après-midi (2h) :
- Screenshots dashboard (avec stats impressionnantes)
- Rédiger case study (1 page PDF)
  * Avant/Après
  * Chiffres concrets
  * Quote du client
```

**Vendredi : Création contenu marketing (3h)**
```bash
- Post LinkedIn (votre profil perso) :
  "Il y a 2 semaines, j'ai lancé Liquida-Choc, un système pour aider
   les commerces de Chicoutimi à réduire le gaspillage alimentaire.

   3 clients pilotes, 12 liquidations, 840$ récupérés (vs poubelle).

   Fier de contribuer à une économie locale plus durable ! 🌍"

- Story Instagram UQAC (tag @uqac, #chicoutimi)
- Email à vos profs d'info (demander diffusion aux étudiants)
```

**Livrables fin Semaine 3** :
- ✅ Produit stable (bugs majeurs fixés)
- ✅ 1-2 témoignages vidéo
- ✅ Case study PDF
- ✅ Début de buzz local (LinkedIn, Instagram)

---

#### **Semaine 4 : Scale à 7 clients (30h)**

**Lundi-Mardi : Outreach intensif (12h)**
```bash
Stratégie : Utiliser la preuve sociale

Template email v2 (avec témoignage) :
---
Objet : [Commerce X] a récupéré 280$ en 2 semaines (anti-gaspi)

Bonjour [Nom],

[Commerce X] jetait 150$/semaine de produits périssables.
Depuis 2 semaines avec Liquida-Choc, il récupère 70$/semaine.

Comment ? SMS automatique à ses clients quand il a du surplus.
Vente en moins de 30 min.

Je cherche 3 nouveaux commerces à Chicoutimi pour tester.
Gratuit pendant 2 semaines.

Vidéo de démo : [lien Loom]
Témoignage client : [lien case study]

Disponible pour passer vous voir cette semaine ?

[Votre nom]
---

- Envoyer 20 emails personnalisés (Lun-Mar)
- Walk-in : 10 commerces (matin + après-midi)
```

**Mercredi-Jeudi : Conversions (10h)**
```bash
- Démos avec prospects intéressés (5-8 démos prévues)
- Closer 3-4 nouveaux clients
- Setup + formation (30 min/client)
```

**Vendredi : Consolidation (8h)**
```bash
- Vérifier que les 7 clients ont tous fait au moins 1 liquidation
- Support proactif (appeler chaque nouveau client)
- Documenter les nouvelles objections/questions (pour FAQ)
- Préparer transition vers ReviewBoost (annonce aux clients)
```

**Livrables fin Semaine 4** :
- ✅ 7 clients Liquida-Choc actifs
- ✅ MRR : ~500$/mois (7 clients × 70$ moyen)
- ✅ Preuve sociale solide (5+ témoignages)

---

### **MOIS 2 : REVIEWBOOST**

#### **Semaine 5 : Dev ReviewBoost (35h)**

**Lundi-Mardi (16h)** : Backend
```bash
Jour 1 (8h) :
- Models (Client, ReviewRequest)
- Twilio SMS (template demande avis)
- Google Places API (génération lien avis)
- Test : Envoyer SMS avec lien Google

Jour 2 (8h) :
- Queue (envoi différé 2h après service)
- Dashboard : Ajout client (formulaire nom + téléphone)
- Webhook tracking clics (via Bitly)
- Test end-to-end
```

**Mercredi-Vendredi (19h)** : Frontend + Polish
```bash
Jour 3 (7h) :
- Dashboard React (liste clients, historique SMS)
- Analytics (taux conversion SMS → Avis)
- Mobile-first (app ou PWA)

Jour 4 (6h) :
- Page landing (pour vendre ReviewBoost)
- Vidéo de démo (2 min, screencast)
- Deploy

Jour 5 (6h) :
- Tests avec 2-3 numéros perso (famille, amis)
- Polish UX (boutons, couleurs, messages)
- Documentation (guide commerçant 1 page)
```

**Livrables fin Semaine 5** :
- ✅ ReviewBoost MVP fonctionnel
- ✅ Landing page live
- ✅ Vidéo de démo prête

---

#### **Semaine 6 : Cross-sell + 2 nouveaux clients (20h)**

**Lundi-Mardi : Cross-sell clients Liquida (10h)**
```bash
Stratégie : Profiter de la relation existante

Script de vente (en personne ou téléphone) :
---
"Hey [Nom], content de voir que Liquida-Choc marche bien pour vous !
 (280$ récupérés le mois dernier, c'est top).

 J'ai développé un 2e outil qui pourrait vous intéresser : ReviewBoost.

 Vous avez combien d'avis Google actuellement ? [Attendre : 10-15]

 Vos concurrents en ont combien ? [Attendre : 30-40]

 ReviewBoost envoie automatiquement un SMS à vos clients satisfaits
 2h après leur passage. Ils cliquent et laissent un avis en 20 secondes.

 Mon client test est passé de 12 à 31 avis en 6 semaines.

 Ça coûte 49$/mois. Vous récupérez ça avec 1 seul nouveau client
 (grâce aux avis supplémentaires).

 Je vous l'installe gratuitement ce week-end. Intéressé ?"
---

Objectif : 3 clients Liquida achètent ReviewBoost (taux de conversion 40%)
```

**Mercredi-Jeudi : Acquérir 2 nouveaux clients (8h)**
```bash
Cibles : Commerces NON-périssables (salons, garages, boutiques)

- Walk-in : 10 salons de coiffure rue Racine
- Email : 15 commerces (liste Yelp/Google Maps)
- Closer 2 nouveaux clients (qui n'ont pas Liquida)
```

**Vendredi : Setup + Support (2h)**
```bash
- Installer ReviewBoost chez les 5 clients
- Formation (15 min/client)
- Check-in dans 3 jours
```

**Livrables fin Semaine 6** :
- ✅ 5 clients ReviewBoost actifs
- ✅ MRR : 500$ (Liquida) + 250$ (Review) = 750$/mois

---

#### **Semaines 7-8 : Scale ReviewBoost à 8 clients (25h)**

```bash
Semaine 7 (15h) :
- Outreach : 30 emails + 15 walk-ins
- Closer 3 nouveaux clients
- Support clients existants

Semaine 8 (10h) :
- Optimisations produit (based on feedback)
- Créer template "Success story" ReviewBoost
  (Client passé de 10 à 35 avis en 4 semaines)
- Préparer lancement ReservaBot
```

**Livrables fin Mois 2** :
- ✅ 7 clients Liquida-Choc
- ✅ 8 clients ReviewBoost
- ✅ MRR : 500$ + 400$ = 900$/mois
- ✅ Cash généré Mois 2 : ~2 500$ (commissions + setup fees)

---

### **MOIS 3 : RESERVABOT**

#### **Semaines 9-10 : Dev ReservaBot (55h)**

**Semaine 9 (30h)** :
```bash
Lundi-Mercredi (24h) : Backend + NLP
- Twilio bidirectionnel (webhooks)
- Parsing dates (Chrono.js)
- Google Calendar API (OAuth + CRUD)
- State machine (gestion contexte conversationnel)
- Tests : Conversations simulées

Jeudi-Vendredi (6h) : Queue rappels
- Bull jobs (24h avant, 2h avant)
- SMS rappel templates
- Gestion annulations (keyword "ANNULE")
```

**Semaine 10 (25h)** :
```bash
Lundi-Mercredi (18h) : Frontend
- Dashboard calendrier (FullCalendar.js)
- Liste réservations du jour
- Handoff manual (si bot bloqué)
- Mobile-responsive

Jeudi-Vendredi (7h) : Polish + Deploy
- Tests end-to-end (10 conversations simulées)
- Vidéo de démo (3 min)
- Landing page
- Deploy
```

**Livrables fin Semaine 10** :
- ✅ ReservaBot MVP fonctionnel
- ✅ Démo ready

---

#### **Semaines 11-12 : Scale ReservaBot à 6 clients (30h)**

**Semaine 11 (20h)** : Lancement
```bash
Cibles : Salons de coiffure + restos

Lundi-Mercredi (15h) :
- Walk-in : 20 salons rue Racine/Talbot
- Démos live (montrer conversation SMS)
- Closer 3 clients pilotes

Jeudi-Vendredi (5h) :
- Setup + intégration Google Calendar
- Formation (45 min/client, plus complexe que Liquida)
```

**Semaine 12 (10h)** : Scale
```bash
- Closer 3 clients supplémentaires (total : 6)
- Support intensif (nouveaux clients = questions)
- Optimisations (bugs, edge cases NLP)
```

**Livrables fin Mois 3** :
- ✅ 7 clients Liquida
- ✅ 8 clients ReviewBoost
- ✅ 6 clients ReservaBot
- ✅ MRR : 500$ + 400$ + 480$ = 1 380$/mois
- ✅ Cash cumulé : ~6 500$

---

### **MOIS 4 : SCALE + EXIT**

#### **Semaines 13-14 : Push acquisition (40h)**

**Objectif** : Atteindre 10 clients/produit (30 clients total)

```bash
Stratégie : Blitz marketing

Semaine 13 (25h) :
- Créer landing pages professionnelles (1/produit)
- Lancer Google Ads local (budget 200$, Chicoutimi only)
  Keywords : "réservation automatique Chicoutimi"
- Post Facebook Groups locaux (Entreprises Saguenay)
- Partenariat UQAC (présentation aux étudiants en gestion)
- Objectif : 5 nouveaux clients (mix produits)

Semaine 14 (15h) :
- Follow-ups leads Google Ads
- Walk-in marathon (30 commerces en 3 jours)
- Closer 3-5 clients supplémentaires
- Total : 25-28 clients actifs
```

**Livrables fin Semaine 14** :
- ✅ 25+ clients actifs
- ✅ MRR : 1 800$-2 000$/mois
- ✅ Cash total généré : 9 000$-11 000$

---

#### **Semaine 15 : Automatisation & Documentation (30h)**

**Préparation exit** :

```bash
Lundi-Mardi (12h) : Support automatisé
- Créer FAQ exhaustive (20 questions)
- Vidéos tutoriels (1/produit, 5 min chacune)
- Chatbot support basique (Crisp.chat)
- Objectif : Réduire le temps support de 10h/semaine à 2h/semaine

Mercredi-Jeudi (12h) : Documentation technique
- README.md détaillés (setup, deploy, troubleshooting)
- Schémas architecture (diagrammes)
- Changelog complet
- Scripts d'automatisation (backup DB, monitoring)

Vendredi (6h) : Playbook business
- Processus vente (scripts, objections)
- Processus onboarding (checklist)
- Processus support (SLA, escalation)
- Metrics dashboard (MRR, churn, LTV)
```

**Livrables fin Semaine 15** :
- ✅ Documentation complète (tech + business)
- ✅ Support largement automatisé
- ✅ Produits autonomes (peuvent tourner sans vous)

---

#### **Semaine 16 : Exit Strategy (20h)**

**Option A : Vente de l'asset**

```bash
Lundi-Mardi (10h) : Préparation vente
- Créer pitch deck acquéreur (15 slides)
  * Traction (MRR, churn, clients)
  * Tech stack (code quality, tests)
  * Opportunités (roadmap, expansion Québec/Montréal)
- Valorisation : 15k-25k$ (3-5× ARR)

Mercredi-Jeudi (8h) : Prospection acquéreurs
- Développeurs locaux Chicoutimi (Facebook, LinkedIn)
- Agences web Saguenay (10 agences identifiées)
- Étudiants UQAC en info (votre réseau)
- Marketplaces SaaS (Flippa, Acquire.com)

Vendredi (2h) : Négociation
- Closer 1-2 acheteurs intéressés
- Deal structure :
  * 50% upfront (7 500$-12 500$)
  * 50% après 3 mois (earn-out basé sur rétention clients)
- Transition : 2 semaines de formation acquéreur
```

**Option B : Revenus passifs**

```bash
Lundi-Vendredi (20h) : Automatisation complète
- Embaucher VA Philippines (5$/h, 10h/semaine)
  * Support client (email, chat)
  * Onboarding nouveaux clients
  * Billing & facturation
- Coût : 200$/mois

Setup monitoring :
- Alertes Sentry (erreurs critiques)
- Dashboard Stripe (MRR, failed payments)
- Zapier automation (new client → onboarding email auto)

Résultat :
- Vous gardez le MRR (1 800$/mois)
- Coût VA : 200$/mois
- Profit net : 1 600$/mois
- Votre temps : 2-3h/semaine (supervision VA)

En Asie :
- 1 600$/mois × 12 = 19 200$/an de revenus passifs
- Financement partiel de votre Master
```

**Livrables fin Semaine 16** :
- ✅ Asset vendu (15k-25k$ cash) OU
- ✅ Revenus passifs setup (1 600$/mois)
- ✅ Transition complète (vous partez serein)

---

## 💰 PROJECTION FINANCIÈRE DÉTAILLÉE

### **Revenus mois par mois**

```
MOIS 1 (Liquida-Choc only)
├─ Semaine 1 : 0$ (dev)
├─ Semaine 2 : 300$ (3 clients × 100$ setup fee)
├─ Semaine 3 : 200$ (commissions)
└─ Semaine 4 : 500$ (4 nouveaux clients × 100$ setup + commissions)
TOTAL MOIS 1 : 1 000$

MOIS 2 (Liquida + ReviewBoost)
├─ Liquida MRR : 500$/mois (7 clients × 70$ moyen)
├─ ReviewBoost setup fees : 800$ (8 clients × 100$)
├─ ReviewBoost MRR début : 150$/mois (prorata)
└─ Total : 1 450$
TOTAL CUMULÉ : 2 450$

MOIS 3 (Liquida + Review + ReservaBot)
├─ Liquida MRR : 500$
├─ ReviewBoost MRR : 400$ (8 clients × 50$ moyen)
├─ ReservaBot setup fees : 1 200$ (6 clients × 200$)
├─ ReservaBot MRR début : 240$/mois (prorata)
└─ Total : 2 340$
TOTAL CUMULÉ : 4 790$

MOIS 4 (Scale + Exit)
├─ Liquida MRR : 700$ (10 clients)
├─ ReviewBoost MRR : 500$ (10 clients)
├─ ReservaBot MRR : 600$ (8 clients)
├─ Setup fees nouveaux clients : 800$
└─ Total : 2 600$
TOTAL CUMULÉ : 7 390$

EXIT (fin Mois 4)
├─ Option A : Vente asset : 15 000$ - 25 000$
├─ Option B : Revenus passifs : 1 600$/mois ongoing
```

**Résumé** :
- **Cash généré sur 4 mois** : 7 390$
- **MRR final** : 1 800$/mois
- **Exit value** : 15k-25k$ (vente) OU 19k$/an (passif)

**Total potentiel** : 22 000$ - 32 000$ en 4 mois (cash + exit)

---

## 📞 SCRIPTS DE VENTE PRÊTS À L'EMPLOI

### **Script 1 : Cold Walk-In (2 min)**

```
[Entrer dans le commerce, attendre que le proprio/manager soit disponible]

VOUS : "Bonjour ! Je suis [Nom], étudiant français en info à l'UQAC.
       Je développe des outils pour aider les commerces de Chicoutimi.
       Vous avez 2 minutes ?"

[S'ils disent oui]

VOUS : "Parfait. Question rapide : vous jetez combien de produits par
       semaine à cause de la date d'expiration ?"

[Ils donnent un chiffre, ex: 10-20 items]

VOUS : "OK, 15 items. À combien en moyenne ?"

[Ex: 15-20$]

VOUS : "15 items × 18$ = 270$/semaine = 1 080$/mois à la poubelle.

       J'ai créé Liquida-Choc : un bouton sur votre téléphone.
       Vous cliquez → 200 clients reçoivent un SMS avec une promo flash.
       Vous vendez à -50% au lieu de jeter à -100%.

       Mon client sushi récupère 450$/mois. Ça vous coûte 10% des ventes
       réussies (donc si vous vendez 450$, je prends 45$, vous gardez 405$).

       Je vous l'installe gratuitement. Vous testez 1 semaine.
       Si ça marche pas, vous arrêtez. Sans frais.

       Intéressé ?"

[Gérer l'objection "Je vais réfléchir"]

VOUS : "Pas de souci ! Voici ma carte. Juste une dernière question :
       quel jour de la semaine vous jetez le plus ?"

[Ex: Vendredi soir]

VOUS : "OK. Je repasse vendredi à 18h, on fait un test ensemble.
       Ça vous va ?"

[Closer le rendez-vous]
```

---

### **Script 2 : Follow-Up Téléphone (1 min)**

```
[Appeler le prospect qui a dit "Je vais réfléchir"]

VOUS : "Bonjour [Nom], c'est [Votre nom], on s'est vus mardi pour
       Liquida-Choc. Vous avez eu le temps d'y penser ?"

[S'ils disent non ou hésitent]

VOUS : "Pas de problème. Juste pour info : mon client [Nom Commerce]
       a fait sa première liquidation hier soir. 12 plateaux vendus
       en 20 minutes. 150$ récupérés.

       Je peux vous montrer la même chose vendredi soir ?
       Je passe 30 minutes, on teste ensemble."

[Closer le rendez-up]
```

---

### **Script 3 : Cross-Sell (clients existants)**

```
[Call ou visite en personne]

VOUS : "Hey [Nom] ! Comment va Liquida-Choc ?"

[Laisser parler, écouter feedback]

VOUS : "Super content que ça marche ! (280$ récupérés, c'est énorme).

       Petite question : vous avez combien d'avis Google actuellement ?"

[Ex: 12 avis]

VOUS : "12, OK. Vous savez que 88% des gens lisent les avis avant
       de choisir un commerce ? Vos concurrents en ont combien ?"

[Ex: 35 avis]

VOUS : "35. Donc statistiquement, ils ont 3× plus de chances d'être
       choisis que vous (juste à cause des avis).

       J'ai développé ReviewBoost : après chaque client, il reçoit
       un SMS 2h plus tard avec un lien direct vers Google Avis.
       Vous tapez juste son numéro dans l'app (5 secondes).

       Mon client est passé de 10 à 32 avis en 6 semaines.

       Ça coûte 49$/mois. Vous récupérez ça avec 1 seul nouveau client
       (grâce aux avis en plus).

       Je vous l'installe ce week-end gratuitement. Intéressé ?"

[Closer]
```

---

## 📊 STRATÉGIE DE PRICING DYNAMIQUE

### **Principes généraux**

1. **Prix d'appel bas** (Mois 1-2) :
   - Objectif : Acquérir clients pilotes rapidement
   - Liquida-Choc : Gratuit 2 semaines, puis 10% commission OU 99$/mois flat
   - ReviewBoost : 39$/mois (au lieu de 49$) pour early adopters

2. **Augmentation progressive** (Mois 3-4) :
   - Grandfathering : Anciens clients gardent ancien prix
   - Nouveaux clients : +20% sur prix initial
   - Justification : "Fonctionnalités supplémentaires + support amélioré"

3. **Bundling** (Mois 4) :
   - Liquida + Review : 120$/mois (au lieu de 140$ séparément)
   - Liquida + Review + Reserva : 200$/mois (au lieu de 250$)
   - Économie de 15-20% → incite à acheter plusieurs produits

---

### **Grille tarifaire finale (Mois 4)**

#### **Liquida-Choc**
```
Starter : Commission 10% uniquement
- Pas de frais fixes
- Pour commerces avec faible volume

Pro : 99$/mois flat
- SMS illimités (jusqu'à 500/mois)
- Support prioritaire
- Pour commerces avec volume élevé (>10 liquidations/mois)
```

#### **ReviewBoost**
```
Basic : 49$/mois
- Jusqu'à 100 SMS/mois
- Dashboard analytics

Pro : 79$/mois
- SMS illimités
- Intégration POS (API Square, Lightspeed)
```

#### **ReservaBot**
```
Solo : 79$/mois
- 1 employé
- Google Calendar sync

Team : 129$/mois
- 2-5 employés
- Multi-calendriers

Enterprise : 199$/mois
- 6+ employés
- API custom
```

#### **Bundles (recommandés)**
```
Combo Starter : Liquida + Review
- 120$/mois (économie 28$/mois)

Combo Pro : Liquida + Review + Reserva
- 200$/mois (économie 50$/mois)
```

---

## 🚪 EXIT STRATEGY DÉTAILLÉE

### **Option A : Vendre l'asset (Quick Exit)**

#### **Valorisation**

**Méthode 1 : Multiple de l'ARR**
```
MRR fin Mois 4 : 1 800$/mois
ARR (Annual Recurring Revenue) : 1 800$ × 12 = 21 600$

Multiple SaaS micro-business : 1-3× ARR (selon qualité)

Valuation basse (1×) : 21 600$
Valuation moyenne (2×) : 43 200$
Valuation haute (3×) : 64 800$

Prix réaliste (compte tenu marché niche + code simple) : 25 000$ - 35 000$
```

**Méthode 2 : Payback period**
```
Un acquéreur veut récupérer son investissement en 12-18 mois

Si MRR = 1 800$/mois, profit net = ~1 400$/mois (après coûts)
Payback 12 mois : 1 400$ × 12 = 16 800$
Payback 18 mois : 1 400$ × 18 = 25 200$

Prix juste : 20 000$ - 25 000$
```

**Prix de vente recommandé** : **25 000$**

---

#### **Profil acquéreur idéal**

1. **Développeur local Chicoutimi/Saguenay**
   - Veut du MRR sans partir de zéro
   - Connaît le marché local
   - Peut maintenir le code

2. **Agence web locale**
   - Veut ajouter des produits SaaS à son offre
   - Clients existants = cross-sell facile
   - Équipe technique en place

3. **Étudiant UQAC en info/gestion**
   - Cherche un side-project rentable
   - Budget limité (négociation possible)
   - Vous formez = succession facile

4. **Investisseur micro-SaaS**
   - Achète des petits SaaS rentables
   - Gère un portfolio de 5-10 micro-SaaS
   - Marketplace : Flippa, Acquire.com, MicroAcquire

---

#### **Deal structure**

**Option 1 : Cash upfront (rapide)**
```
- 100% payé à la signature (25 000$)
- Transition : 2 semaines de formation
- Support post-vente : 30 jours (email uniquement)

Avantages :
✅ Cash immédiat
✅ Clean exit (vous partez tranquille)

Inconvénients :
⚠️ Risque acquéreur (s'il gâche les clients, pas votre problème mais mauvaise réputation)
```

**Option 2 : Earn-out (sécurisé)**
```
- 60% upfront (15 000$)
- 40% après 3 mois (10 000$) si :
  * 80%+ des clients sont retenus (churn < 20%)
  * MRR maintenu à 1 500$+ minimum
- Transition : 1 mois (support actif)

Avantages :
✅ Vous assurez la continuité (bonne réputation)
✅ Acquéreur rassuré (paye le reste que si ça marche)

Inconvénients :
⚠️ Vous devez rester impliqué 3 mois (depuis l'Asie, mais possible)
```

**Recommandation** : **Option 2** (earn-out) pour maximiser valeur + réputation.

---

#### **Processus de vente (Semaine 16)**

**Lundi : Préparer asset**
```
- Audit code (clean up, commentaires)
- Documentation technique complète
- Playbook business (scripts vente, processus)
- Dashboard financier (MRR, churn, LTV, CAC)
```

**Mardi-Mercredi : Prospection acquéreurs**
```
- Post LinkedIn/Facebook :
  "Je vends mon portefeuille SaaS local Chicoutimi.
   3 produits, 25+ clients, 1 800$/mois MRR.
   Intéressé ? DM moi."

- Email agences web Saguenay (10 agences)
- Post Flippa/Acquire.com (marketplaces SaaS)
```

**Jeudi : Démos & Négociations**
```
- Calls avec 3-5 acquéreurs intéressés
- Montrer dashboard, metrics, code
- Négocier prix
```

**Vendredi : Closer**
```
- Signer LOI (Letter of Intent)
- Recevoir 50% upfront (12 500$)
- Commencer transition (documentation, intros clients)
```

**Semaines suivantes (depuis l'Asie)** :
- Support email acquéreur (2-3h/semaine)
- Monitoring rétention clients
- Recevoir 50% restant après 3 mois (12 500$)

---

### **Option B : Revenus passifs (Long-Term)**

#### **Setup automation complète**

**Embaucher VA (Virtual Assistant)**

**Profil VA idéal** :
- Philippines (coût 5-8$/h)
- Anglais fluent + français basique
- Expérience customer support SaaS
- Disponible 10-15h/semaine

**Plateforme** : Upwork, OnlineJobs.ph

**Coût** : 200-300$/mois (10h/semaine × 5$/h × 4 semaines)

---

**Responsabilités VA** :
1. **Support client** (5h/semaine)
   - Répondre emails (via Gmail shared inbox)
   - Résoudre bugs simples (avec playbook)
   - Escalade vers vous si complexe

2. **Onboarding nouveaux clients** (3h/semaine)
   - Appel de bienvenue (script fourni)
   - Configuration compte (via dashboard admin)
   - Formation (vidéo pré-enregistrée + Q&A)

3. **Billing & Collections** (2h/semaine)
   - Relance paiements échoués (Stripe auto + email manuel)
   - Mise à jour infos billing clients
   - Reporting mensuel (MRR, churn)

---

**Outils automation** :

1. **Intercom ou Crisp.chat** (gratuit jusqu'à 50 contacts)
   - Chatbot répond à 70% des questions basiques
   - VA gère les 30% restants

2. **Zapier** (plan gratuit : 100 tasks/mois)
   - Nouveau client Stripe → Email onboarding auto
   - Paiement échoué → Email relance auto
   - Nouveau ticket support → Notification Slack VA

3. **Loom** (gratuit)
   - Enregistrer 5-10 vidéos tutoriels (1/produit)
   - VA envoie liens vidéos aux clients (au lieu d'expliquer)

4. **Google Sheets + Zapier**
   - Auto-sync Stripe → Google Sheets (MRR dashboard)
   - Vous consultez 1×/semaine (5 min)

---

**Votre temps requis** : **2-3h/semaine**

```
Lundi (1h) :
- Check dashboard MRR/churn
- Lire résumé VA (email hebdo)
- Approuver décisions importantes

Mercredi (30 min) :
- Call Zoom avec VA (sync)

Vendredi (30 min) :
- Review tickets support escaladés
- Fixer bugs critiques (si any)

Total : 2h/semaine = 8h/mois
```

---

**Projection revenus passifs** :

```
MRR : 1 800$/mois
Coûts :
- VA : 250$/mois
- Outils (Zapier, Crisp, etc.) : 50$/mois
- Infra (Railway, Vercel, etc.) : 70$/mois
Total coûts : 370$/mois

Profit net : 1 430$/mois

Votre taux horaire effectif :
1 430$/mois ÷ 8h/mois = 179$/heure

Revenu annuel : 1 430$ × 12 = 17 160$/an
(Pendant votre Master en Asie)
```

---

**Croissance organique** :

Même sans vous, le bouche-à-oreille continue :
```
Mois 5-8 (depuis l'Asie) : +2-3 clients/mois (via références)
Mois 9-12 : Stabilisation à 30-35 clients
MRR fin Année 1 : 2 200$/mois
Profit net : 1 800$/mois
```

**Décision Année 2** :
- Garder (21 600$/an passif)
- Vendre (valuation : 40k-60k$ avec 1 an de track record)
- Scaler (embaucher sales VA, viser 100 clients)

---

### **Comparaison Option A vs B**

| Critère | Option A (Vente) | Option B (Passif) |
|---------|------------------|-------------------|
| **Cash immédiat** | 25 000$ | 0$ |
| **Revenus long-term** | 0$ | 17 160$/an |
| **Temps requis** | 2 semaines transition | 2-3h/semaine ongoing |
| **Risque** | Zéro (clean exit) | Moyen (churn, bugs) |
| **Upside** | Limité (prix fixe) | Élevé (croissance organique) |
| **Recommandé si** | Besoin cash maintenant | Pas pressé, aime le projet |

**Recommandation personnelle** :

Vu votre situation (besoin cash pour Master) : **Option A (Vente)** avec earn-out.

**Mais** : Si vous obtenez une bourse ou un autre financement, **Option B** est plus rentable long-term (17k$/an > 25k$ one-shot sur 2 ans).

**Compromis** : Vendre 50% des parts (12 500$ cash) + garder 50% (revenus passifs 700$/mois).

---

## ✅ CHECKLIST FINALE (Jour 0 → Jour 120)

### **Semaine 0 (Préparation)**
- [ ] Lire tous les fichiers Markdown (analysis, new-ideas, roadmap, claude)
- [ ] Setup environnement dev (Node, MongoDB Atlas, Stripe test)
- [ ] Créer comptes services (Twilio trial, Railway, Vercel)
- [ ] Budget initial : 200-300$ (Twilio, domaine, Google Ads)
- [ ] Identifier 20 prospects cibles (Google Maps)

### **Mois 1 (Liquida-Choc)**
- [ ] Dev MVP (50h)
- [ ] Acquérir 7 clients
- [ ] Générer 1 000$ cash
- [ ] Créer 2 témoignages vidéo

### **Mois 2 (ReviewBoost)**
- [ ] Dev ReviewBoost (35h)
- [ ] Acquérir 8 clients
- [ ] MRR total : 900$/mois
- [ ] Cash cumulé : 2 500$

### **Mois 3 (ReservaBot)**
- [ ] Dev ReservaBot (55h)
- [ ] Acquérir 6 clients
- [ ] MRR total : 1 380$/mois
- [ ] Cash cumulé : 4 800$

### **Mois 4 (Scale + Exit)**
- [ ] Push acquisition (25+ clients total)
- [ ] MRR total : 1 800$+/mois
- [ ] Cash cumulé : 7 500$+/mois
- [ ] Décider : Vendre (25k$) OU Passif (1 430$/mois)

### **Exit**
- [ ] Documentation complète (tech + business)
- [ ] Transition acquéreur OU Setup VA
- [ ] Partir serein pour l'Asie 🌏

---

## 🚀 CALL TO ACTION

**Vous avez maintenant** :
1. ✅ Analyse complète (pourquoi Liquida-Choc est gagnant)
2. ✅ 3 nouvelles idées (ReviewBoost, ReservaBot, InstaBot)
3. ✅ Roadmap détaillée (semaine par semaine)
4. ✅ Scripts de vente (prêts à l'emploi)
5. ✅ Exit strategy (vente 25k$ ou passif 17k$/an)

**Next steps (CETTE SEMAINE)** :

1. **Aujourd'hui** : Décider de vous lancer (ou pas)
2. **Demain** : Setup environnement dev (MongoDB, Stripe, Twilio)
3. **Lundi prochain** : Commencer le code (Day 1/7 du MVP)
4. **Dans 7 jours** : MVP fonctionnel
5. **Dans 14 jours** : Premier client pilote

**Dans 4 mois** : 25 000$ cash + billet d'avion pour l'Asie. ✈️

**Let's gooooo ! 🔥**
