// Vercel Serverless Function wrapper pour Express
require('dotenv').config()
const mongoose = require('mongoose')
const app = require('../backend/src/app')
const config = require('../backend/src/config/env')
const logger = require('../backend/src/utils/logger')

// Connexion MongoDB (réutilisée entre invocations via connection pooling)
async function ensureConnection() {
  // Mongoose maintient automatiquement la connexion
  if (mongoose.connection.readyState === 1) {
    return // Déjà connecté
  }

  if (mongoose.connection.readyState === 2) {
    // En cours de connexion, attendre
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve)
    })
    return
  }

  try {
    await mongoose.connect(config.mongoUri)
    logger.info({
      business: config.branding.businessName
    }, 'MongoDB connected in serverless context')
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection failed in serverless')
    throw error
  }
}

// Export de la fonction serverless
module.exports = async (req, res) => {
  try {
    // S'assurer que MongoDB est connecté
    await ensureConnection()

    // Passer la requête à Express
    return app(req, res)
  } catch (error) {
    logger.error({ err: error }, 'Serverless function error')
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
