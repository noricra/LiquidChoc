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
  console.log(`R2 Storage: ${r2Config.bucketName} (${r2Config.endpoint})`)
} else {
  console.warn('WARNING: R2 not configured')
}

module.exports = { r2Config, isConfigured }
