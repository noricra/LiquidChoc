const express = require('express')
const { createSession } = require('../controllers/checkout.controller')

const router = express.Router()

router.post('/create-checkout-session', createSession)

module.exports = router
