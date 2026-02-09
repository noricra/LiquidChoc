const twilioClient = require('../config/twilio')
const config = require('../config/env')
const { toE164 } = require('../utils/helpers')
const Merchant = require('../models/Merchant')

/**
 * Job Processor : SMS Broadcast
 * Traite l'envoi de SMS en batch avec throttling
 */

async function processSMSBroadcast(job) {
  const { merchantId, liquidationId, subscribers, message } = job.data

  if (!twilioClient) {
    console.warn('WARNING: Twilio not configured, skipping SMS broadcast')
    return { sent: 0, total: subscribers.length, skipped: true }
  }

  let sent = 0
  let failed = 0

  for (let i = 0; i < subscribers.length; i++) {
    const subscriber = subscribers[i]

    try {
      await twilioClient.messages.create({
        to: toE164(subscriber.phone),
        from: config.twilio.phoneNumber,
        body: message
      })

      sent++

      // Mise à jour de la progression
      job.progress(Math.round(((i + 1) / subscribers.length) * 100))

      // Throttling: 100ms entre chaque SMS (max 10/sec)
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`SMS failed to ${subscriber.phone}:`, error.message)
      failed++
    }
  }

  // Mettre à jour smsSentCount dans la liquidation
  if (merchantId && liquidationId) {
    try {
      const merchant = await Merchant.findById(merchantId)
      if (merchant) {
        const liquidation = merchant.findLiquidation(liquidationId)
        if (liquidation) {
          liquidation.smsSentCount = sent
          await merchant.save()
        }
      }
    } catch (err) {
      console.error('Failed to update smsSentCount:', err.message)
    }
  }

  console.log(`SMS Broadcast complete: ${sent} sent, ${failed} failed (${subscribers.length} total)`)

  return {
    sent,
    failed,
    total: subscribers.length,
    successRate: Math.round((sent / subscribers.length) * 100)
  }
}

/**
 * Job Processor : Single SMS
 */
async function processSingleSMS(job) {
  const { to, body } = job.data

  if (!twilioClient) {
    return { sent: false, skipped: true }
  }

  try {
    await twilioClient.messages.create({
      to: toE164(to),
      from: config.twilio.phoneNumber,
      body
    })
    return { sent: true }
  } catch (error) {
    console.error(`SMS failed to ${to}:`, error.message)
    throw error
  }
}

module.exports = {
  processSMSBroadcast,
  processSingleSMS
}
