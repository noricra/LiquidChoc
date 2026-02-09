require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const Stripe = require('stripe')
const twilio = require('twilio')
const multer = require('multer')
const cloudinary = require('cloudinary').v2

const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null
const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

// Cloudinary config
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL })
} else if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  })
}

// Multer config (mémoire tampon pour upload)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }) // 10 MB max

const app = express()
const PORT = process.env.PORT || 3000

// ─── Middleware ───────────────────────────────────────────────────
app.use('/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())
app.use(cors({ origin: true }))

// ─── Schemas ─────────────────────────────────────────────────────

// Bibliothèque de produits du commerçant
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

// Snapshot du template au moment de la liquidation + infos Stripe
const liquidationSchema = new mongoose.Schema({
  templateId:           mongoose.Schema.Types.ObjectId,
  title:                String,
  description:          String,
  images:               { type: [String], default: [] },  // Array d'URLs
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

const Merchant = mongoose.model('Merchant', merchantSchema)

// ─── MongoDB ─────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })

// ─── Helpers ─────────────────────────────────────────────────────
async function getMerchant() { return Merchant.findOne() }

function generatePickupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'LQ-'
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

function toE164(phone) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  return phone
}

// SMS broadcast — fire & forget, appelé après la réponse HTTP
async function smsBroadcast(merchant, liquidation) {
  if (!twilioClient || merchant.subscribers.length === 0) return

  const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const pageUrl = `${appUrl}/liquidation/${liquidation._id}`

  const body =
`FLASH @${merchant.businessName} : ${liquidation.title} a ${liquidation.liquidaPrice.toFixed(2)}$ au lieu de ${liquidation.regularPrice.toFixed(2)}$ ! Places limitees : ${pageUrl}

STOP pour se desbonner`

  let sent = 0
  for (const sub of merchant.subscribers) {
    try {
      await twilioClient.messages.create({ to: toE164(sub.phone), from: process.env.TWILIO_PHONE_NUMBER, body })
      sent++
    } catch (e) {
      console.error(`SMS failed to ${sub.phone}:`, e.message)
    }
    await new Promise(r => setTimeout(r, 100))
  }

  // Re-fetch pour éviter conflit de doc
  const fresh = await Merchant.findOne()
  const liq = fresh?.liquidations.id(liquidation._id)
  if (liq) { liq.smsSentCount = sent; await fresh.save() }
  console.log(`SMS broadcast done : ${sent}/${merchant.subscribers.length}`)
}

// ─── Health ──────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 })
})

// ═══════════════════════════════════════════════════════════════════
//  UPLOAD (Cloudinary)
// ═══════════════════════════════════════════════════════════════════

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    // Upload vers Cloudinary via buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'liquidachoc', resource_type: 'auto' },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(req.file.buffer)
    })

    res.json({ url: result.secure_url })
  } catch (err) {
    console.error('Cloudinary upload failed:', err)
    res.status(500).json({ error: 'Upload failed' })
  }
})

// ═══════════════════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════════════════

app.post('/api/setup', async (req, res) => {
  const auth = req.headers.authorization || ''
  if (auth !== `Bearer ${process.env.SETUP_SECRET}`) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (await getMerchant()) return res.status(400).json({ error: 'Merchant already exists' })

  const { businessName, address, primaryColor, themeMode } = req.body
  if (!businessName) return res.status(400).json({ error: 'businessName required' })

  const merchant = await Merchant.create({
    businessName,
    address:     address || '',
    primaryColor: primaryColor || '#FF6B35',
    themeMode:   themeMode === 'light' ? 'light' : 'dark'
  })

  res.status(201).json({ merchant })
})

// ═══════════════════════════════════════════════════════════════════
//  MERCHANT
// ═══════════════════════════════════════════════════════════════════

app.get('/api/merchant', async (req, res) => {
  const merchant = await getMerchant()
  if (!merchant) return res.status(404).json({ error: 'Not setup' })

  const pendingSales   = merchant.sales.filter(s => s.status === 'pending')
  const completedSales = merchant.sales.filter(s => s.status === 'completed')

  res.json({
    merchant,
    stats: {
      subscribers:  merchant.subscribers.length,
      liquidations: merchant.liquidations.length,
      sales:        merchant.sales.length,
      pendingSales: pendingSales.length,
      totalRevenue: completedSales.reduce((sum, s) => sum + (s.amount || 0), 0)
    }
  })
})

// Mise à jour merchant (nom, adresse, phone, horaires, description, photo)
app.put('/api/merchant', async (req, res) => {
  const merchant = await getMerchant()
  if (!merchant) return res.status(404).json({ error: 'Not setup' })

  const { businessName, address, phone, pickupHours, description, profileImageUrl } = req.body
  if (businessName !== undefined)       merchant.businessName = businessName
  if (address !== undefined)            merchant.address = address
  if (phone !== undefined)              merchant.phone = phone
  if (pickupHours !== undefined)        merchant.pickupHours = pickupHours
  if (description !== undefined)        merchant.description = description
  if (profileImageUrl !== undefined)    merchant.profileImageUrl = profileImageUrl

  await merchant.save()
  res.json({ merchant })
})

// ═══════════════════════════════════════════════════════════════════
//  TEMPLATES (bibliothèque de produits)
// ═══════════════════════════════════════════════════════════════════

app.post('/api/templates', async (req, res) => {
  const merchant = await getMerchant()
  if (!merchant) return res.status(404).json({ error: 'Not setup' })

  const { title, description, regularPrice, liquidaPrice, images } = req.body
  if (!title || regularPrice == null || liquidaPrice == null) {
    return res.status(400).json({ error: 'title, regularPrice, liquidaPrice requis' })
  }

  merchant.templates.push({
    title,
    description: description || '',
    regularPrice,
    liquidaPrice,
    images: Array.isArray(images) ? images.slice(0, 5) : []  // Max 5 images
  })
  await merchant.save()

  res.status(201).json({ template: merchant.templates[merchant.templates.length - 1] })
})

app.delete('/api/templates/:id', async (req, res) => {
  const merchant = await getMerchant()
  if (!merchant) return res.status(404).json({ error: 'Not setup' })

  merchant.templates.pull({ _id: req.params.id })
  await merchant.save()
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════
//  SUBSCRIBERS
// ═══════════════════════════════════════════════════════════════════

app.get('/api/subscribers', async (req, res) => {
  const merchant = await getMerchant()
  if (!merchant) return res.status(404).json({ error: 'Not setup' })
  res.json({ subscribers: merchant.subscribers })
})

app.post('/api/subscribers', async (req, res) => {
  const merchant = await getMerchant()
  if (!merchant) return res.status(404).json({ error: 'Not setup' })

  const { phone, name } = req.body
  if (!phone) return res.status(400).json({ error: 'phone required' })

  if (merchant.subscribers.find(s => s.phone === phone)) {
    return res.status(409).json({ error: 'Already subscribed' })
  }

  merchant.subscribers.push({ phone, name: name || '' })
  await merchant.save()

  res.status(201).json({ subscriber: merchant.subscribers[merchant.subscribers.length - 1] })
})

// ═══════════════════════════════════════════════════════════════════
//  SALES
// ═══════════════════════════════════════════════════════════════════

app.get('/api/sales', async (req, res) => {
  const merchant = await getMerchant()
  if (!merchant) return res.status(404).json({ error: 'Not setup' })

  const pending = merchant.sales.filter(s => s.status === 'pending').sort((a, b) => b.createdAt - a.createdAt)
  const history = merchant.sales.filter(s => s.status !== 'pending').sort((a, b) => b.createdAt - a.createdAt).slice(0, 20)

  res.json({ pending, history })
})

app.patch('/api/sales/:id/complete', async (req, res) => {
  const merchant = await getMerchant()
  if (!merchant) return res.status(404).json({ error: 'Not setup' })

  const sale = merchant.sales.id(req.params.id)
  if (!sale) return res.status(404).json({ error: 'Sale not found' })

  sale.status = 'completed'
  await merchant.save()
  res.json({ sale })
})

// ═══════════════════════════════════════════════════════════════════
//  LIQUIDATIONS
// ═══════════════════════════════════════════════════════════════════

app.get('/api/liquidations', async (req, res) => {
  const merchant = await getMerchant()
  if (!merchant) return res.status(404).json({ error: 'Not setup' })

  const { status } = req.query
  const list = status
    ? merchant.liquidations.filter(l => l.status === status)
    : merchant.liquidations

  res.json({ liquidations: list.sort((a, b) => b.createdAt - a.createdAt) })
})

// PUBLIC — utilisée par la page client /liquidation/:id
app.get('/api/liquidations/:id', async (req, res) => {
  const merchant = await getMerchant()
  if (!merchant) return res.status(404).json({ error: 'Not setup' })

  const liquidation = merchant.liquidations.id(req.params.id)
  if (!liquidation) return res.status(404).json({ error: 'Not found' })

  res.json({
    liquidation,
    businessName:    merchant.businessName,
    address:         merchant.address,
    phone:           merchant.phone,
    pickupHours:     merchant.pickupHours,
    description:     merchant.description,
    profileImageUrl: merchant.profileImageUrl,
    primaryColor:    merchant.primaryColor,
    themeMode:       merchant.themeMode
  })
})

// CRÉER une liquidation = Payment Link Stripe + SMS broadcast
app.post('/api/liquidations/create', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' })

  const merchant = await getMerchant()
  if (!merchant) return res.status(404).json({ error: 'Not setup' })

  const { templateId, quantity } = req.body
  if (!templateId || !quantity) return res.status(400).json({ error: 'templateId + quantity requis' })

  const template = merchant.templates.id(templateId)
  if (!template) return res.status(400).json({ error: 'Template introuvable' })

  // Pré-insérer pour avoir l'_id
  merchant.liquidations.push({
    templateId:   template._id,
    title:        template.title,
    description:  template.description,
    images:       template.images || [],
    regularPrice: template.regularPrice,
    liquidaPrice: template.liquidaPrice,
    quantity,
    status:       'active'
  })
  const liquidation = merchant.liquidations[merchant.liquidations.length - 1]
  const liquidationId = liquidation._id.toString()

  try {
    const product = await stripe.products.create({
      name: template.title,
      description: `Liquidation chez ${merchant.businessName}`,
      metadata: { liquidationId }
    })

    const price = await stripe.prices.create({
      product:     product.id,
      unit_amount: Math.round(template.liquidaPrice * 100),
      currency:    'cad'
    })

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      after_completion: {
        type: 'hosted_confirmation',
        hosted_confirmation: {
          custom_message: `Présentez-vous chez ${merchant.businessName} avec votre code de confirmation.`
        }
      },
      metadata: { liquidationId }
    })

    liquidation.stripePaymentLinkId  = paymentLink.id
    liquidation.stripePaymentLinkUrl = paymentLink.url
    await merchant.save()

  } catch (err) {
    merchant.liquidations.pull({ _id: liquidationId })
    await merchant.save()
    console.error('Stripe create failed:', err)
    return res.status(500).json({ error: 'Failed to create payment link' })
  }

  // Répondre immédiatement
  res.status(201).json({ liquidation })

  // SMS en background — ne bloque pas la réponse
  smsBroadcast(merchant, liquidation).catch(e => console.error('smsBroadcast error:', e))
})

// ═══════════════════════════════════════════════════════════════════
//  WEBHOOK STRIPE
// ═══════════════════════════════════════════════════════════════════

app.post('/webhook', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' })

  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature failed:', err.message)
    return res.status(400).json({ error: 'Bad signature' })
  }

  if (event.type !== 'checkout.session.completed') return res.json({ received: true })

  const session = event.data.object
  const liquidationId = session.metadata?.liquidationId
  if (!liquidationId) return res.json({ received: true })

  try {
    const merchant = await getMerchant()
    if (!merchant) return res.status(500).json({ error: 'No merchant' })

    const liquidation = merchant.liquidations.id(liquidationId)
    if (!liquidation) return res.json({ received: true })

    // Stock épuisé → refund automatique
    if (liquidation.quantitySold >= liquidation.quantity) {
      if (session.payment_intent) {
        await stripe.refunds.create({ payment_intent: session.payment_intent })
        console.log('Auto-refund: stock épuisé', liquidationId)
      }
      return res.json({ received: true })
    }

    // Créer la vente
    const customerPhone = session.customer_details?.phone
    const sale = {
      liquidationId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:   session.payment_intent,
      amount:                  (session.amount_total || 0) / 100,
      pickupCode:              generatePickupCode(),
      customerPhone:           customerPhone || '',
      customerEmail:           session.customer_details?.email || '',
      status:                  'pending'
    }
    merchant.sales.push(sale)

    liquidation.quantitySold += 1
    if (liquidation.quantitySold >= liquidation.quantity) {
      liquidation.status = 'sold_out'
      await stripe.paymentLinks.update(liquidation.stripePaymentLinkId, { active: false })
    }

    await merchant.save()

    // SMS confirmation au client
    if (twilioClient && customerPhone) {
      try {
        await twilioClient.messages.create({
          to:   toE164(customerPhone),
          from: process.env.TWILIO_PHONE_NUMBER,
          body: `Achat confirme chez ${merchant.businessName}\n\nCode de recuperation : ${sale.pickupCode}\n\n${merchant.address}\nA recuperer dans les 2 prochaines heures.`
        })
      } catch (e) {
        console.error('SMS confirmation failed:', e.message)
      }
    }

    console.log('Sale created:', sale.pickupCode)
  } catch (err) {
    console.error('Webhook processing error:', err)
    return res.status(500).json({ error: 'Processing failed' })
  }

  res.json({ received: true })
})

// ═══════════════════════════════════════════════════════════════════
//  STATIC + SPA
// ═══════════════════════════════════════════════════════════════════

app.use(express.static(path.join(__dirname, 'dist')))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// ─── Start ───────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Liquida-Choc running on port ${PORT}`))

module.exports = { app, Merchant }
