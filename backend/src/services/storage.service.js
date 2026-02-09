const { r2Config, isConfigured } = require('../config/storage')
const crypto = require('crypto')
const AWS = require('aws-sdk')

/**
 * Service Upload - Cloudflare R2
 */

/**
 * Upload un fichier vers R2 avec structure organisée
 * @param {Buffer} buffer - Le fichier en buffer (multer)
 * @param {string} filename - Nom du fichier original
 * @param {string} mimetype - Type MIME du fichier (ex: image/jpeg)
 * @param {Object} options - Options supplémentaires
 * @param {string} options.businessName - Nom du commerce (depuis .env)
 * @param {string} options.productId - ID du produit (UUID généré côté frontend)
 * @returns {Promise<string>} URL publique de l'image
 */
async function uploadImage(buffer, filename, mimetype = 'image/jpeg', options = {}) {
  if (!isConfigured) {
    throw new Error('R2 not configured. Set R2_* variables in .env')
  }

  // Récupérer le nom du commerce depuis les options ou config
  const config = require('../config/env')
  const businessName = options.businessName || config.branding.businessName || 'default'
  const productId = options.productId || 'temp'

  // Nettoyer le nom du commerce (enlever espaces, caractères spéciaux)
  const cleanBusinessName = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')

  console.log('🔧 R2 Config:', {
    endpoint: r2Config.endpoint,
    bucket: r2Config.bucketName,
    business: cleanBusinessName,
    productId: productId
  })

  // Générer nom de fichier sécurisé
  const ext = filename.split('.').pop().toLowerCase()
  const timestamp = Date.now()
  const randomHash = crypto.randomBytes(4).toString('hex')
  const safeFilename = `${timestamp}_${randomHash}.${ext}`

  // Structure : {bucket}/{commerce}/{productId}/{filename}
  const key = `${cleanBusinessName}/products/${productId}/${safeFilename}`

  const s3 = new AWS.S3({
    endpoint: r2Config.endpoint,
    accessKeyId: r2Config.applicationKey,
    secretAccessKey: r2Config.secretKey,
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
  })

  const params = {
    Bucket: r2Config.bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    ACL: 'public-read'
  }

  console.log('📤 Uploading to R2:', {
    bucket: params.Bucket,
    key: params.Key,
    contentType: params.ContentType,
    size: buffer.length
  })

  try {
    const result = await s3.upload(params).promise()

    // Return relative path for image proxy system
    // Frontend will use: /api/images/{productId}/{filename}
    // Backend will download from R2 on-demand and cache locally
    const imagePath = `${productId}/${safeFilename}`

    console.log('✅ Upload success to R2:', key)
    console.log('📸 Image path:', imagePath)
    return imagePath
  } catch (error) {
    console.error('❌ R2 Upload Error:', error.message)
    console.error('Error details:', {
      code: error.code,
      statusCode: error.statusCode,
      message: error.message
    })
    throw error
  }
}

/**
 * Supprime une image (optionnel)
 */
async function deleteImage(url) {
  // À implémenter si besoin
  console.log('Delete image:', url)
}

module.exports = {
  uploadImage,
  deleteImage
}
