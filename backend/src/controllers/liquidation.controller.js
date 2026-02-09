const Merchant = require('../models/Merchant')
const { createPaymentLink, deactivatePaymentLink } = require('../services/stripe.service')
const { smsBroadcast } = require('../services/sms.service')
const { customAlphabet } = require('nanoid')

// Génère des shortId de 6 caractères (lettres minuscules + chiffres, sans caractères ambigus)
const generateShortId = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 6)

/**
 * Liste toutes les liquidations (avec filtre optionnel par status)
 */
async function getLiquidations(req, res) {
  try {
    const merchant = await Merchant.getMerchant()
    if (!merchant) {
      return res.status(404).json({ error: 'Not setup' })
    }

    const { status } = req.query
    const list = status
      ? merchant.liquidations.filter(l => l.status === status)
      : merchant.liquidations

    res.json({
      liquidations: list.sort((a, b) => b.createdAt - a.createdAt)
    })
  } catch (error) {
    console.error('Get liquidations error:', error)
    res.status(500).json({ error: 'Failed to get liquidations' })
  }
}

/**
 * Récupère une liquidation publique (pour la page client)
 * Accepte shortId (6 caractères) ou ObjectId (24 caractères)
 */
async function getLiquidationPublic(req, res) {
  try {
    const merchant = await Merchant.getMerchant()
    if (!merchant) {
      return res.status(404).json({ error: 'Not setup' })
    }

    const id = req.params.id

    // Chercher par shortId (6 caractères) ou par ObjectId (24 caractères)
    const liquidation = id.length === 6
      ? merchant.liquidations.find(l => l.shortId === id)
      : merchant.findLiquidation(id)

    if (!liquidation) {
      return res.status(404).json({ error: 'Not found' })
    }

    res.json({
      liquidation,
      businessName: merchant.businessName,
      address: merchant.address,
      phone: merchant.phone,
      pickupHours: merchant.pickupHours,
      description: merchant.description,
      profileImageUrl: merchant.profileImageUrl,
      primaryColor: merchant.primaryColor,
      themeMode: merchant.themeMode
    })
  } catch (error) {
    console.error('Get liquidation public error:', error)
    res.status(500).json({ error: 'Failed to get liquidation' })
  }
}

/**
 * Crée une liquidation (Payment Link + SMS broadcast)
 */
async function createLiquidation(req, res) {
  try {
    const merchant = await Merchant.getMerchant()
    if (!merchant) {
      return res.status(404).json({ error: 'Not setup' })
    }

    const { templateId, quantity } = req.body
    if (!templateId || !quantity) {
      return res.status(400).json({ error: 'templateId + quantity required' })
    }

    const template = merchant.templates.id(templateId)
    if (!template) {
      return res.status(400).json({ error: 'Template not found' })
    }

    // Générer un shortId unique
    const shortId = generateShortId()

    // Pré-insérer pour avoir l'_id
    merchant.liquidations.push({
      shortId,
      templateId: template._id,
      title: template.title,
      description: template.description,
      images: template.images || [],
      regularPrice: template.regularPrice,
      liquidaPrice: template.liquidaPrice,
      quantity,
      status: 'active'
    })

    const liquidation = merchant.liquidations[merchant.liquidations.length - 1]
    const liquidationId = liquidation._id.toString()

    try {
      // Créer Payment Link Stripe
      const paymentLinkData = await createPaymentLink(merchant, template, liquidationId, quantity)

      liquidation.stripePaymentLinkId = paymentLinkData.paymentLinkId
      liquidation.stripePaymentLinkUrl = paymentLinkData.paymentLinkUrl
      await merchant.save()

    } catch (stripeError) {
      // Rollback si échec Stripe
      merchant.liquidations.pull({ _id: liquidationId })
      await merchant.save()
      console.error('Stripe create failed:', stripeError)
      return res.status(500).json({ error: 'Failed to create payment link' })
    }

    // Répondre immédiatement
    res.status(201).json({ liquidation })

    // SMS broadcast en background (fire & forget)
    smsBroadcast(merchant, liquidation).then(sent => {
      // Mettre à jour smsSentCount
      Merchant.getMerchant().then(m => {
        const liq = m?.findLiquidation(liquidationId)
        if (liq) {
          liq.smsSentCount = sent
          m.save().catch(err => console.error('Save smsSentCount error:', err))
        }
      })
    }).catch(err => console.error('SMS broadcast error:', err))

  } catch (error) {
    console.error('Create liquidation error:', error)
    res.status(500).json({ error: 'Failed to create liquidation' })
  }
}

/**
 * Annule une liquidation
 */
async function cancelLiquidation(req, res) {
  try {
    const merchant = await Merchant.getMerchant()
    if (!merchant) {
      return res.status(404).json({ error: 'Not setup' })
    }

    const liquidation = merchant.findLiquidation(req.params.id)
    if (!liquidation) {
      return res.status(404).json({ error: 'Liquidation not found' })
    }

    liquidation.status = 'cancelled'
    await merchant.save()

    // Désactiver le Payment Link Stripe
    if (liquidation.stripePaymentLinkId) {
      deactivatePaymentLink(liquidation.stripePaymentLinkId)
        .catch(err => console.error('Deactivate payment link error:', err))
    }

    res.json({ ok: true })
  } catch (error) {
    console.error('Cancel liquidation error:', error)
    res.status(500).json({ error: 'Failed to cancel liquidation' })
  }
}

module.exports = {
  getLiquidations,
  getLiquidationPublic,
  createLiquidation,
  cancelLiquidation
}
