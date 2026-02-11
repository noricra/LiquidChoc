const express = require('express')

/**
 * Point d'entrée centralisé pour toutes les routes
 */

const router = express.Router()

// Import de toutes les routes
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

// Montage des routes sur /api
router.use('/api', setupRoutes)
router.use('/api', merchantRoutes)
router.use('/api', templateRoutes)
router.use('/api', subscriberRoutes)
router.use('/api', liquidationRoutes)
router.use('/api', saleRoutes)
router.use('/api', uploadRoutes)
router.use('/api', checkoutRoutes)
router.use('/api/images', imageRoutes)
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
