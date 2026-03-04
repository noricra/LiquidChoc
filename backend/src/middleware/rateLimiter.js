const rateLimit = require('express-rate-limit')

/**
 * Rate limiters pour sécuriser les endpoints sensibles
 */

// Login rate limiter - strict
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: {
    error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true
})

// Setup rate limiter - ultra strict (1 seule instance)
const setupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 tentatives max par heure
  message: {
    error: 'Trop de tentatives de setup. Réessayez dans 1 heure.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// API générale - modéré
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requêtes/min
  message: {
    error: 'Trop de requêtes. Ralentissez.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip pour les routes publiques (GET liquidations)
  skip: (req) => req.method === 'GET' && req.path.includes('/liquidations/')
})

module.exports = {
  loginLimiter,
  setupLimiter,
  apiLimiter
}
