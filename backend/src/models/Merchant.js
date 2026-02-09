const mongoose = require('mongoose')

/**
 * Model Merchant - Single-tenant (1 merchant par instance)
 * Architecture "Multi-tenant Single-tenant" : chaque instance a son propre Merchant
 */

// ═══════════════════════════════════════════════════════════
// Subdocuments (embedded documents)
// ═══════════════════════════════════════════════════════════

const templateSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  description:  { type: String, default: '' },
  regularPrice: { type: Number, required: true },
  liquidaPrice: { type: Number, required: true },
  images:       { type: [String], default: [] }  // Array de URLs Cloudinary (max 5)
}, { _id: true, timestamps: true })

const subscriberSchema = new mongoose.Schema({
  phone:   { type: String, required: true },
  name:    { type: String, default: '' },
  addedAt: { type: Date, default: Date.now }
}, { _id: true })

const liquidationSchema = new mongoose.Schema({
  shortId:              { type: String, unique: true, sparse: true }, // ID court pour URL (6 caractères)
  templateId:           mongoose.Schema.Types.ObjectId,
  title:                String,
  description:          String,
  images:               { type: [String], default: [] },
  regularPrice:         Number,
  liquidaPrice:         Number,
  stripePaymentLinkId:  String,
  stripePaymentLinkUrl: String,
  quantity:             Number,
  quantitySold:         { type: Number, default: 0 },
  status:               { type: String, default: 'active' }, // active | sold_out | cancelled
  smsSentCount:         { type: Number, default: 0 },
  createdAt:            { type: Date, default: Date.now }
}, { _id: true })

const saleSchema = new mongoose.Schema({
  liquidationId:           mongoose.Schema.Types.ObjectId,
  stripeCheckoutSessionId: String,
  stripePaymentIntentId:   String,
  amount:                  Number,
  pickupCode:              String,
  customerPhone:           String,
  customerEmail:           String,
  status:                  { type: String, default: 'pending' }, // pending | completed | refunded
  createdAt:               { type: Date, default: Date.now }
}, { _id: true })

// ═══════════════════════════════════════════════════════════
// Merchant Schema
// ═══════════════════════════════════════════════════════════

const merchantSchema = new mongoose.Schema({
  businessName:    { type: String, required: true },
  address:         { type: String, default: '' },
  phone:           { type: String, default: '' },
  pickupHours:     { type: String, default: '' },  // ex: "18h-20h tous les jours"
  description:     { type: String, default: '' },  // Bio du commerce
  profileImageUrl: { type: String, default: '' },  // Logo/Photo vitrine
  primaryColor:    { type: String, default: '#FF6B35' },
  themeMode:       { type: String, enum: ['light', 'dark'], default: 'dark' },
  templates:       [templateSchema],
  subscribers:     [subscriberSchema],
  liquidations:    [liquidationSchema],
  sales:           [saleSchema]
}, { timestamps: true })

// ═══════════════════════════════════════════════════════════
// Méthodes statiques
// ═══════════════════════════════════════════════════════════

/**
 * Récupère LE merchant (single-tenant)
 */
merchantSchema.statics.getMerchant = async function() {
  return this.findOne()
}

/**
 * Trouve ou crée un subscriber
 */
merchantSchema.methods.findOrCreateSubscriber = function(phone, name = '') {
  const existing = this.subscribers.find(s => s.phone === phone)
  if (existing) return existing

  const newSub = { phone, name, addedAt: new Date() }
  this.subscribers.push(newSub)
  return this.subscribers[this.subscribers.length - 1]
}

/**
 * Trouve une liquidation par ID
 */
merchantSchema.methods.findLiquidation = function(liquidationId) {
  return this.liquidations.id(liquidationId)
}

/**
 * Trouve une sale par pickupCode
 */
merchantSchema.methods.findSaleByPickupCode = function(pickupCode) {
  return this.sales.find(s => s.pickupCode === pickupCode)
}

module.exports = mongoose.model('Merchant', merchantSchema)
