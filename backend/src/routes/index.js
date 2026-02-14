const express = require('express')

/**
 * Point d'entrée centralisé pour toutes les routes
 */

const router = express.Router()

// Import de toutes les routes
const authRoutes = require('./auth.routes')
const setupRoutes = require('./setup.routes')
const merchantRoutes = require('./merchant.routes')
const templateRoutes = require('./template.routes')
const subscriberRoutes = require('./subscriber.routes')
const liquidationRoutes = require('./liquidation.routes')
const saleRoutes = require('./sale.routes')
const uploadRoutes = require('./upload.routes')
const checkoutRoutes = require('./checkout.routes')
const imageRoutes = require('./images.routes')
const debugRoutes = require('./debug.routes')
const { requireAuth } = require('../middleware/auth')

// Montage des routes sur /api
router.use('/api', authRoutes) // Public
router.use('/api', setupRoutes) // Public
router.use('/api', checkoutRoutes) // Public (client needs this)
router.use('/api/images', imageRoutes) // Public (R2 images)
router.use('/api', liquidationRoutes) // Partially public (GET :id), partially protected
router.use('/api', requireAuth, merchantRoutes) // Protected
router.use('/api', requireAuth, templateRoutes) // Protected
router.use('/api', requireAuth, subscriberRoutes) // Protected
router.use('/api', requireAuth, saleRoutes) // Protected
router.use('/api', requireAuth, uploadRoutes) // Protected
router.use(debugRoutes) // Debug routes (à supprimer en prod)

// ═══════════════════════════════════════════════════════════
// Health Check Enrichi (suggestion Gemini)
// Affiche le commerce + secteur pour vérifier déploiement
// ═══════════════════════════════════════════════════════════
router.get('/health', (req, res) => {
  const mongoose = require('mongoose')
  const config = require('../config/env')
  const { getSectorConfig } = require('../config/sector')
  const redis = require('../config/redis')
  const stripe = require('../config/stripe')
  const twilioClient = require('../config/twilio')

  const sectorConfig = getSectorConfig()

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    instance: {
      businessName: config.branding.businessName,
      sector: config.sector,
      sectorEmoji: sectorConfig.emoji,
      environment: config.nodeEnv
    },
    services: {
      mongodb: mongoose.connection.readyState === 1,
      redis: redis.status === 'ready',
      stripe: !!stripe,
      twilio: !!twilioClient
    },
    config: {
      port: config.port,
      frontendUrl: config.frontendUrl
    }
  })
})

// Status endpoint alternatif (minimal)
router.get('/api/status', (req, res) => {
  const config = require('../config/env')
  const { getSectorConfig } = require('../config/sector')
  const sectorConfig = getSectorConfig()

  res.json({
    commerce: config.branding.businessName,
    sector: config.sector,
    emoji: sectorConfig.emoji,
    ready: true
  })
})

module.exports = router
