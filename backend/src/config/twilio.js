const twilio = require('twilio')
const config = require('./env')

/**
 * Client Twilio
 * Centralisé ou par commerce selon votre architecture Twilio
 */
const twilioClient = (config.twilio.accountSid && config.twilio.authToken)
  ? twilio(config.twilio.accountSid, config.twilio.authToken)
  : null

if (!twilioClient) {
  console.warn('⚠️  Twilio not configured (missing credentials)')
}

module.exports = twilioClient
