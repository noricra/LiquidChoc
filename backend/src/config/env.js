require('dotenv').config()

/**
 * Configuration centralisée des variables d'environnement
 * BACKEND CAMÉLÉON : Toute la personnalisation vient du .env
 */

const config = {
  // Serveur
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // MongoDB
  mongoUri: process.env.MONGODB_URI,

  // Redis (pour Bull queue)
  redisUrl: process.env.REDIS_URL,

  // Stripe (compte du commerce)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },

  // Twilio (SMS)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },

  // Cloudflare R2 Storage
  r2: {
    secretKey: process.env.R2_SECRET_KEY,
    applicationKey: process.env.R2_APPLICATION_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    endpoint: process.env.R2_ENDPOINT,
    publicUrl: process.env.R2_PUBLIC_URL // Custom domain ou R2.dev URL
  },

  // Setup (onboarding initial)
  setupSecret: process.env.SETUP_SECRET,

  // ════════════════════════════════════════════════════════════
  // BACKEND CAMÉLÉON : Configuration Sector-Aware
  // ════════════════════════════════════════════════════════════

  // Secteur d'activité : 'food', 'games', 'services'
  sector: (process.env.SECTOR || 'food').toLowerCase(),

  // Branding (personnalisation visuelle)
  branding: {
    businessName: process.env.BUSINESS_NAME || 'LiquidaChoc',
    primaryColor: process.env.PRIMARY_COLOR || '#FF6B35',
    secondaryColor: process.env.SECONDARY_COLOR || '#004E89',
    accentColor: process.env.ACCENT_COLOR || '#06D6A0'
  },

  // Infos commerce (utilisées dans les SMS)
  merchant: {
    address: process.env.MERCHANT_ADDRESS || '',
    phone: process.env.MERCHANT_PHONE || '',
    pickupHours: process.env.PICKUP_HOURS || '18h-20h'
  }
}

// Validation des variables critiques
const validateConfig = () => {
  const required = {
    'MONGODB_URI': config.mongoUri,
    'STRIPE_SECRET_KEY': config.stripe.secretKey,
    'TWILIO_ACCOUNT_SID': config.twilio.accountSid,
    'TWILIO_AUTH_TOKEN': config.twilio.authToken,
    'TWILIO_PHONE_NUMBER': config.twilio.phoneNumber
  }

  const missing = Object.entries(required)
    .filter(([key, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`)
    process.exit(1)
  }

  // Validation du secteur
  const validSectors = ['food', 'games', 'services']
  if (!validSectors.includes(config.sector)) {
    console.error(`❌ Invalid SECTOR: "${config.sector}". Must be one of: ${validSectors.join(', ')}`)
    process.exit(1)
  }

  console.log(`✅ Config loaded - Sector: ${config.sector} | Business: ${config.branding.businessName}`)
}

validateConfig()

module.exports = config
