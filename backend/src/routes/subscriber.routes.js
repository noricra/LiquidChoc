const express = require('express')
const { getSubscribers, createSubscriber, deleteSubscriber } = require('../controllers/subscriber.controller')

const router = express.Router()

router.get('/subscribers', getSubscribers)
router.post('/subscribers', createSubscriber)
router.delete('/subscribers/:id', deleteSubscriber)

module.exports = router
