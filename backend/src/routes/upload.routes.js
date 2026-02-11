const express = require('express')
const multer = require('multer')
const { uploadFile } = require('../controllers/upload.controller')

const router = express.Router()

// Configuration Multer (mémoire tampon)
// IMPORTANT: Limite à 4 MB pour respecter la limite Vercel (4.5 MB body size)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 } // 4 MB max (Vercel gratuit = 4.5 MB limit)
})

router.post('/upload', upload.single('file'), uploadFile)

module.exports = router
