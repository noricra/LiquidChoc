#!/usr/bin/env node
/**
 * Script d'initialisation de la DB
 * Crée le premier merchant dans la base de données
 *
 * Usage: node scripts/init-db.js
 */

require('dotenv').config()
const mongoose = require('mongoose')

const merchantSchema = new mongoose.Schema({
  businessName: String,
  address: String,
  phone: String,
  pickupHours: String,
  description: String,
  profileImageUrl: String,
  primaryColor: String,
  themeMode: String,
  templates: Array,
  subscribers: Array,
  liquidations: Array,
  sales: Array
}, { timestamps: true })

const Merchant = mongoose.model('Merchant', merchantSchema)

async function initDB() {
  try {
    console.log('🔗 Connexion à MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connecté à MongoDB')

    // Vérifier si un merchant existe déjà
    const existing = await Merchant.findOne()
    if (existing) {
      console.log('⚠️  Un merchant existe déjà :', existing.businessName)
      console.log('Supprimez-le manuellement si vous voulez recommencer.')
      process.exit(0)
    }

    // Créer le merchant
    console.log('📝 Création du merchant...')
    const merchant = await Merchant.create({
      businessName: 'Test Restaurant Local',
      address: '123 Rue Test, Montréal, QC',
      phone: '+15141234567',
      pickupHours: '18h-20h tous les jours',
      description: 'Restaurant de test pour développement',
      profileImageUrl: '',
      primaryColor: '#FF6B35',
      themeMode: 'dark',
      templates: [],
      subscribers: [],
      liquidations: [],
      sales: []
    })

    console.log('✅ Merchant créé avec succès !')
    console.log('📊 ID:', merchant._id)
    console.log('🏪 Nom:', merchant.businessName)
    console.log('')
    console.log('🎉 Vous pouvez maintenant lancer le frontend :')
    console.log('   npm run dev:frontend')
    console.log('')
    console.log('📱 Puis ouvrir : http://localhost:5173')

    process.exit(0)

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

initDB()
