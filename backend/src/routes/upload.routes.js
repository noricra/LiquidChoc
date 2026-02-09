const express = require('express')
const multer = require('multer')
const { uploadFile } = require('../controllers/upload.controller')

const router = express.Router()

// Configuration Multer (mémoire tampon)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB max
})

router.post('/upload', upload.single('file'), uploadFile)

module.exports = router
