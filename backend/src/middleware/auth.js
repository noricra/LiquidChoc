const config = require('../config/env')

/**
 * Simple auth middleware
 * Vérifie token dans header Authorization
 */
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token || token !== config.adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  next()
}

module.exports = { requireAuth }
