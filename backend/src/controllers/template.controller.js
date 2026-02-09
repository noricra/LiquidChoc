const Merchant = require('../models/Merchant')

/**
 * Crée un nouveau template de produit
 */
async function createTemplate(req, res) {
  try {
    const merchant = await Merchant.getMerchant()
    if (!merchant) {
      return res.status(404).json({ error: 'Not setup' })
    }

    const { title, description, regularPrice, liquidaPrice, images } = req.body

    if (!title || regularPrice == null || liquidaPrice == null) {
      return res.status(400).json({ error: 'title, regularPrice, liquidaPrice required' })
    }

    merchant.templates.push({
      title,
      description: description || '',
      regularPrice,
      liquidaPrice,
      images: Array.isArray(images) ? images.slice(0, 5) : []
    })

    await merchant.save()
    const template = merchant.templates[merchant.templates.length - 1]

    res.status(201).json({ template })
  } catch (error) {
    console.error('Create template error:', error)
    res.status(500).json({ error: 'Failed to create template' })
  }
}

/**
 * Supprime un template
 */
async function deleteTemplate(req, res) {
  try {
    const merchant = await Merchant.getMerchant()
    if (!merchant) {
      return res.status(404).json({ error: 'Not setup' })
    }

    merchant.templates.pull({ _id: req.params.id })
    await merchant.save()

    res.json({ ok: true })
  } catch (error) {
    console.error('Delete template error:', error)
    res.status(500).json({ error: 'Failed to delete template' })
  }
}

module.exports = {
  createTemplate,
  deleteTemplate
}
