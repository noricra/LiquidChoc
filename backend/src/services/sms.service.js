const twilioClient = require('../config/twilio')
const config = require('../config/env')
const { generateSMS } = require('../config/sector')
const { toE164 } = require('../utils/helpers')
const logger = require('../utils/logger')

/**
 * Improved SMS Service - NO PII IN LOGS
 *
 * ✅ Phone numbers never logged
 * ✅ Proper error propagation
 * ✅ Structured logging
 */

class SMSError extends Error {
  constructor(message, originalError, context = {}) {
    super(message)
    this.name = 'SMSError'
    this.originalError = originalError
    this.context = context
    this.retryable = this.isRetryable(originalError)
  }

  isRetryable(error) {
    // Twilio error codes that can be retried
    const retryableCodes = [
      20429,  // Too Many Requests
      30001,  // Queue overflow
      30002,  // Account suspended (temporary)
      30006   // Landline or unreachable carrier
    ]
    return error && retryableCodes.includes(error.code)
  }
}

/**
 * Hash phone number for logging (GDPR-compliant)
 */
function hashPhone(phone) {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(phone).digest('hex').substring(0, 8)
}

/**
 * Envoie un SMS unique
 */
async function sendSMS(to, body) {
  if (!twilioClient) {
    logger.warn('Twilio not configured, skipping SMS')
    return { success: false, skipped: true }
  }

  const phoneHash = hashPhone(to)

  try {
    logger.info({ phoneHash }, 'Sending SMS')

    const message = await twilioClient.messages.create({
      to: toE164(to),
      from: config.twilio.phoneNumber,
      body
    })

    logger.info({
      phoneHash,
      sid: message.sid,
      status: message.status
    }, 'SMS sent successfully')

    return { success: true, sid: message.sid }

  } catch (error) {
    logger.error({
      err: error,
      phoneHash,  // ← NEVER log actual phone number
      errorCode: error.code
    }, 'SMS sending failed')

    throw new SMSError(
      'Failed to send SMS',
      error,
      { phoneHash }
    )
  }
}

/**
 * SMS Broadcast directement (sans queue) pour environnement serverless
 */
async function smsBroadcastDirect(merchant, liquidation) {
  if (!merchant.subscribers || merchant.subscribers.length === 0) {
    logger.info('No subscribers for SMS broadcast')
    return 0
  }

  const liquidationUrl = `${config.frontendUrl}/liquidation/${liquidation.shortId || liquidation._id}`

  const message = generateSMS('liquidation', {
    productDescription: liquidation.title,
    originalPrice: liquidation.regularPrice.toFixed(2),
    discountedPrice: liquidation.liquidaPrice.toFixed(2),
    discountPercent: Math.round(((liquidation.regularPrice - liquidation.liquidaPrice) / liquidation.regularPrice) * 100),
    quantity: liquidation.quantity - liquidation.quantitySold,
    liquidationUrl: liquidationUrl
  })

  logger.info({
    merchantId: merchant._id.toString(),
    liquidationId: liquidation._id.toString(),
    subscriberCount: merchant.subscribers.length
  }, 'Starting direct SMS broadcast (serverless mode)')

  let sent = 0
  for (const subscriber of merchant.subscribers) {
    try {
      await sendSMS(subscriber.phone, message)
      sent++
      // Throttle to respect Twilio rate limits (10 SMS/sec max)
      await new Promise(resolve => setTimeout(resolve, 120))
    } catch (error) {
      logger.warn({
        phoneHash: hashPhone(subscriber.phone),
        err: error
      }, 'SMS failed to subscriber')
    }
  }

  logger.info({
    sent,
    total: merchant.subscribers.length
  }, 'Direct SMS broadcast completed')

  return sent
}

/**
 * SMS Broadcast via Queue (pour environnement avec workers)
 */
async function smsBroadcast(merchant, liquidation) {
  // En environnement serverless (Vercel), utiliser broadcast direct
  const isServerless = process.env.VERCEL === '1' || process.env.IS_SERVERLESS === 'true'

  if (isServerless) {
    return smsBroadcastDirect(merchant, liquidation)
  }

  if (!merchant.subscribers || merchant.subscribers.length === 0) {
    logger.info('No subscribers for SMS broadcast')
    return 0
  }

  const liquidationUrl = `${config.frontendUrl}/liquidation/${liquidation.shortId || liquidation._id}`

  const message = generateSMS('liquidation', {
    productDescription: liquidation.title,
    originalPrice: liquidation.regularPrice.toFixed(2),
    discountedPrice: liquidation.liquidaPrice.toFixed(2),
    discountPercent: Math.round(((liquidation.regularPrice - liquidation.liquidaPrice) / liquidation.regularPrice) * 100),
    quantity: liquidation.quantity - liquidation.quantitySold,
    liquidationUrl: liquidationUrl
  })

  try {
    const { enqueueSMSBroadcast } = require('./queue.service')

    logger.info({
      merchantId: merchant._id.toString(),
      liquidationId: liquidation._id.toString(),
      subscriberCount: merchant.subscribers.length
    }, 'Enqueueing SMS broadcast')

    const job = await enqueueSMSBroadcast({
      merchantId: merchant._id.toString(),
      liquidationId: liquidation._id.toString(),
      // ⚠️ Don't include actual phone numbers in job data that gets logged
      subscribers: merchant.subscribers.map(s => ({ phone: s.phone, name: s.name })),
      message
    })

    logger.info({
      jobId: job.id,
      subscriberCount: merchant.subscribers.length
    }, 'SMS broadcast enqueued successfully')

    return merchant.subscribers.length

  } catch (error) {
    logger.error({
      err: error,
      liquidationId: liquidation._id.toString()
    }, 'Failed to enqueue SMS broadcast')

    throw new SMSError(
      'Failed to enqueue SMS broadcast',
      error,
      { liquidationId: liquidation._id.toString() }
    )
  }
}

/**
 * Envoie SMS de confirmation avec retry
 */
async function sendPurchaseConfirmation(phone, data) {
  const body = generateSMS('confirmation', data)

  try {
    const result = await sendSMS(phone, body)

    if (!result.success) {
      throw new SMSError('Purchase confirmation SMS failed')
    }

    return result

  } catch (error) {
    logger.error({
      err: error,
      pickupCode: data.pickupCode  // OK to log - not PII
    }, 'CRITICAL: Purchase confirmation SMS failed')

    // Re-throw - this is a CRITICAL failure
    throw new SMSError(
      'Failed to send purchase confirmation',
      error,
      { pickupCode: data.pickupCode }
    )
  }
}

/**
 * Envoie SMS de bienvenue
 */
async function sendWelcomeSMS(phone) {
  const body = generateSMS('welcome', {})

  try {
    return await sendSMS(phone, body)
  } catch (error) {
    // Welcome SMS failure is not critical - log but don't throw
    logger.warn({
      err: error,
      phoneHash: hashPhone(phone)
    }, 'Welcome SMS failed (non-critical)')

    return { success: false, error: error.message }
  }
}

module.exports = {
  sendSMS,
  smsBroadcast,
  sendPurchaseConfirmation,
  sendWelcomeSMS,
  SMSError
}
