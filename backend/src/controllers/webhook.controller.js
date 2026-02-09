const mongoose = require('mongoose')
const Merchant = require('../models/Merchant')
const { verifyWebhookSignature, createRefund, deactivatePaymentLink } = require('../services/stripe.service')
const { sendPurchaseConfirmation } = require('../services/sms.service')
const { generatePickupCode, formatDate } = require('../utils/helpers')

/**
 * Webhook Stripe - checkout.session.completed
 */
async function handleStripeWebhook(req, res) {
  try {
    const signature = req.headers['stripe-signature']

    // Vérifier la signature
    let event
    try {
      event = verifyWebhookSignature(req.body, signature)
    } catch (err) {
      console.error('Webhook signature failed:', err.message)
      return res.status(400).json({ error: 'Bad signature' })
    }

    // On gère uniquement checkout.session.completed
    if (event.type !== 'checkout.session.completed') {
      return res.json({ received: true })
    }

    const session = event.data.object
    const liquidationId = session.metadata?.liquidationId

    if (!liquidationId) {
      return res.json({ received: true })
    }

    // ═══════════════════════════════════════════════════════════
    // PROTECTION RACE CONDITION avec MongoDB Transaction
    // Garantit qu'un seul client peut acheter le dernier exemplaire
    // ═══════════════════════════════════════════════════════════

    const mongoSession = await mongoose.startSession()
    mongoSession.startTransaction()

    try {
      // 1. Récupérer le merchant avec lock
      const merchant = await Merchant.findOne().session(mongoSession)
      if (!merchant) {
        await mongoSession.abortTransaction()
        return res.status(500).json({ error: 'No merchant' })
      }

      const liquidation = merchant.findLiquidation(liquidationId)
      if (!liquidation) {
        await mongoSession.abortTransaction()
        return res.json({ received: true })
      }

      // 2. Vérifier le stock DANS la transaction
      if (liquidation.quantitySold >= liquidation.quantity) {
        await mongoSession.abortTransaction()
        console.log('⚠️  Stock épuisé - Race condition évitée', liquidationId)

        if (session.payment_intent) {
          await createRefund(session.payment_intent, 'out_of_inventory')
          console.log('✅ Auto-refund exécuté')
        }
        return res.json({ received: true })
      }

      // 3. Créer la vente
      const customerPhone = session.customer_details?.phone
      const pickupCode = generatePickupCode()

      const sale = {
        liquidationId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        amount: (session.amount_total || 0) / 100,
        pickupCode,
        customerPhone: customerPhone || '',
        customerEmail: session.customer_details?.email || '',
        status: 'pending'
      }

      merchant.sales.push(sale)
      liquidation.quantitySold += 1

      // 4. Désactiver Payment Link si stock épuisé
      if (liquidation.quantitySold >= liquidation.quantity) {
        liquidation.status = 'sold_out'
      }

      await merchant.save({ session: mongoSession })
      await mongoSession.commitTransaction()

      // 5. Post-transaction : désactiver Payment Link Stripe
      if (liquidation.quantitySold >= liquidation.quantity && liquidation.stripePaymentLinkId) {
        deactivatePaymentLink(liquidation.stripePaymentLinkId)
          .catch(err => console.error('Deactivate payment link error:', err))
        console.log('🔒 Payment Link désactivé - Stock épuisé')
      }

      // 6. Envoyer SMS de confirmation au client
      if (customerPhone) {
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000) // +2h
        sendPurchaseConfirmation(customerPhone, {
          pickupCode,
          expiresAt: formatDate(expiresAt)
        }).catch(err => console.error('SMS confirmation failed:', err))
      }

      console.log('✅ Sale created:', pickupCode)
      res.json({ received: true })

    } catch (txError) {
      await mongoSession.abortTransaction()
      console.error('Transaction error:', txError)
      throw txError
    } finally {
      mongoSession.endSession()
    }

  } catch (error) {
    console.error('Webhook processing error:', error)
    res.status(500).json({ error: 'Processing failed' })
  }
}

module.exports = { handleStripeWebhook }
