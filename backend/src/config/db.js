const mongoose = require('mongoose')
const config = require('./env')

/**
 * Connexion MongoDB
 */
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log(`✅ MongoDB connected - ${config.branding.businessName}`)
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message)
    process.exit(1)
  }
}

module.exports = connectDB
