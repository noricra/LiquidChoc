const express = require('express')
const { setupMerchant } = require('../controllers/setup.controller')

const router = express.Router()

router.post('/setup', setupMerchant)

module.exports = router
