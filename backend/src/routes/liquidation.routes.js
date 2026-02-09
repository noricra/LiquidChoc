const express = require('express')
const {
  getLiquidations,
  getLiquidationPublic,
  createLiquidation,
  cancelLiquidation
} = require('../controllers/liquidation.controller')

const router = express.Router()

router.get('/liquidations', getLiquidations)
router.get('/liquidations/:id', getLiquidationPublic)
router.post('/liquidations/create', createLiquidation)
router.delete('/liquidations/:id', cancelLiquidation)

module.exports = router
