const express = require('express')
const config = require('../config/env')

const router = express.Router()

router.post('/login', (req, res) => {
  const { password } = req.body

  if (!password || password !== config.adminPassword) {
    return res.status(401).json({ error: 'Invalid password' })
  }

  res.json({ token: config.adminPassword })
})

module.exports = router
