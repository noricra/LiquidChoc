const express = require('express')
const { getSubscribers, createSubscriber } = require('../controllers/subscriber.controller')

const router = express.Router()

router.get('/subscribers', getSubscribers)
router.post('/subscribers', createSubscriber)

module.exports = router
