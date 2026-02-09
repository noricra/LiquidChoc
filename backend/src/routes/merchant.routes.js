const express = require('express')
const multer = require('multer')
const { getMerchantInfo, updateMerchant, getStripeConfig, uploadProfilePicture } = require('../controllers/merchant.controller')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.get('/merchant', getMerchantInfo)
router.put('/merchant', updateMerchant)
router.get('/config/stripe', getStripeConfig)
router.post('/merchant/profile-picture', upload.single('file'), uploadProfilePicture)

module.exports = router
