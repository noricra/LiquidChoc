const Merchant = require('../models/Merchant')
const { createCheckoutSession } = require('../services/stripe.service')

/**
 * Crée une Checkout Session Stripe pour une liquidation
 * POST /api/create-checkout-session
 * Body: { liquidationId }
 */
async function createSession(req, res) {
  try {
    const { liquidationId } = req.body

    if (!liquidationId) {
      return res.status(400).json({ error: 'liquidationId required' })
    }

    const merchant = await Merchant.getMerchant()
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' })
    }

    const liquidation = merchant.findLiquidation(liquidationId)
    if (!liquidation) {
      return res.status(404).json({ error: 'Liquidation not found' })
    }

    // Vérifier si la liquidation est encore disponible
    if (liquidation.status !== 'active') {
      return res.status(400).json({ error: 'Liquidation not active' })
    }

    const restantes = liquidation.quantity - liquidation.quantitySold
    if (restantes <= 0) {
      return res.status(400).json({ error: 'Sold out' })
    }

    // Créer la session Stripe
    const session = await createCheckoutSession(merchant, liquidation)

    res.json({ sessionId: session.id })

  } catch (error) {
    console.error('Create checkout session error:', error)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
}

module.exports = {
  createSession
}
