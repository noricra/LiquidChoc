/**
 * Middleware de gestion globale des erreurs
 */

function errorHandler(err, req, res, next) {
  console.error('Error:', err)

  // Erreur Mongoose (validation, cast, etc.)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: Object.values(err.errors).map(e => e.message)
    })
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format'
    })
  }

  // Erreur par défaut
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  })
}

module.exports = errorHandler
