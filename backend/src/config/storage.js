const config = require('./env')

/**
 * Configuration Cloudflare R2
 */

const r2Config = {
  secretKey: config.r2.secretKey,
  applicationKey: config.r2.applicationKey,
  bucketName: config.r2.bucketName,
  endpoint: config.r2.endpoint
}

const isConfigured = r2Config.endpoint && r2Config.secretKey && r2Config.applicationKey

if (isConfigured) {
  console.log(`R2 Storage configured: ${r2Config.bucketName}`)
  console.log(`R2 Endpoint: ${r2Config.endpoint}`)
} else {
  console.warn('WARNING: R2 not configured')
  console.warn('R2 Config status:', {
    hasEndpoint: !!r2Config.endpoint,
    hasSecretKey: !!r2Config.secretKey,
    hasApplicationKey: !!r2Config.applicationKey,
    hasBucketName: !!r2Config.bucketName
  })
  console.warn('Raw env vars:', {
    R2_ENDPOINT: !!process.env.R2_ENDPOINT,
    R2_SECRET_KEY: !!process.env.R2_SECRET_KEY,
    R2_APPLICATION_KEY: !!process.env.R2_APPLICATION_KEY,
    R2_BUCKET_NAME: !!process.env.R2_BUCKET_NAME
  })
}

module.exports = { r2Config, isConfigured }
