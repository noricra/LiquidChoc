const Merchant = require('../models/Merchant')
const { uploadImage } = require('../services/storage.service')

const MAX_PROFILE_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * Récupère le merchant et ses stats
 */
async function getMerchantInfo(req, res) {
  try {
    const merchant = await Merchant.getMerchant()
    if (!merchant) {
      return res.status(404).json({ error: 'Not setup' })
    }

    const pendingSales = merchant.sales.filter(s => s.status === 'pending')
    const completedSales = merchant.sales.filter(s => s.status === 'completed')

    res.json({
      merchant,
      stats: {
        subscribers: merchant.subscribers.length,
        liquidations: merchant.liquidations.length,
        sales: merchant.sales.length,
        pendingSales: pendingSales.length,
        totalRevenue: completedSales.reduce((sum, s) => sum + (s.amount || 0), 0)
      }
    })
  } catch (error) {
    console.error('Get merchant error:', error)
    res.status(500).json({ error: 'Failed to get merchant' })
  }
}

/**
 * Met à jour les infos du merchant
 */
async function updateMerchant(req, res) {
  try {
    const merchant = await Merchant.getMerchant()
    if (!merchant) {
      return res.status(404).json({ error: 'Not setup' })
    }

    const { businessName, address, phone, pickupHours, description, profileImageUrl } = req.body

    if (businessName !== undefined) merchant.businessName = businessName
    if (address !== undefined) merchant.address = address
    if (phone !== undefined) merchant.phone = phone
    if (pickupHours !== undefined) merchant.pickupHours = pickupHours
    if (description !== undefined) merchant.description = description
    if (profileImageUrl !== undefined) merchant.profileImageUrl = profileImageUrl

    await merchant.save()
    res.json({ merchant })
  } catch (error) {
    console.error('Update merchant error:', error)
    res.status(500).json({ error: 'Failed to update merchant' })
  }
}

/**
 * Retourne la publishable key Stripe (public)
 */
function getStripeConfig(req, res) {
  const config = require('../config/env')
  res.json({
    publishableKey: config.stripe.publishableKey
  })
}

/**
 * Upload photo de profil du merchant (max 5MB)
 */
async function uploadProfilePicture(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Check file size (5MB max)
    if (req.file.size > MAX_PROFILE_SIZE) {
      return res.status(413).json({
        error: 'Image trop volumineuse (max 5MB)'
      })
    }

    console.log('📷 Profile picture upload request:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: `${(req.file.size / (1024 * 1024)).toFixed(2)}MB`
    })

    // Upload to R2 with fixed productId "profile"
    const imagePath = await uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      {
        productId: 'profile',
        businessName: req.body.businessName
      }
    )

    const imageUrl = `/api/images/${imagePath}`

    // Update merchant profile
    const merchant = await Merchant.getMerchant()
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' })
    }

    merchant.profileImageUrl = imageUrl
    await merchant.save()

    console.log('✅ Profile picture uploaded:', imageUrl)

    res.json({ profileImageUrl: imageUrl })

  } catch (error) {
    console.error('❌ Profile picture upload failed:', error)
    res.status(500).json({ error: error.message || 'Upload failed' })
  }
}

module.exports = {
  getMerchantInfo,
  updateMerchant,
  getStripeConfig,
  uploadProfilePicture
}
