# Guide de test & debug

---

## Démarrer

```bash
# Terminal 1 — lance tout
npm run dev

# Terminal 2 — Stripe (si tu tests les paiements)
stripe listen --forward-to localhost:3000/webhook

# Terminal 3 — init le merchant (une seule fois)
curl -X POST http://localhost:3000/api/setup \
  -H "Authorization: Bearer $(grep SETUP_SECRET .env | cut -d= -f2)" \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Test Commerce","address":"123 Rue Test, Montréal"}'
```

Ouvre `http://localhost:5173` dans le browser. C'est ça, ton "Telegram".

---

## Ton outil principal : DevTools

Comme dans Python tu ouvres la console pour voir les erreurs, en JS tu fais **F12** (ou Cmd+Option+I sur Mac). Deux onglets sont critiques :

### Console — les erreurs

C'est ici que les trucs cassent. Si une page est blanche ou qu'un bouton fait rien, **regarde ici d'abord**.

```
❌ Ressemble à une erreur Python :
  TypeError: Cannot read properties of undefined (reading 'map')
      at Dashboard (Dashboard.jsx:42)

  → Ça veut dire : ligne 42 de Dashboard.jsx, une variable est undefined
    et tu essaies de faire .map() dessus
```

### Network — les requêtes API

C'est ici que tu vois ce qui se passe entre le frontend et le backend. Comme si tu regardais les requêtes HTTP dans Postman mais en temps réel.

Clique sur l'onglet **Network**, puis fais une action dans l'appli. Tu vois apparaître les requêtes :

```
✅  200  GET   /api/merchant        → ça a marché
✅  201  POST  /api/subscribers     → abonné créé
❌  500  POST  /api/liquidations/create  → erreur serveur
❌  400  POST  /api/subscribers     → données invalides
```

Clic sur une requête → onglet **Response** : tu vois exactement ce que le serveur a retourné. C'est ton equivalent à regarder les logs FastAPI.

---

## Le workflow — comment tester

### Comme avec Telegram : tu fais une action, tu regardes ce qui se passe

```
Action dans le browser          →  Ce que tu regardes
────────────────────────────────────────────────────────────
Ouvrir localhost:5173            →  Console : pas d'erreur rouge ?
                                    Network : GET /api/merchant → 200 ?

Aller sur /subscribers          →  Network : GET /api/subscribers → 200 ?
Ajouter un abonné               →  Network : POST /api/subscribers → 201 ?
                                    Console : pas d'erreur ?
                                    La liste se met à jour ?

Aller sur /liquidation          →  Les 3 templates s'affichent ?
Cliquer "Petit lot"             →  Le résumé apparaît avec les bons chiffres ?
Cliquer "Créer et envoyer SMS"  →  Network : POST /liquidations/create → 201 ?
                                    Network : POST /liquidations/:id/send → 200 ?
                                    Terminal 1 : "SMS broadcast done : X/Y"

Aller sur /sales                →  Si un paiement a été fait via Stripe :
                                    Network : GET /api/sales → pending non vide ?
Cliquer "✅ Remis"              →  Network : PATCH /api/sales/:id/complete → 200 ?
                                    La vente disparaît de pending ?

Aller sur /settings             →  Les champs sont pré-remplis ?
Changer un prix, sauvegarder    →  Network : PUT /api/merchant → 200 ?
                                    Retourner sur /liquidation : le prix a changé ?

Ouvrir /subscribe (autre onglet)→  Le nom du commerce s'affiche ?
Entrer un numéro, s'abonner     →  Network : POST /api/subscribers → 201 ?
```

---

## Quand ça casse — diagnostic rapide

### "La page est blanche"

1. Ouvre **Console** (F12)
2. Il y a forcément une erreur en rouge
3. Elle te donne le fichier et la ligne. Ouvre ce fichier, va à cette ligne.

### "Le bouton fait rien"

1. Ouvre **Network**, clique sur le bouton
2. Une requête apparaît ? Non → le problème est dans le JS du composant (event handler pas attaché)
3. Une requête apparaît avec un code d'erreur ? → regarde la **Response** pour voir pourquoi le serveur refuse

### "Les données ne s'affichent pas"

1. **Network** → cherche la requête GET correspondante
2. Elle retourne 200 ? Clic dessus → **Response** → les données sont là ?
3. Oui les données sont dans la Response mais pas dans l'UI → le problème est dans le composant React (mauvais champ, mauvaise variable)
4. La requête retourne 404 → le merchant n'est pas initialisé (`/api/setup` pas appelé)

### "Ça marche en dev mais pas en prod (Railway)"

1. Ouvre Railway → onglet **Logs** : cherche les erreurs
2. Vérifie que les env vars sont bien configurées (surtout `MONGODB_URI`, `STRIPE_SECRET_KEY`)
3. Vérifie que le `dist/` a été buildé (`npm run build` dans le Railway build command)

### "Le webhook Stripe ne déclenche rien"

1. **Terminal 2** (Stripe CLI) : tu vois les events qui arrivent ?
2. Oui mais le serveur retourne une erreur → **Terminal 1** : cherche l'erreur du webhook
3. Pas d'events du tout → vérifie que `stripe listen` tourne bien
4. En prod : Stripe Dashboard → Webhooks → ton endpoint → Tentatives : tu vois quoi ?

### "Le SMS ne part pas"

1. **Terminal 1** : cherche `SMS failed to` ou `SMS broadcast done`
2. Si `0/X envoyés` → erreur Twilio. Le message d'erreur est loggé juste avant
3. Classiques : numéro pas en E.164 (`+15141234567`), numéro Twilio pas vérifié, AUTH_TOKEN wrong

---

## Lire une erreur JSX — comme une erreur Python

```python
# Python — tu connais ça :
Traceback (most recent call last):
  File "app.py", line 42, in handle
    data = response.json()
AttributeError: 'NoneType' object has no attribute 'json'

# JS — même logique, syntaxe différente :
Uncaught TypeError: Cannot read properties of null (reading 'json')
    at handle (app.js:42:18)

# Les deux disent la même chose :
# → ligne 42, une variable est null/None, tu essaies d'appeler une méthode dessus
```

Règle : **lis la dernière ligne d'abord** (le message), puis la ligne juste en dessous (le fichier + numéro de ligne). Le reste du stack trace est le chemin d'appel — même comme en Python.

---

## Regarder les données en direct

Tu veux voir ce qui est vraiment dans la DB sans attendre que l'UI l'affiche ?

```bash
# Dans le browser, onglet Console, tape :
fetch('/api/merchant').then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)))

# Ça affiche tout le doc Merchant avec les subscribers, liquidations, sales
# C'est ton équivalent à faire une SELECT * dans pgAdmin
```

Tu peux faire ça pour n'importe quelle route :
```js
fetch('/api/sales').then(r => r.json()).then(d => console.log(d))
fetch('/api/subscribers').then(r => r.json()).then(d => console.log(d))
```

---

## Résumé : ta routine de debug

```
1. F12 → Console ouvert en permanence
2. Faire l'action
3. Erreur rouge ? → aller au fichier:ligne indiqué
4. Pas d'erreur mais rien ne marche ? → onglet Network, regarder les requêtes
5. Requête en erreur ? → clic dessus → Response → lire le message
6. Tout semble correct dans le browser ? → Terminal 1, regarder les logs backend
```
