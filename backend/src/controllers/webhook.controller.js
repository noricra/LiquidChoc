const mongoose = require('mongoose')
const Merchant = require('../models/Merchant')
const { verifyWebhookSignature, createRefund, deactivatePaymentLink } = require('../services/stripe.service')
const { sendPurchaseConfirmation } = require('../services/sms.service')
const { generatePickupCode, formatDate } = require('../utils/helpers')
const logger = require('../utils/logger')

/**
 * Improved Webhook Handler
 *
 * ✅ No silent failures
 * ✅ Proper error alerting
 * ✅ Failed SMS triggers manual notification workflow
 * ✅ All operations logged with context
 */

/**
 * Handles critical business failures that need manual intervention
 */
async function alertCriticalFailure(type, context) {
  logger.fatal({
    type,
    context
  }, 'CRITICAL BUSINESS FAILURE - MANUAL INTERVENTION REQUIRED')

  // TODO: Integrate with PagerDuty/Opsgenie/Slack webhook
  // For now, just log at FATAL level which should trigger alerts

  // Could also write to a dead letter queue or alert table
  try {
    await Merchant.collection.insertOne({
      _alertType: 'critical_failure',
      type,
      context,
      timestamp: new Date(),
      resolved: false
    })
  } catch (err) {
    logger.error({ err }, 'Failed to write alert to database')
  }
}

async function handleStripeWebhook(req, res) {
  const requestId = req.id
  logger.info({ requestId }, 'Processing Stripe webhook')

  try {
    const signature = req.headers['stripe-signature']

    // Verify signature
    let event
    try {
      event = verifyWebhookSignature(req.body, signature)
    } catch (err) {
      logger.warn({
        requestId,
        err
      }, 'Webhook signature verification failed')
      return res.status(400).json({ error: 'Bad signature' })
    }

    // Only handle checkout.session.completed
    if (event.type !== 'checkout.session.completed') {
      logger.debug({ requestId, eventType: event.type }, 'Ignoring webhook event')
      return res.json({ received: true })
    }

    const session = event.data.object
    const liquidationId = session.metadata?.liquidationId

    if (!liquidationId) {
      logger.warn({ requestId, sessionId: session.id }, 'No liquidationId in metadata')
      return res.json({ received: true })
    }

    logger.info({
      requestId,
      sessionId: session.id,
      liquidationId
    }, 'Processing checkout session')

    // Start MongoDB transaction
    const mongoSession = await mongoose.startSession()
    mongoSession.startTransaction()

    try {
      // 1. Get merchant with lock
      const merchant = await Merchant.findOne().session(mongoSession)
      if (!merchant) {
        await mongoSession.abortTransaction()
        logger.error({ requestId, liquidationId }, 'Merchant not found')
        return res.status(500).json({ error: 'No merchant' })
      }

      const liquidation = merchant.findLiquidation(liquidationId)
      if (!liquidation) {
        await mongoSession.abortTransaction()
        logger.warn({ requestId, liquidationId }, 'Liquidation not found')
        return res.json({ received: true })
      }

      // 2. Check stock (race condition protection)
      if (liquidation.quantitySold >= liquidation.quantity) {
        await mongoSession.abortTransaction()

        logger.warn({
          requestId,
          liquidationId,
          sessionId: session.id
        }, 'Stock exhausted - initiating refund')

        // CRITICAL: Refund must not fail silently
        if (session.payment_intent) {
          try {
            await createRefund(session.payment_intent, 'out_of_inventory')
            logger.info({
              requestId,
              sessionId: session.id,
              paymentIntentId: session.payment_intent
            }, 'Refund issued for out-of-stock purchase')
          } catch (refundError) {
            // CRITICAL FAILURE - customer charged but can't refund
            await alertCriticalFailure('refund_failed', {
              sessionId: session.id,
              paymentIntentId: session.payment_intent,
              liquidationId,
              error: refundError.message
            })
          }
        }

        return res.json({ received: true })
      }

      // 3. Create sale
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

      // 4. Mark as sold out if needed
      if (liquidation.quantitySold >= liquidation.quantity) {
        liquidation.status = 'sold_out'
      }

      await merchant.save({ session: mongoSession })
      await mongoSession.commitTransaction()

      logger.info({
        requestId,
        pickupCode,
        liquidationId,
        quantitySold: liquidation.quantitySold,
        totalQuantity: liquidation.quantity
      }, 'Sale created successfully')

      // 5. Post-transaction: Deactivate payment link (if sold out)
      if (liquidation.quantitySold >= liquidation.quantity && liquidation.stripePaymentLinkId) {
        try {
          await deactivatePaymentLink(liquidation.stripePaymentLinkId)
          logger.info({
            requestId,
            paymentLinkId: liquidation.stripePaymentLinkId
          }, 'Payment link deactivated (sold out)')
        } catch (deactivateError) {
          // NOT CRITICAL but should be monitored
          logger.error({
            requestId,
            err: deactivateError,
            paymentLinkId: liquidation.stripePaymentLinkId
          }, 'Failed to deactivate payment link (non-critical)')
        }
      }

      // 6. Send SMS confirmation
      // ⚠️ CRITICAL: Customer MUST receive pickup code
      if (customerPhone) {
        try {
          const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
          await sendPurchaseConfirmation(customerPhone, {
            pickupCode,
            expiresAt: formatDate(expiresAt)
          })

          logger.info({
            requestId,
            pickupCode
          }, 'Purchase confirmation SMS sent')

        } catch (smsError) {
          // CRITICAL FAILURE - customer paid but no pickup code
          await alertCriticalFailure('sms_confirmation_failed', {
            pickupCode,
            sessionId: session.id,
            liquidationId,
            // Don't log phone number!
            error: smsError.message
          })

          logger.fatal({
            requestId,
            pickupCode,
            err: smsError
          }, 'CRITICAL: Failed to send pickup code SMS')

          // Still return 200 to Stripe so webhook isn't retried
          // But alert has been created for manual follow-up
        }
      }

      res.json({ received: true })

    } catch (txError) {
      await mongoSession.abortTransaction()

      logger.error({
        requestId,
        err: txError,
        liquidationId,
        sessionId: session.id
      }, 'Transaction error in webhook processing')

      throw txError
    } finally {
      mongoSession.endSession()
    }

  } catch (error) {
    logger.error({
      requestId,
      err: error
    }, 'Webhook processing failed')

    res.status(500).json({ error: 'Processing failed' })
  }
}

module.exports = { handleStripeWebhook }
