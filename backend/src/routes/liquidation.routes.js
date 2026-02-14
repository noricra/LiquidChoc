const express = require('express')
const {
  getLiquidations,
  getLiquidationPublic,
  createLiquidation,
  cancelLiquidation
} = require('../controllers/liquidation.controller')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

// Public route (client access)
router.get('/liquidations/:id', getLiquidationPublic)

// Protected routes (admin only)
router.get('/liquidations', requireAuth, getLiquidations)
router.post('/liquidations/create', requireAuth, createLiquidation)
router.delete('/liquidations/:id', requireAuth, cancelLiquidation)

module.exports = router
