const fs = require('fs').promises
const path = require('path')
const AWS = require('aws-sdk')
const { r2Config } = require('../config/storage')

/**
 * Image Cache Service
 *
 * Télécharge et cache les images depuis R2 (comme votre marketplace)
 * - Vérifie cache local d'abord
 * - Download depuis R2 (privé) si manquant
 * - Garde en cache pour prochaines requêtes
 * - Railway-proof: local storage éphémère, R2 persiste
 */

const CACHE_DIR = path.join(__dirname, '../../uploads/cache')

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
  } catch (err) {
    console.error('Failed to create cache dir:', err)
  }
}

ensureCacheDir()

/**
 * Get image path with automatic R2 download fallback
 * @param {string} productId - Product UUID
 * @param {string} filename - Image filename (ex: 1770516545271_2b01c067.jpeg)
 * @returns {Promise<string|null>} Local file path or null if unavailable
 */
async function getImageWithFallback(productId, filename) {
  try {
    // Define local cache path
    const productCacheDir = path.join(CACHE_DIR, productId)
    const localPath = path.join(productCacheDir, filename)

    // Check if exists in cache
    try {
      await fs.access(localPath)
      console.log(`✅ Image served from cache: ${productId}/${filename}`)
      return localPath
    } catch {
      // File doesn't exist, need to download
    }

    // Download from R2
    console.log(`🔄 Image not cached, downloading from R2: ${productId}/${filename}`)

    await fs.mkdir(productCacheDir, { recursive: true })

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

    // Download file from R2
    const data = await s3.getObject(params).promise()

    // Save to local cache
    await fs.writeFile(localPath, data.Body)

    console.log(`✅ Downloaded and cached from R2: ${productId}/${filename}`)
    return localPath

  } catch (error) {
    console.error(`❌ Error getting image ${productId}/${filename}:`, error.message)
    return null
  }
}

/**
 * Clear cache for a specific product (when product deleted)
 * @param {string} productId - Product UUID
 */
async function clearProductCache(productId) {
  try {
    const productCacheDir = path.join(CACHE_DIR, productId)
    await fs.rm(productCacheDir, { recursive: true, force: true })
    console.log(`🗑️  Cache cleared for product: ${productId}`)
  } catch (error) {
    console.error(`❌ Error clearing cache for ${productId}:`, error.message)
  }
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache stats
 */
async function getCacheStats() {
  try {
    const productDirs = await fs.readdir(CACHE_DIR)
    let totalFiles = 0
    let totalSize = 0

    for (const dir of productDirs) {
      const dirPath = path.join(CACHE_DIR, dir)
      const stats = await fs.stat(dirPath)

      if (stats.isDirectory()) {
        const files = await fs.readdir(dirPath)
        totalFiles += files.length

        for (const file of files) {
          const filePath = path.join(dirPath, file)
          const fileStats = await fs.stat(filePath)
          totalSize += fileStats.size
        }
      }
    }

    return {
      products: productDirs.length,
      files: totalFiles,
      sizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    }
  } catch (error) {
    return { error: error.message }
  }
}

module.exports = {
  getImageWithFallback,
  clearProductCache,
  getCacheStats
}
