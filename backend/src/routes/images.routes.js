const express = require('express')
const router = express.Router()
const AWS = require('aws-sdk')
const { r2Config, isConfigured } = require('../config/storage')

/**
 * GET /api/images/:productId/:filename
 *
 * Serve product images by streaming directly from R2 (serverless-friendly)
 * - No local cache (Vercel filesystem is read-only)
 * - Stream directly from R2 to client
 * - Browser caching via Cache-Control headers
 */
router.get('/:productId/:filename', async (req, res) => {
  try {
    const { productId, filename } = req.params

    // Security: validate filename (prevent path traversal)
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' })
    }

    if (!isConfigured) {
      return res.status(500).json({ error: 'Storage not configured' })
    }

    // Get business name from config for R2 key construction
    const config = require('../config/env')
    const businessName = config.branding.businessName || 'default'
    const cleanBusinessName = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')

    // R2 key structure: {business}/products/{productId}/{filename}
    const r2Key = `${cleanBusinessName}/products/${productId}/${filename}`

    const s3 = new AWS.S3({
      endpoint: r2Config.endpoint,
      accessKeyId: r2Config.applicationKey,
      secretAccessKey: r2Config.secretKey,
      s3ForcePathStyle: true,
      signatureVersion: 'v4'
    })

    const params = {
      Bucket: r2Config.bucketName,
      Key: r2Key
    }

    // Download file from R2 into memory
    const data = await s3.getObject(params).promise()

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

    // Set cache headers (1 year - browser will cache)
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.setHeader('Content-Length', data.ContentLength)

    // Stream the image directly to client
    res.send(data.Body)

  } catch (error) {
    console.error('Error serving image:', error)

    if (error.code === 'NoSuchKey') {
      return res.status(404).json({ error: 'Image not found' })
    }

    if (error.code === 'AccessDenied') {
      console.error('R2 Access Denied - check credentials')
      return res.status(500).json({ error: 'Storage access denied' })
    }

    res.status(500).json({ error: 'Failed to serve image' })
  }
})

module.exports = router
