const express = require('express')
const { getSubscribers, createSubscriber, deleteSubscriber } = require('../controllers/subscriber.controller')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

// Public route (QR code signup)
router.post('/subscribers', createSubscriber)

// Protected routes (admin only)
router.get('/subscribers', requireAuth, getSubscribers)
router.delete('/subscribers/:id', requireAuth, deleteSubscriber)

module.exports = router
