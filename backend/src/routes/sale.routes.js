const express = require('express')
const { getSales, completeSale } = require('../controllers/sale.controller')

const router = express.Router()

router.get('/sales', getSales)
router.patch('/sales/:id/complete', completeSale)

module.exports = router
