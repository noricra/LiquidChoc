const Merchant = require('../models/Merchant')
const config = require('../config/env')

/**
 * Crée le merchant initial (onboarding)
 * Protected par SETUP_SECRET
 */
async function setupMerchant(req, res) {
  try {
    // Vérifier l'authentification via SETUP_SECRET
    const auth = req.headers.authorization || ''
    if (auth !== `Bearer ${config.setupSecret}`) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Vérifier qu'il n'existe pas déjà un merchant
    const existing = await Merchant.getMerchant()
    if (existing) {
      return res.status(400).json({ error: 'Merchant already exists' })
    }

    // Créer le merchant avec les infos du .env (Sector-Aware)
    const { businessName, address, phone, pickupHours } = req.body

    const merchant = await Merchant.create({
      businessName: businessName || config.branding.businessName,
      address: address || config.merchant.address,
      phone: phone || config.merchant.phone,
      pickupHours: pickupHours || config.merchant.pickupHours,
      primaryColor: config.branding.primaryColor,
      themeMode: 'dark'
    })

    res.status(201).json({ merchant })
  } catch (error) {
    console.error('Setup error:', error)
    res.status(500).json({ error: 'Setup failed' })
  }
}

module.exports = { setupMerchant }
