const pino = require('pino')
const config = require('../config/env')

/**
 * Structured Logger with PII Redaction
 *
 * Usage:
 *   logger.info({ userId: 123 }, 'User logged in')
 *   logger.error({ err, context: {...} }, 'Payment failed')
 */

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'password',
  'token',
  'secret',
  'apiKey',
  'phone',          // ← Redact phone numbers
  'phoneNumber',
  'customerPhone',
  'email',          // ← Redact emails
  'stripeSecretKey',
  'twilioAuthToken'
]

const logger = pino({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]'
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  },
  formatters: {
    level: (label) => {
      return { level: label }
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime
})

// Add request context middleware
logger.attachRequestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || require('crypto').randomUUID()
  req.log = logger.child({ requestId: req.id })
  res.setHeader('X-Request-ID', req.id)
  next()
}

module.exports = logger
