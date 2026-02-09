const twilioClient = require('../config/twilio')
const config = require('../config/env')
const { toE164 } = require('../utils/helpers')
const Merchant = require('../models/Merchant')
const logger = require('../utils/logger')
const crypto = require('crypto')

/**
 * Job Processor : SMS Broadcast
 * Traite l'envoi de SMS en batch avec throttling
 */

/**
 * Hash phone number for logging (GDPR-compliant)
 */
function hashPhone(phone) {
  return crypto.createHash('sha256').update(phone).digest('hex').substring(0, 8)
}

async function processSMSBroadcast(job) {
  const { merchantId, liquidationId, subscribers, message } = job.data

  if (!twilioClient) {
    logger.warn('Twilio not configured, skipping SMS broadcast')
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
      const phoneHash = hashPhone(subscriber.phone)
      logger.error({ phoneHash, err: error }, 'SMS failed')
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
      logger.error({ err, liquidationId }, 'Failed to update smsSentCount')
    }
  }

  logger.info({ sent, failed, total: subscribers.length, liquidationId }, 'SMS Broadcast complete')

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
    const phoneHash = hashPhone(to)
    logger.error({ phoneHash, err: error }, 'SMS failed')
    throw error
  }
}

module.exports = {
  processSMSBroadcast,
  processSingleSMS
}
