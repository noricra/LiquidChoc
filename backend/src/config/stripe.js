const Stripe = require('stripe')
const config = require('./env')

/**
 * Client Stripe
 * Chaque instance a son propre compte Stripe (clés isolées par commerce)
 */
const stripe = config.stripe.secretKey
  ? Stripe(config.stripe.secretKey)
  : null

if (!stripe) {
  console.warn('⚠️  Stripe not configured (missing STRIPE_SECRET_KEY)')
}

module.exports = stripe
