const Merchant = require('../models/Merchant')
const { sendWelcomeSMS } = require('../services/sms.service')

/**
 * Liste tous les subscribers
 */
async function getSubscribers(req, res) {
  try {
    const merchant = await Merchant.getMerchant()
    if (!merchant) {
      return res.status(404).json({ error: 'Not setup' })
    }

    res.json({ subscribers: merchant.subscribers })
  } catch (error) {
    console.error('Get subscribers error:', error)
    res.status(500).json({ error: 'Failed to get subscribers' })
  }
}

/**
 * Ajoute un nouveau subscriber (via QR code)
 */
async function createSubscriber(req, res) {
  try {
    const merchant = await Merchant.getMerchant()
    if (!merchant) {
      return res.status(404).json({ error: 'Not setup' })
    }

    const { phone, name } = req.body
    if (!phone) {
      return res.status(400).json({ error: 'phone required' })
    }

    // Vérifier si déjà inscrit
    if (merchant.subscribers.find(s => s.phone === phone)) {
      return res.status(409).json({ error: 'Already subscribed' })
    }

    merchant.subscribers.push({ phone, name: name || '' })
    await merchant.save()

    const subscriber = merchant.subscribers[merchant.subscribers.length - 1]

    // Envoyer SMS de bienvenue (fire & forget)
    sendWelcomeSMS(phone).catch(err => console.error('Welcome SMS failed:', err))

    res.status(201).json({ subscriber })
  } catch (error) {
    console.error('Create subscriber error:', error)
    res.status(500).json({ error: 'Failed to create subscriber' })
  }
}

module.exports = {
  getSubscribers,
  createSubscriber
}
