const express = require('express');
const Stripe = require('stripe');
const { auth } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

/**
 * @swagger
 * /api/payments-stripe/create-payment-intent:
 *   post:
 *     tags: [Payments]
 *     summary: Create Stripe payment intent
 *     description: Create a payment intent for a booking
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - amount
 *             properties:
 *               bookingId:
 *                 type: string
 *                 description: Booking ID
 *               amount:
 *                 type: number
 *                 description: Amount in AED
 *               currency:
 *                 type: string
 *                 default: aed
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { bookingId, amount, currency = 'aed' } = req.body;
    const userId = req.userId;

    // Validate inputs
    if (!bookingId || !amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'bookingId and amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be greater than 0'
      });
    }

    // Verify booking exists and belongs to user
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, user_id, booking_number, total_price')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        error: 'Booking not found',
        message: 'Booking does not exist or does not belong to you'
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents/fils
      currency: currency.toLowerCase(),
      metadata: {
        bookingId: booking.id,
        bookingNumber: booking.booking_number,
        userId: userId
      },
      description: `Payment for booking ${booking.booking_number}`,
      automatic_payment_methods: {
        enabled: true
      }
    });

    // Update booking with payment intent ID
    await supabaseAdmin
      .from('bookings')
      .update({
        payment_method: 'card',
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // Create financial transaction record
    await supabaseAdmin
      .from('financial_transactions')
      .insert({
        transaction_number: `TXN-${Date.now()}`,
        booking_id: bookingId,
        user_id: userId,
        type: 'payment',
        category: 'booking_payment',
        amount: amount,
        payment_method: 'card',
        payment_provider: 'stripe',
        transaction_id: paymentIntent.id,
        status: 'pending',
        description: `Payment for booking ${booking.booking_number}`,
        metadata: { paymentIntentId: paymentIntent.id },
        created_at: new Date().toISOString()
      });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      error: 'Failed to create payment intent',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/payments-stripe/confirm-payment:
 *   post:
 *     tags: [Payments]
 *     summary: Confirm payment
 *     description: Confirm a payment has been completed
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentIntentId
 *               - bookingId
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *               bookingId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment confirmed
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;
    const userId = req.userId;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update booking payment status
      await supabaseAdmin
        .from('bookings')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('user_id', userId);

      // Update financial transaction
      await supabaseAdmin
        .from('financial_transactions')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', paymentIntentId);

      res.json({
        message: 'Payment confirmed successfully',
        status: 'succeeded',
        bookingId: bookingId
      });
    } else {
      res.status(400).json({
        error: 'Payment not completed',
        message: `Payment status is ${paymentIntent.status}`,
        status: paymentIntent.status
      });
    }

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      error: 'Failed to confirm payment',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/payments-stripe/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Stripe webhook
 *     description: Handle Stripe webhook events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 *       400:
 *         description: Invalid signature
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);

      // Update booking and transaction status
      await supabaseAdmin
        .from('financial_transactions')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('transaction_id', paymentIntent.id);

      await supabaseAdmin
        .from('bookings')
        .update({
          payment_status: 'paid',
          status: 'confirmed'
        })
        .eq('booking_number', paymentIntent.metadata.bookingNumber);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);

      await supabaseAdmin
        .from('financial_transactions')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', failedPayment.id);

      await supabaseAdmin
        .from('bookings')
        .update({
          payment_status: 'failed'
        })
        .eq('booking_number', failedPayment.metadata.bookingNumber);
      break;

    case 'charge.refunded':
      const refund = event.data.object;
      console.log('Refund processed:', refund.id);

      await supabaseAdmin
        .from('bookings')
        .update({
          payment_status: 'refunded',
          status: 'cancelled'
        })
        .eq('booking_number', refund.metadata.bookingNumber);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

/**
 * @swagger
 * /api/payments-stripe/refund:
 *   post:
 *     tags: [Payments]
 *     summary: Refund payment
 *     description: Process a refund for a completed payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *             properties:
 *               bookingId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 description: Refund amount (optional, defaults to full refund)
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/refund', auth, async (req, res) => {
  try {
    const { bookingId, amount, reason } = req.body;
    const userId = req.userId;

    // Get booking and transaction details
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, user_id, booking_number, payment_status, total_price')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found'
      });
    }

    if (booking.payment_status !== 'paid') {
      return res.status(400).json({
        error: 'Cannot refund unpaid booking',
        message: `Booking payment status is ${booking.payment_status}`
      });
    }

    // Get payment intent ID
    const { data: transaction } = await supabaseAdmin
      .from('financial_transactions')
      .select('transaction_id')
      .eq('booking_id', bookingId)
      .eq('type', 'payment')
      .eq('status', 'completed')
      .single();

    if (!transaction) {
      return res.status(404).json({
        error: 'Payment transaction not found'
      });
    }

    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: transaction.transaction_id,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason || 'requested_by_customer',
      metadata: {
        bookingId: booking.id,
        bookingNumber: booking.booking_number,
        userId: userId
      }
    });

    // Update booking status
    await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'refunded',
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || 'Refund requested',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // Create refund transaction record
    await supabaseAdmin
      .from('financial_transactions')
      .insert({
        transaction_number: `REF-${Date.now()}`,
        booking_id: bookingId,
        user_id: userId,
        type: 'refund',
        category: 'booking_refund',
        amount: refund.amount / 100,
        payment_method: 'card',
        payment_provider: 'stripe',
        transaction_id: refund.id,
        status: 'completed',
        description: `Refund for booking ${booking.booking_number}`,
        metadata: { refundId: refund.id, originalPaymentIntent: transaction.transaction_id },
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    res.json({
      message: 'Refund processed successfully',
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      error: 'Failed to process refund',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/payments-stripe/history:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment history
 *     description: Get user's payment transaction history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *     responses:
 *       200:
 *         description: Payment history retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 10;

    const { data: transactions, error } = await supabaseAdmin
      .from('financial_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      transactions: transactions || [],
      total: transactions?.length || 0
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      error: 'Failed to fetch payment history',
      message: error.message
    });
  }
});

module.exports = router;
