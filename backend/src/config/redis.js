const Redis = require('ioredis')
const config = require('./env')

/**
 * Client Redis pour Bull (queue SMS)
 * En serverless, retourne un mock pour éviter les erreurs
 */

const isServerless = process.env.VERCEL === '1' || process.env.IS_SERVERLESS === 'true'

let redis

if (isServerless) {
  // Mock Redis client en serverless (pas besoin de Bull)
  console.log('Serverless mode: Redis disabled (using direct SMS)')
  redis = {
    status: 'ready',
    quit: async () => {},
    on: () => {},
    disconnect: () => {}
  }
} else {
  // Redis réel pour Bull workers
  redis = config.redisUrl
    ? new Redis(config.redisUrl)
    : new Redis({
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: null, // Requis pour Bull
        enableReadyCheck: false
      })

  redis.on('error', (err) => {
    console.error('ERROR: Redis connection error:', err.message)
  })

  redis.on('connect', () => {
    console.log('Redis connected')
  })
}

module.exports = redis
