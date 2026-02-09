const express = require('express')
const cors = require('cors')
const path = require('path')
const config = require('./config/env')
const webhookRoutes = require('./routes/webhook.routes')
const routes = require('./routes')
const errorHandler = require('./middleware/errorHandler')

/**
 * Configuration de l'application Express
 * Backend Caméléon - Sector-Aware
 */

const app = express()

// ═══════════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════════

// IMPORTANT: Webhook Stripe nécessite raw body AVANT express.json()
app.use('/webhook', express.raw({ type: 'application/json' }))

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}))

// Logging (dev)
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
  })
}

// ═══════════════════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════════════════

// Webhook (raw body)
app.use(webhookRoutes)

// API routes
app.use(routes)

// ═══════════════════════════════════════════════════════════
// Frontend (SPA)
// ═══════════════════════════════════════════════════════════

// Serve static files en production
if (config.nodeEnv === 'production') {
  const distPath = path.join(__dirname, '../../dist')
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// ═══════════════════════════════════════════════════════════
// Error handling
// ═══════════════════════════════════════════════════════════

app.use(errorHandler)

module.exports = app
