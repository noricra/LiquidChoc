const express = require('express')
const { createTemplate, deleteTemplate } = require('../controllers/template.controller')

const router = express.Router()

router.post('/templates', createTemplate)
router.delete('/templates/:id', deleteTemplate)

module.exports = router
