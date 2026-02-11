const express = require('express')
const router = express.Router()

/**
 * DEBUG ENDPOINT - À SUPPRIMER APRÈS DÉPLOIEMENT
 * Vérifier la configuration R2 en production
 */
router.get('/api/debug/r2-config', (req, res) => {
  const config = require('../config/env')

  res.json({
    r2Config: {
      hasEndpoint: !!config.r2.endpoint,
      endpoint: config.r2.endpoint ? config.r2.endpoint.substring(0, 30) + '...' : null,
      hasSecretKey: !!config.r2.secretKey,
      secretKeyLength: config.r2.secretKey ? config.r2.secretKey.length : 0,
      hasApplicationKey: !!config.r2.applicationKey,
      applicationKeyLength: config.r2.applicationKey ? config.r2.applicationKey.length : 0,
      hasBucketName: !!config.r2.bucketName,
      bucketName: config.r2.bucketName
    },
    envVars: {
      R2_ENDPOINT: !!process.env.R2_ENDPOINT,
      R2_SECRET_KEY: !!process.env.R2_SECRET_KEY,
      R2_APPLICATION_KEY: !!process.env.R2_APPLICATION_KEY,
      R2_BUCKET_NAME: !!process.env.R2_BUCKET_NAME,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL
    }
  })
})

module.exports = router
