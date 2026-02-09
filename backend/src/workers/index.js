const { smsBroadcastQueue } = require('../services/queue.service')
const { processSMSBroadcast, processSingleSMS } = require('../jobs/smsBroadcast.job')

/**
 * Worker Bull - Traite les jobs en background
 */

function startWorkers() {
  // Processor pour les broadcasts SMS
  smsBroadcastQueue.process('broadcast', 1, async (job) => {
    return await processSMSBroadcast(job)
  })

  // Processor pour les SMS uniques
  smsBroadcastQueue.process('single', 5, async (job) => {
    return await processSingleSMS(job)
  })

  console.log('Workers started (SMS queue)')
}

module.exports = { startWorkers }
