const express = require('express')
const { handleStripeWebhook } = require('../controllers/webhook.controller')

const router = express.Router()

// IMPORTANT: Cette route doit utiliser express.raw() dans server.js
router.post('/webhook', handleStripeWebhook)

module.exports = router
