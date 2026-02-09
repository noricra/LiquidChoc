const { uploadImage } = require('../services/storage.service')

// Maximum total size per product: 10MB
const MAX_PRODUCT_SIZE = 10 * 1024 * 1024 // 10MB in bytes

// Track upload sizes per productId (in-memory, reset on server restart)
const productSizes = new Map()

/**
 * Upload une image vers le storage configuré (R2)
 * Query params attendus :
 * - productId: UUID du produit (généré côté frontend)
 * - businessName: (optionnel) nom du commerce
 *
 * Limite: 10MB total par produit
 */
async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Récupérer les paramètres optionnels
    const productId = req.body.productId || req.query.productId
    const businessName = req.body.businessName || req.query.businessName

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' })
    }

    console.log('File upload request:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      productId: productId,
      businessName: businessName || 'from-env'
    })

    // Check product size limit (10MB total)
    const currentSize = productSizes.get(productId) || 0
    const newTotalSize = currentSize + req.file.size

    if (newTotalSize > MAX_PRODUCT_SIZE) {
      const remainingMB = ((MAX_PRODUCT_SIZE - currentSize) / (1024 * 1024)).toFixed(2)
      return res.status(413).json({
        error: `Limite de 10MB par produit dépassée. Espace restant: ${remainingMB}MB`
      })
    }

    const imagePath = await uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      {
        productId,
        businessName
      }
    )

    // Update product size tracking
    productSizes.set(productId, newTotalSize)

    console.log('Upload controller success, path:', imagePath)
    console.log(`Product ${productId}: ${(newTotalSize / (1024 * 1024)).toFixed(2)}MB / 10MB`)

    res.json({ url: `/api/images/${imagePath}` })

  } catch (error) {
    console.error('Upload controller failed:', error)
    res.status(500).json({ error: error.message || 'Upload failed' })
  }
}

/**
 * Reset size tracking for a product (appelé quand produit supprimé)
 */
function resetProductSize(productId) {
  productSizes.delete(productId)
  console.log(`Size tracking reset for product: ${productId}`)
}

module.exports = { uploadFile, resetProductSize }
