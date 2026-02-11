const Redis = require('ioredis')
const config = require('./env')

/**
 * Client Redis pour Bull (queue SMS)
 * Railway version - always use real Redis
 */

const redis = config.redisUrl
  ? new Redis(config.redisUrl)
  : new Redis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null, // Requis pour Bull
      enableReadyCheck: false
    })

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message)
})

redis.on('connect', () => {
  console.log('Redis connected')
})

module.exports = redis
