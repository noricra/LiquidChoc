const stripe = require('../config/stripe')
const config = require('../config/env')

/**
 * Service Stripe - Gestion des paiements
 * Chaque instance a son propre compte Stripe (isolation par commerce)
 */

/**
 * Crée un Payment Link Stripe pour une liquidation
 */
async function createPaymentLink(merchant, template, liquidationId, quantity) {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }

  // 1. Créer le produit
  const product = await stripe.products.create({
    name: template.title,
    description: `Liquidation chez ${merchant.businessName}`,
    metadata: { liquidationId }
  })

  // 2. Créer le prix
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(template.liquidaPrice * 100),
    currency: 'cad'
  })

  // 3. Créer le Payment Link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    after_completion: {
      type: 'hosted_confirmation',
      hosted_confirmation: {
        custom_message: `Présentez-vous chez ${merchant.businessName} avec votre code de confirmation.`
      }
    },
    metadata: { liquidationId },
    // Capture email et phone pour les notifications
    phone_number_collection: { enabled: true }
  })

  return {
    productId: product.id,
    priceId: price.id,
    paymentLinkId: paymentLink.id,
    paymentLinkUrl: paymentLink.url
  }
}

/**
 * Désactive un Payment Link (annulation de liquidation)
 */
async function deactivatePaymentLink(paymentLinkId) {
  if (!stripe) return

  try {
    await stripe.paymentLinks.update(paymentLinkId, { active: false })
  } catch (error) {
    console.error('Failed to deactivate payment link:', error.message)
  }
}

/**
 * Crée un refund pour un paiement
 */
async function createRefund(paymentIntentId, reason = 'requested_by_customer') {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }

  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason
  })
}

/**
 * Crée une Checkout Session pour paiement intégré dans l'app
 */
async function createCheckoutSession(merchant, liquidation) {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }

  const successUrl = `${config.frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${config.frontendUrl}/liquidation/${liquidation._id}`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'cad',
          product_data: {
            name: liquidation.title,
            description: liquidation.description
            // Images retirées : Stripe n'accepte que des URLs publiques HTTPS
            // Les images sont déjà visibles dans l'app avant le paiement
          },
          unit_amount: Math.round(liquidation.liquidaPrice * 100)
        },
        quantity: 1
      }
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    phone_number_collection: { enabled: true },
    metadata: {
      liquidationId: liquidation._id.toString(),
      merchantId: merchant._id.toString()
    }
  })

  return session
}

/**
 * Vérifie la signature du webhook Stripe
 */
function verifyWebhookSignature(rawBody, signature) {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }

  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    config.stripe.webhookSecret
  )
}

module.exports = {
  createPaymentLink,
  deactivatePaymentLink,
  createRefund,
  createCheckoutSession,
  verifyWebhookSignature
}
