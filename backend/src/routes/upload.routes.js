const express = require('express')
const multer = require('multer')
const { uploadFile } = require('../controllers/upload.controller')

const router = express.Router()

// Filtre pour accepter SEULEMENT les images
const imageFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ]

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true) // Accepter
  } else {
    cb(new Error(`Type de fichier non autorisé. Seulement les images sont acceptées (JPG, PNG, WEBP, GIF). Type reçu: ${file.mimetype}`), false)
  }
}

// Configuration Multer (mémoire tampon)
// IMPORTANT: Limite à 4 MB pour respecter la limite Vercel (4.5 MB body size)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB max (Vercel gratuit = 4.5 MB limit)
  fileFilter: imageFilter
})

router.post('/upload', upload.single('file'), uploadFile)

module.exports = router
