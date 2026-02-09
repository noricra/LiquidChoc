# Production Readiness Fixes - Implementation Guide

## Critical Issues Summary

This document outlines the critical security and reliability fixes required before production deployment.

---

## Phase 1: Immediate Fixes (CRITICAL - Deploy ASAP)

### 1.1 Install Dependencies

```bash
npm install --save pino pino-pretty
```

### 1.2 Replace Files

Replace the following files with their `.improved.js` versions:

```bash
# Backup originals
mv backend/src/middleware/errorHandler.js backend/src/middleware/errorHandler.old.js
mv backend/src/services/stripe.service.js backend/src/services/stripe.service.old.js
mv backend/src/services/sms.service.js backend/src/services/sms.service.old.js
mv backend/src/controllers/webhook.controller.js backend/src/controllers/webhook.controller.old.js

# Use improved versions
mv backend/src/middleware/errorHandler.improved.js backend/src/middleware/errorHandler.js
mv backend/src/services/stripe.service.improved.js backend/src/services/stripe.service.js
mv backend/src/services/sms.service.improved.js backend/src/services/sms.service.js
mv backend/src/controllers/webhook.controller.improved.js backend/src/controllers/webhook.controller.js
```

### 1.3 Update app.js to Add Request ID Middleware

**File:** `backend/src/app.js`

Add after line 14:

```javascript
const logger = require('./utils/logger')

// Add request ID to all requests
app.use(logger.attachRequestId)
```

### 1.4 Update server.js for Graceful Shutdown

**File:** `backend/src/server.js`

Replace lines 48-57 with:

```javascript
// Graceful shutdown handler
let server = null

// Gestion des erreurs non catchées
process.on('unhandledRejection', async (err) => {
  logger.fatal({ err }, 'Unhandled Rejection - initiating graceful shutdown')
  await gracefulShutdown('SIGTERM')
})

process.on('uncaughtException', async (err) => {
  logger.fatal({ err }, 'Uncaught Exception - initiating graceful shutdown')
  await gracefulShutdown('SIGTERM')
})

// Graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

async function gracefulShutdown(signal) {
  logger.info({ signal }, 'Received shutdown signal')

  if (!server) {
    process.exit(0)
  }

  // Give ongoing requests 10 seconds to finish
  server.close(() => {
    logger.info('HTTP server closed')

    // Close database connections
    const mongoose = require('mongoose')
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed')

      // Close Redis connection
      const redis = require('./config/redis')
      redis.quit(() => {
        logger.info('Redis connection closed')
        process.exit(0)
      })
    })
  })

  // Force shutdown after 15 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 15000)
}
```

And update line 37:

```javascript
server = app.listen(config.port, () => {
  logger.info({ port: config.port }, 'Server running')
  logger.info({ port: config.port }, 'Webhook ready')
})
```

### 1.5 Update package.json Scripts

Add logging configuration:

```json
{
  "scripts": {
    "start": "node backend/src/server.js",
    "start:pretty": "node backend/src/server.js | pino-pretty",
    "dev": "concurrently \"nodemon backend/src/server.js | pino-pretty\" \"npm run dev:frontend\"",
    "dev:backend": "nodemon backend/src/server.js | pino-pretty",
    "dev:frontend": "vite"
  }
}
```

---

## Phase 2: Monitoring & Alerting Setup

### 2.1 Add Sentry for Error Tracking

```bash
npm install --save @sentry/node @sentry/tracing
```

**Create:** `backend/src/config/sentry.js`

```javascript
const Sentry = require('@sentry/node')
const Tracing = require('@sentry/tracing')
const config = require('./env')

if (config.nodeEnv === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: config.nodeEnv,
    tracesSampleRate: 0.1,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true })
    ],
    beforeSend(event, hint) {
      // Redact sensitive data
      if (event.request) {
        delete event.request.cookies
        delete event.request.headers?.authorization
      }
      return event
    }
  })
}

module.exports = Sentry
```

**Update:** `backend/src/app.js` - Add after line 14:

```javascript
const Sentry = require('./config/sentry')

// Sentry request handler (must be first)
app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.tracingHandler())

// ... existing middleware ...

// Sentry error handler (must be before other error handlers)
app.use(Sentry.Handlers.errorHandler())
```

### 2.2 Add Environment Variable

Add to Vercel:

```
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

---

## Phase 3: Frontend Error Handling

### 3.1 Add Axios Interceptor

**File:** `src/api/client.js`

```javascript
import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor
client.interceptors.request.use(
  (config) => {
    // Add request ID for tracing
    config.headers['X-Request-ID'] = crypto.randomUUID()
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error format
    const standardError = {
      message: error.response?.data?.error?.message || 'Une erreur est survenue',
      code: error.response?.data?.error?.code || 'UNKNOWN',
      requestId: error.response?.data?.error?.requestId,
      status: error.response?.status
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('API Error:', standardError)
    }

    return Promise.reject(standardError)
  }
)

export default client
```

### 3.2 Fix Empty Catch Blocks

**File:** `src/pages/Subscribe.jsx:17`

```javascript
// Before:
.catch(() => {})

// After:
.catch((err) => {
  console.warn('Failed to load merchant info:', err)
  // Continue anyway - not critical for subscription
})
```

**File:** `src/pages/Dashboard.jsx:52`

```javascript
// Before:
console.error('Erreur chargement dashboard', e)

// After:
console.error('Erreur chargement dashboard', e)
setError('Impossible de charger le tableau de bord')
```

---

## Testing Checklist

### Critical Path Testing

- [ ] Create liquidation with 1 item
- [ ] Two users try to buy simultaneously (race condition test)
- [ ] Verify second user gets refund
- [ ] Verify first user gets SMS with pickup code
- [ ] Test webhook with invalid signature
- [ ] Test with Twilio credentials removed (should gracefully degrade)
- [ ] Test with Stripe credentials removed (should error clearly)
- [ ] Kill server during transaction (test graceful shutdown)
- [ ] Check logs for phone numbers (should find NONE)
- [ ] Check logs for email addresses (should be redacted)

### Log Verification

```bash
# Start server
npm run start:pretty

# Make a request that fails
curl -X POST http://localhost:3000/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"liquidationId":"invalid"}'

# Verify logs show:
# ✅ Redacted phone/email
# ✅ Request ID
# ✅ Structured JSON
# ✅ Error code
# ❌ NO stack traces in response
```

---

## Rollback Plan

If issues occur after deployment:

```bash
# Restore old files
mv backend/src/middleware/errorHandler.old.js backend/src/middleware/errorHandler.js
mv backend/src/services/stripe.service.old.js backend/src/services/stripe.service.js
mv backend/src/services/sms.service.old.js backend/src/services/sms.service.js
mv backend/src/controllers/webhook.controller.old.js backend/src/controllers/webhook.controller.js

# Redeploy
git add .
git commit -m "Rollback error handling changes"
git push
```

---

## Post-Deployment Monitoring

### Week 1 Checklist

- [ ] Monitor Sentry for new errors
- [ ] Check logs for FATAL level entries daily
- [ ] Review `_alertType: 'critical_failure'` documents in MongoDB
- [ ] Verify no PII in logs (search for phone patterns: `+\d{11}`)
- [ ] Monitor refund success rate
- [ ] Monitor SMS delivery rate

### KPIs to Track

- **Error Rate:** < 0.1% of requests
- **SMS Delivery Rate:** > 99%
- **Refund Success Rate:** 100% (critical)
- **Webhook Processing Time:** < 500ms (p95)
- **Critical Alerts:** 0 per day

---

## Support Contacts

- **Sentry:** https://sentry.io/organizations/your-org/issues/
- **Vercel Logs:** https://vercel.com/your-project/logs
- **MongoDB Atlas:** https://cloud.mongodb.com/alerts
- **Twilio:** https://console.twilio.com/us1/monitor/logs

---

## Questions?

Contact: Your SRE team
Last Updated: 2026-02-09
