const express = require('express')
const config = require('../config/env')
const { loginLimiter } = require('../middleware/rateLimiter')

const router = express.Router()

// Rate limiter: 5 tentatives max par 15 min
router.post('/login', loginLimiter, (req, res) => {
  const { password } = req.body

  if (!password || password !== config.adminPassword) {
    return res.status(401).json({ error: 'Invalid password' })
  }

  res.json({ token: config.adminPassword })
})

module.exports = router
