const Bull = require('bull')
const config = require('../config/env')

/**
 * Service de queue avec Bull
 * Gère l'envoi de SMS en background pour éviter le bottleneck
 */

// Parse Redis URL and force DB 0
let redisConfig
if (config.redisUrl) {
  const cleanUrl = config.redisUrl.trim().replace(/["']/g, '')
  const url = new URL(cleanUrl)
  redisConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    db: 0,
    tls: url.protocol === 'rediss:' ? {} : undefined
  }
} else {
  redisConfig = {
    host: 'localhost',
    port: 6379,
    db: 0
  }
}

// Queue SMS Broadcast
const smsBroadcastQueue = new Bull('sms-broadcast', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
})

/**
 * Ajoute un broadcast SMS à la queue
 * @param {Object} data - { merchantId, liquidationId, subscribers, message }
 */
async function enqueueSMSBroadcast(data) {
  const job = await smsBroadcastQueue.add('broadcast', data, {
    priority: 1
  })

  console.log(`SMS Broadcast enqueued: Job #${job.id} (${data.subscribers.length} subscribers)`)
  return job
}

/**
 * Ajoute un SMS unique à la queue
 * @param {Object} data - { to, body, type }
 */
async function enqueueSingleSMS(data) {
  const job = await smsBroadcastQueue.add('single', data, {
    priority: 2 // Plus prioritaire que broadcast
  })

  return job
}

// Monitoring
smsBroadcastQueue.on('completed', (job, result) => {
  console.log(`Job #${job.id} completed: ${result.sent}/${result.total} SMS sent`)
})

smsBroadcastQueue.on('failed', (job, err) => {
  console.error(`Job #${job.id} failed:`, err.message)
})

smsBroadcastQueue.on('stalled', (job) => {
  console.warn(`WARNING: Job #${job.id} stalled`)
})

module.exports = {
  smsBroadcastQueue,
  enqueueSMSBroadcast,
  enqueueSingleSMS
}
