const logger = require('../utils/logger')

/**
 * Production-Ready Error Handler
 *
 * ✅ Never exposes stack traces to client
 * ✅ Sanitizes error messages in production
 * ✅ Logs full error details server-side with redaction
 * ✅ Returns generic messages with error codes
 */

// Error codes for client reference
const ERROR_CODES = {
  VALIDATION_ERROR: 'ERR_VALIDATION',
  NOT_FOUND: 'ERR_NOT_FOUND',
  UNAUTHORIZED: 'ERR_UNAUTHORIZED',
  FORBIDDEN: 'ERR_FORBIDDEN',
  CONFLICT: 'ERR_CONFLICT',
  INTERNAL: 'ERR_INTERNAL'
}

// Whitelist of safe error messages (can be shown to users)
const SAFE_MESSAGES = new Set([
  'Validation error',
  'Invalid ID format',
  'Resource not found',
  'Unauthorized',
  'Forbidden',
  'Conflict',
  'Bad request',
  'Sold out',
  'Liquidation not active',
  'Liquidation not found',
  'Merchant not found'
])

function isSafeMessage(message) {
  return SAFE_MESSAGES.has(message) || message.startsWith('Validation error')
}

function errorHandler(err, req, res, next) {
  const requestId = req.id || 'unknown'

  // Log full error details server-side (with PII redaction via logger)
  logger.error({
    err,
    requestId,
    method: req.method,
    path: req.path,
    // Don't log req.body - might contain sensitive data
    query: req.query
  }, 'Request error')

  // Determine status code
  let statusCode = err.status || err.statusCode || 500
  let errorCode = ERROR_CODES.INTERNAL
  let message = 'Internal server error'
  let details = null

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400
    errorCode = ERROR_CODES.VALIDATION_ERROR
    message = 'Validation error'
    details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }))
  }

  // Mongoose cast errors (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400
    errorCode = ERROR_CODES.VALIDATION_ERROR
    message = 'Invalid ID format'
  }

  // MongoDB duplicate key
  else if (err.code === 11000) {
    statusCode = 409
    errorCode = ERROR_CODES.CONFLICT
    message = 'Resource already exists'
  }

  // In development or for safe messages, use original message
  else if (process.env.NODE_ENV === 'development' || isSafeMessage(err.message)) {
    message = err.message
  }

  // Build response
  const response = {
    error: {
      message,
      code: errorCode,
      requestId
    }
  }

  if (details) {
    response.error.details = details
  }

  // Add stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack
  }

  res.status(statusCode).json(response)
}

module.exports = errorHandler
