const Merchant = require('../models/Merchant')

/**
 * Liste toutes les ventes (pending + history)
 */
async function getSales(req, res) {
  try {
    const merchant = await Merchant.getMerchant()
    if (!merchant) {
      return res.status(404).json({ error: 'Not setup' })
    }

    const pending = merchant.sales
      .filter(s => s.status === 'pending')
      .sort((a, b) => b.createdAt - a.createdAt)

    const history = merchant.sales
      .filter(s => s.status !== 'pending')
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20)

    res.json({ pending, history })
  } catch (error) {
    console.error('Get sales error:', error)
    res.status(500).json({ error: 'Failed to get sales' })
  }
}

/**
 * Marque une vente comme complétée (pickup effectué)
 */
async function completeSale(req, res) {
  try {
    const merchant = await Merchant.getMerchant()
    if (!merchant) {
      return res.status(404).json({ error: 'Not setup' })
    }

    const sale = merchant.sales.id(req.params.id)
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' })
    }

    sale.status = 'completed'
    await merchant.save()

    res.json({ sale })
  } catch (error) {
    console.error('Complete sale error:', error)
    res.status(500).json({ error: 'Failed to complete sale' })
  }
}

module.exports = {
  getSales,
  completeSale
}
