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

    // Démarrer les workers Bull (queue SMS)
    startWorkers()

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

  // Give ongoing requests 10 seconds to finish
  server.close(() => {
    logger.info('HTTP server closed')

    // Close database connections
    const mongoose = require('mongoose')
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed')

      // Close Redis connection
      const redis = require('./config/redis')
      redis.quit(() => {
        logger.info('Redis connection closed')
        process.exit(0)
      })
    })
  })

  // Force shutdown after 15 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 15000)
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
