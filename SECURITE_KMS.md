# 🔐 Guide Sécurité - Gestion des Clés (KMS)

## ⚠️ Point Faible Identifié par Gemini

> "Ta faille n'est pas dans l'architecture, mais dans la **gestion humaine des clés**. Comme tu n'utilises pas de coffre-fort de clés (KMS), assure-toi que tes .env sur Vercel ne sont jamais partagés et que ton accès Vercel est protégé par une authentification à deux facteurs (2FA)."

---

## 🎯 Contexte

L'architecture LiquidaChoc utilise des **variables d'environnement** (`.env`) pour stocker les secrets :
- Clés Stripe (paiements)
- Tokens Twilio (SMS)
- Credentials MongoDB (données)
- API Keys Cloudinary (photos)

**Sans KMS (Key Management System)**, la sécurité repose sur les **bonnes pratiques humaines**.

---

## 🔴 Risques Actuels

| Risque | Impact | Probabilité |
|--------|--------|-------------|
| **Leak accidentel .env** | 🔥 CRITIQUE | ⚠️ MOYEN |
| **Accès Vercel non-2FA** | 🔥 CRITIQUE | ⚠️ MOYEN |
| **Partage clés par email/Slack** | 🔥 CRITIQUE | ⚠️ FAIBLE |
| **Commit .env dans Git** | 🔥 CRITIQUE | ✅ BLOQUÉ (.gitignore) |
| **Screenshot .env partagé** | 🔥 CRITIQUE | ⚠️ FAIBLE |

---

## ✅ Solutions Immédiates (Sans KMS)

### 1. **Activer 2FA sur TOUS les comptes**

#### Vercel (CRITIQUE)
```bash
# 1. Vercel Dashboard → Settings → Security
# 2. Enable Two-Factor Authentication
# 3. Scanner le QR code avec Google Authenticator / Authy
# 4. Sauvegarder les backup codes HORS LIGNE
```

#### Stripe (CRITIQUE)
```bash
# 1. Stripe Dashboard → Settings → Team → Two-step authentication
# 2. Enable pour tous les membres de l'équipe
```

#### MongoDB Atlas (CRITIQUE)
```bash
# 1. MongoDB Atlas → Account → Security Settings
# 2. Enable Two-Factor Authentication
```

#### Twilio (IMPORTANT)
```bash
# 1. Twilio Console → Settings → Security
# 2. Enable Two-Factor Authentication
```

#### Cloudinary (IMPORTANT)
```bash
# 1. Cloudinary Dashboard → Settings → Security
# 2. Enable Two-Factor Authentication
```

---

### 2. **Restreindre l'accès aux variables d'environnement**

#### Vercel - Permissions d'équipe
```bash
# 1. Vercel Dashboard → Settings → Team
# 2. Créer des rôles :
#    - ADMIN : Toi uniquement (accès aux env vars)
#    - DEVELOPER : Équipe (pas d'accès aux env vars)
#    - VIEWER : Clients (lecture seule)

# 3. Variables d'environnement → "Sensitive"
# → Masque automatiquement les valeurs dans l'UI
```

---

### 3. **Ne JAMAIS partager les clés**

#### ❌ À NE JAMAIS FAIRE
```bash
# Par email
"Salut, voici la clé Stripe : sk_live_xxx..."

# Par Slack
"La clé Twilio est : ACxxx..."

# Par screenshot
[capture d'écran du .env]

# Par Google Docs
"Clés production : sk_live_xxx, ACxxx..."
```

#### ✅ À FAIRE
```bash
# 1. Utiliser Vercel UI pour ajouter les variables
# 2. Ou utiliser Vercel CLI avec stdin :
vercel env add STRIPE_SECRET_KEY

# 3. Pour partager avec l'équipe :
#    → Les membres ajoutent leurs propres clés
#    → Ou utiliser un Password Manager d'équipe (1Password, Bitwarden)
```

---

### 4. **Rotation des clés (tous les 90 jours)**

#### Checklist rotation
```bash
# Tous les 3 mois :
[ ] Stripe : Générer nouvelle clé → Update Vercel → Supprimer ancienne
[ ] Twilio : Regénérer Auth Token → Update Vercel
[ ] MongoDB : Changer password user → Update Vercel
[ ] Cloudinary : Regénérer API Secret → Update Vercel
[ ] Setup Secret : Nouveau random → Update Vercel
```

#### Script rotation automatique
```bash
#!/bin/bash
# rotate_secrets.sh

# Générer nouveau Setup Secret
NEW_SECRET=$(openssl rand -hex 32)
vercel env add SETUP_SECRET production <<< "$NEW_SECRET"

echo "✅ Setup Secret rotated"
```

---

### 5. **Audit des accès**

#### Log Vercel
```bash
# Vercel Dashboard → Settings → Audit Log
# Vérifier régulièrement :
# - Qui a accès aux variables d'environnement ?
# - Qui s'est connecté récemment ?
# - Changements de configuration ?
```

#### MongoDB Atlas
```bash
# MongoDB Atlas → Security → Database Access
# Vérifier :
# - Utilisateurs actifs
# - IP Whitelist
# - Dernière connexion
```

#### Stripe
```bash
# Stripe Dashboard → Developers → Logs
# Vérifier :
# - Activité API inhabituelle
# - Webhooks échoués
```

---

## 🔐 Solution Pro : Migration vers KMS (Optionnel)

### Option 1 : Vercel Environment Groups + Vercel KMS (Preview)
```bash
# Vercel KMS (Beta) - Cryptage automatique
# https://vercel.com/docs/security/encryption

vercel env add --encrypted STRIPE_SECRET_KEY
```

### Option 2 : HashiCorp Vault (Self-hosted)
```bash
# 1. Installer Vault
docker run -d -p 8200:8200 vault

# 2. Backend fetch secrets au démarrage
const vault = require('node-vault')({ endpoint: 'http://vault:8200' })
const secrets = await vault.read('secret/liquidachoc/commerce1')
```

**Coût :** ~$20/mois (instance Vault) + complexité

### Option 3 : AWS Secrets Manager
```bash
# 1. Créer secret dans AWS
aws secretsmanager create-secret --name liquidachoc/stripe --secret-string "sk_live_xxx"

# 2. Backend fetch au démarrage
const AWS = require('aws-sdk')
const secretsManager = new AWS.SecretsManager()
const secret = await secretsManager.getSecretValue({ SecretId: 'liquidachoc/stripe' }).promise()
```

**Coût :** $0.40/secret/mois + $0.05 per 10k API calls

### Option 4 : Google Cloud Secret Manager
```bash
# 1. Créer secret dans GCP
gcloud secrets create stripe-key --data-file=- <<< "sk_live_xxx"

# 2. Backend fetch au démarrage
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager')
const client = new SecretManagerServiceClient()
const [version] = await client.accessSecretVersion({ name: 'projects/xxx/secrets/stripe-key/versions/latest' })
```

**Coût :** $0.06 per 10k access operations

---

## 📊 Comparaison Solutions

| Solution | Coût | Complexité | Sécurité | Recommandé |
|----------|------|------------|----------|------------|
| **Vercel Env Vars + 2FA** | $0 | ✅ Faible | ⭐⭐⭐ | ✅ Pour 1-20 commerces |
| **Vercel KMS (Beta)** | $0 | ✅ Faible | ⭐⭐⭐⭐ | ✅ Quand disponible |
| **HashiCorp Vault** | $20/mois | ⚠️ Élevée | ⭐⭐⭐⭐⭐ | ⚠️ Si 50+ commerces |
| **AWS Secrets Manager** | $0.40/secret | ⚠️ Moyenne | ⭐⭐⭐⭐⭐ | ⚠️ Si déjà sur AWS |
| **GCP Secret Manager** | $0.06/10k ops | ⚠️ Moyenne | ⭐⭐⭐⭐⭐ | ⚠️ Si déjà sur GCP |

---

## ✅ Checklist Sécurité Immédiate

### À faire MAINTENANT
- [ ] Activer 2FA sur Vercel (CRITIQUE)
- [ ] Activer 2FA sur Stripe (CRITIQUE)
- [ ] Activer 2FA sur MongoDB Atlas (CRITIQUE)
- [ ] Activer 2FA sur Twilio
- [ ] Activer 2FA sur Cloudinary
- [ ] Vérifier que `.env` est dans `.gitignore`
- [ ] Marquer variables Vercel comme "Sensitive"
- [ ] Restreindre permissions équipe Vercel

### À faire dans les 7 jours
- [ ] Créer Password Manager équipe (1Password/Bitwarden)
- [ ] Documenter procédure rotation des clés
- [ ] Planifier rotation tous les 90 jours (calendrier)
- [ ] Former l'équipe sur bonnes pratiques

### À faire dans les 30 jours
- [ ] Audit complet des accès (Vercel/Stripe/MongoDB)
- [ ] Vérifier logs Vercel pour activité suspecte
- [ ] Tester procédure de révocation d'urgence

---

## 🚨 Procédure d'Urgence (Leak de clé)

### Si une clé Stripe leak :
```bash
# 1. IMMÉDIAT : Révoquer la clé
Stripe Dashboard → Developers → API Keys → Roll key

# 2. Update Vercel
vercel env rm STRIPE_SECRET_KEY production
vercel env add STRIPE_SECRET_KEY production

# 3. Vérifier Stripe Logs pour activité suspecte
Stripe Dashboard → Developers → Logs

# 4. Contacter Stripe Support si nécessaire
```

### Si Auth Token Twilio leak :
```bash
# 1. Regénérer immédiatement
Twilio Console → Settings → Auth Tokens → Reset

# 2. Update Vercel
vercel env rm TWILIO_AUTH_TOKEN production
vercel env add TWILIO_AUTH_TOKEN production

# 3. Vérifier usage Twilio
Twilio Console → Monitor → Logs
```

### Si MongoDB credentials leak :
```bash
# 1. Changer password immédiatement
MongoDB Atlas → Database Access → Edit User → Update Password

# 2. Update connection string Vercel
vercel env rm MONGODB_URI production
vercel env add MONGODB_URI production

# 3. Vérifier connexions récentes
MongoDB Atlas → Metrics → Connections
```

---

## 🎯 Conclusion

**Pour 1-20 commerces** : Vercel Env Vars + 2FA est **suffisant** si tu appliques les bonnes pratiques.

**Au-delà de 50 commerces** : Envisager un KMS (Vault/AWS/GCP) pour centraliser et auditer.

**Règle d'or :** Ne JAMAIS partager les clés en clair (email/Slack/screenshot). Toujours utiliser un Password Manager d'équipe.

---

## 📚 Ressources

- [Vercel Security Best Practices](https://vercel.com/docs/security)
- [Stripe API Security](https://stripe.com/docs/security)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/security/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

---

**La sécurité est un processus, pas un état.** 🔒
