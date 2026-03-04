const express = require('express')
const { setupMerchant } = require('../controllers/setup.controller')
const { setupLimiter } = require('../middleware/rateLimiter')

const router = express.Router()

// Rate limiter: 3 tentatives max par heure
router.post('/setup', setupLimiter, setupMerchant)

module.exports = router
