const app = require('./app')
const config = require('./config/env')
const connectDB = require('./config/db')
const { getSectorConfig } = require('./config/sector')
const { startWorkers } = require('./workers')

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
    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`)
      console.log(`Webhook ready on http://localhost:${config.port}/webhook`)
    })

  } catch (error) {
    console.error('ERROR: Failed to start server:', error)
    process.exit(1)
  }
}

// Gestion des erreurs non catchées
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  process.exit(1)
})

// Démarrage
startServer()

module.exports = app
