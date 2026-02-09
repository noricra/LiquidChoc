const express = require('express')
const router = express.Router()
const { getImageWithFallback } = require('../services/imageCache.service')

/**
 * GET /api/images/:productId/:filename
 *
 * Serve product images with automatic R2 download fallback
 * - Check local cache first
 * - Download from R2 if missing
 * - Cache for future requests
 * - R2 stays private (no public access needed)
 */
router.get('/:productId/:filename', async (req, res) => {
  try {
    const { productId, filename } = req.params

    // Security: validate filename (prevent path traversal)
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' })
    }

    // Get image path (from cache or download from R2)
    const imagePath = await getImageWithFallback(productId, filename)

    if (!imagePath) {
      return res.status(404).json({ error: 'Image not found' })
    }

    // Determine content type from extension
    const ext = filename.split('.').pop().toLowerCase()
    const contentTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp'
    }
    const contentType = contentTypes[ext] || 'image/jpeg'

    // Set cache headers (1 year)
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    // Serve the image
    res.sendFile(imagePath)

  } catch (error) {
    console.error('Error serving image:', error)
    res.status(500).json({ error: 'Failed to serve image' })
  }
})

module.exports = router
