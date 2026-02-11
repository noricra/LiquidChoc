const app = require('./app')
const config = require('./config/env')
const connectDB = require('./config/db')
const { getSectorConfig } = require('./config/sector')
const { startWorkers } = require('./workers')
const logger = require('./utils/logger')

/**
 * Point d'entrée du serveur
 * Backend Caméléon - Chaque instance est configurée via .env
 */

async function startServer() {
  try {
    // Connexion MongoDB
    await connectDB()

    // Démarrer les workers Bull (queue SMS) - SEULEMENT si pas en serverless
    const isServerless = process.env.VERCEL === '1' || process.env.IS_SERVERLESS === 'true'

    if (!isServerless) {
      startWorkers()
      logger.info('Bull workers started (SMS queue)')
    } else {
      logger.info('Serverless mode detected - skipping Bull workers')
    }

    // Afficher la config Sector-Aware
    const sectorConfig = getSectorConfig()
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                  BACKEND CAMÉLÉON                          ║
║                                                            ║
║  Business: ${sectorConfig.businessName.padEnd(46)} ║
║  Sector:   ${sectorConfig.name.padEnd(46)} ║
║  Color:    ${config.branding.primaryColor.padEnd(46)} ║
║  Address:  ${sectorConfig.address.padEnd(46)} ║
║                                                            ║
║  Port:     ${config.port.toString().padEnd(46)} ║
║  Env:      ${config.nodeEnv.padEnd(46)} ║
║  Mode:     ${(isServerless ? 'SERVERLESS' : 'STANDARD').padEnd(46)} ║
╚════════════════════════════════════════════════════════════╝
    `)

    // Démarrer le serveur
    const server = app.listen(config.port, () => {
      logger.info({ port: config.port }, 'Server running')
      logger.info({ port: config.port }, 'Webhook endpoint ready')
    })

    // Store server instance for graceful shutdown
    module.exports.server = server

  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server')
    process.exit(1)
  }
}

// Graceful shutdown function
async function gracefulShutdown(signal) {
  logger.info({ signal }, 'Received shutdown signal')

  const server = module.exports.server
  if (!server) {
    process.exit(0)
  }

  // Force shutdown after 15 seconds
  const forceShutdownTimer = setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 15000)

  try {
    // Close HTTP server
    await new Promise((resolve) => server.close(resolve))
    logger.info('HTTP server closed')

    // Close MongoDB connection
    const mongoose = require('mongoose')
    await mongoose.connection.close()
    logger.info('MongoDB connection closed')

    // Close Redis connection
    const redis = require('./config/redis')
    await redis.quit()
    logger.info('Redis connection closed')

    clearTimeout(forceShutdownTimer)
    process.exit(0)
  } catch (error) {
    logger.error({ err: error }, 'Error during graceful shutdown')
    process.exit(1)
  }
}

// Gestion des erreurs non catchées
process.on('unhandledRejection', async (err) => {
  logger.fatal({ err }, 'Unhandled Rejection - initiating graceful shutdown')
  await gracefulShutdown('unhandledRejection')
})

process.on('uncaughtException', async (err) => {
  logger.fatal({ err }, 'Uncaught Exception - initiating graceful shutdown')
  await gracefulShutdown('uncaughtException')
})

// Graceful shutdown on signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Démarrage
startServer()

module.exports = app
