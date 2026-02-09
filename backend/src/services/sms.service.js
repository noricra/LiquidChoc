const twilioClient = require('../config/twilio')
const config = require('../config/env')
const { generateSMS } = require('../config/sector')
const { toE164 } = require('../utils/helpers')

/**
 * Service SMS - Utilise le système Sector-Aware pour personnaliser les messages
 */

/**
 * Envoie un SMS unique
 */
async function sendSMS(to, body) {
  if (!twilioClient) {
    console.warn('⚠️  Twilio not configured, skipping SMS')
    return false
  }

  try {
    await twilioClient.messages.create({
      to: toE164(to),
      from: config.twilio.phoneNumber,
      body
    })
    return true
  } catch (error) {
    console.error(`SMS failed to ${to}:`, error.message)
    return false
  }
}

/**
 * SMS Broadcast pour une liquidation via QUEUE (Bull)
 * Gère efficacement 5000+ abonnés sans bloquer
 */
async function smsBroadcast(merchant, liquidation) {
  if (!merchant.subscribers || merchant.subscribers.length === 0) {
    console.log('⚠️  No subscribers')
    return 0
  }

  // Génère le lien vers la page publique de liquidation avec shortId (6 caractères)
  const liquidationUrl = `${config.frontendUrl}/liquidation/${liquidation.shortId || liquidation._id}`

  // Génère le message selon le secteur
  const message = generateSMS('liquidation', {
    productDescription: liquidation.title,
    originalPrice: liquidation.regularPrice.toFixed(2),
    discountedPrice: liquidation.liquidaPrice.toFixed(2),
    discountPercent: Math.round(((liquidation.regularPrice - liquidation.liquidaPrice) / liquidation.regularPrice) * 100),
    quantity: liquidation.quantity - liquidation.quantitySold,
    liquidationUrl: liquidationUrl
  })

  // Enqueue le broadcast (traité en background)
  const { enqueueSMSBroadcast } = require('./queue.service')
  const job = await enqueueSMSBroadcast({
    merchantId: merchant._id.toString(),
    liquidationId: liquidation._id.toString(),
    subscribers: merchant.subscribers.map(s => ({ phone: s.phone, name: s.name })),
    message
  })

  console.log(`📤 SMS Broadcast enqueued: ${merchant.subscribers.length} subscribers (Job #${job.id})`)

  return merchant.subscribers.length
}

/**
 * Envoie un SMS de confirmation d'achat avec le pickup code
 */
async function sendPurchaseConfirmation(phone, data) {
  const body = generateSMS('confirmation', data)
  return sendSMS(phone, body)
}

/**
 * Envoie un SMS de bienvenue à un nouveau subscriber
 */
async function sendWelcomeSMS(phone) {
  const body = generateSMS('welcome', {})
  return sendSMS(phone, body)
}

module.exports = {
  sendSMS,
  smsBroadcast,
  sendPurchaseConfirmation,
  sendWelcomeSMS
}
