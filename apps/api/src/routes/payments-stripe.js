const express = require('express');
const Stripe = require('stripe');
const { auth } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const emailService = require('../services/emailService');
const paymentService = require('../services/paymentService');

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Webhook needs raw body - this route should be before express.json()
// Must be configured in index.js with express.raw() middleware

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
    const { bookingId, amount, currency = 'aed', saveCard = false } = req.body;
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
      .select('id, user_id, booking_number, total_price, scheduled_date, scheduled_time, service_id')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        error: 'Booking not found',
        message: 'Booking does not exist or does not belong to you'
      });
    }

    // Get user details
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email, full_name, stripe_customer_id')
      .eq('id', userId)
      .single();

    // Create or get Stripe customer if saving card
    let customerId = user?.stripe_customer_id;
    if (saveCard && !customerId) {
      const customerResult = await paymentService.createOrGetCustomer(
        userId,
        user.email,
        user.full_name
      );

      if (customerResult.success) {
        customerId = customerResult.customerId;
        // Save customer ID to user profile
        await supabaseAdmin
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
      }
    }

    // Create Stripe payment intent
    const paymentIntentData = {
      amount: Math.round(amount * 100), // Convert to cents/fils
      currency: currency.toLowerCase(),
      metadata: {
        bookingId: booking.id,
        bookingNumber: booking.booking_number,
        userId: userId,
        userEmail: user?.email || ''
      },
      description: `Payment for booking ${booking.booking_number}`,
      receipt_email: user?.email,
      automatic_payment_methods: {
        enabled: true
      }
    };

    // Add customer ID if saving card
    if (saveCard && customerId) {
      paymentIntentData.customer = customerId;
      paymentIntentData.setup_future_usage = 'off_session';
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

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
        metadata: {
          paymentIntentId: paymentIntent.id,
          saveCard: saveCard,
          customerId: customerId || null
        },
        created_at: new Date().toISOString()
      });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      customerId: customerId || null
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

    if (!paymentIntentId || !bookingId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'paymentIntentId and bookingId are required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Get booking details
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('*, services(name, description)')
        .eq('id', bookingId)
        .eq('user_id', userId)
        .single();

      if (!booking) {
        return res.status(404).json({
          error: 'Booking not found'
        });
      }

      // Get user details
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email, full_name')
        .eq('id', userId)
        .single();

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

      // Send payment confirmation email
      try {
        await emailService.sendBookingConfirmation({
          to: user?.email,
          customerName: user?.full_name || 'Customer',
          bookingNumber: booking.booking_number,
          serviceName: booking.services?.name || 'Car Wash Service',
          scheduledDate: booking.scheduled_date,
          scheduledTime: booking.scheduled_time,
          totalPrice: booking.total_price,
          paymentMethod: 'Card',
          paymentStatus: 'Paid',
          transactionId: paymentIntentId
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({
        message: 'Payment confirmed successfully',
        status: 'succeeded',
        bookingId: bookingId,
        bookingNumber: booking.booking_number,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
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

  console.log(`Received webhook event: ${event.type}`);

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);

        // Get booking details
        const { data: successBooking } = await supabaseAdmin
          .from('bookings')
          .select('*, services(name), users!bookings_user_id_fkey(email, full_name)')
          .eq('booking_number', paymentIntent.metadata.bookingNumber)
          .single();

        // Update financial transaction
        await supabaseAdmin
          .from('financial_transactions')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('transaction_id', paymentIntent.id);

        // Update booking status
        await supabaseAdmin
          .from('bookings')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('booking_number', paymentIntent.metadata.bookingNumber);

        // Send confirmation email
        if (successBooking && successBooking.users) {
          try {
            await emailService.sendBookingConfirmation({
              to: successBooking.users.email,
              customerName: successBooking.users.full_name || 'Customer',
              bookingNumber: successBooking.booking_number,
              serviceName: successBooking.services?.name || 'Car Wash Service',
              scheduledDate: successBooking.scheduled_date,
              scheduledTime: successBooking.scheduled_time,
              totalPrice: successBooking.total_price,
              paymentMethod: 'Card',
              paymentStatus: 'Paid',
              transactionId: paymentIntent.id
            });
          } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);

        // Get booking for failed payment
        const { data: failedBooking } = await supabaseAdmin
          .from('bookings')
          .select('*, users!bookings_user_id_fkey(email, full_name)')
          .eq('booking_number', failedPayment.metadata.bookingNumber)
          .single();

        // Update transaction status
        await supabaseAdmin
          .from('financial_transactions')
          .update({
            status: 'failed',
            metadata: {
              error: failedPayment.last_payment_error?.message || 'Payment failed',
              errorCode: failedPayment.last_payment_error?.code || 'unknown'
            },
            updated_at: new Date().toISOString()
          })
          .eq('transaction_id', failedPayment.id);

        // Update booking status
        await supabaseAdmin
          .from('bookings')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('booking_number', failedPayment.metadata.bookingNumber);

        // Send payment failed notification email
        if (failedBooking && failedBooking.users) {
          try {
            await emailService.sendEmail({
              to: failedBooking.users.email,
              subject: 'Payment Failed - Action Required',
              html: `
                <h2>Payment Failed</h2>
                <p>Dear ${failedBooking.users.full_name || 'Customer'},</p>
                <p>Unfortunately, your payment for booking <strong>${failedBooking.booking_number}</strong> has failed.</p>
                <p><strong>Reason:</strong> ${failedPayment.last_payment_error?.message || 'Unknown error'}</p>
                <p>Please try again or contact support if the issue persists.</p>
                <p>Thank you,<br>In and Out Car Wash Team</p>
              `
            });
          } catch (emailError) {
            console.error('Failed to send payment failed email:', emailError);
          }
        }
        break;

      case 'charge.refunded':
        const charge = event.data.object;
        console.log('Refund processed:', charge.id);

        // Get payment intent ID from charge
        const paymentIntentId = charge.payment_intent;

        // Find and update booking
        const { data: refundedBooking } = await supabaseAdmin
          .from('financial_transactions')
          .select('booking_id, bookings(*, users!bookings_user_id_fkey(email, full_name))')
          .eq('transaction_id', paymentIntentId)
          .single();

        if (refundedBooking) {
          // Update booking status
          await supabaseAdmin
            .from('bookings')
            .update({
              payment_status: 'refunded',
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', refundedBooking.booking_id);

          // Create refund transaction record
          await supabaseAdmin
            .from('financial_transactions')
            .insert({
              transaction_number: `REF-${Date.now()}`,
              booking_id: refundedBooking.booking_id,
              user_id: refundedBooking.bookings.user_id,
              type: 'refund',
              category: 'booking_refund',
              amount: charge.amount_refunded / 100,
              payment_method: 'card',
              payment_provider: 'stripe',
              transaction_id: charge.refunds.data[0]?.id || `refund_${Date.now()}`,
              status: 'completed',
              description: `Refund for booking ${refundedBooking.bookings.booking_number}`,
              metadata: { originalCharge: charge.id, refundReason: charge.refunds.data[0]?.reason },
              processed_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            });

          // Send refund confirmation email
          if (refundedBooking.bookings.users) {
            try {
              await emailService.sendEmail({
                to: refundedBooking.bookings.users.email,
                subject: 'Refund Processed Successfully',
                html: `
                  <h2>Refund Processed</h2>
                  <p>Dear ${refundedBooking.bookings.users.full_name || 'Customer'},</p>
                  <p>Your refund for booking <strong>${refundedBooking.bookings.booking_number}</strong> has been processed successfully.</p>
                  <p><strong>Refund Amount:</strong> AED ${(charge.amount_refunded / 100).toFixed(2)}</p>
                  <p>The refund will appear in your account within 5-10 business days.</p>
                  <p>Thank you,<br>In and Out Car Wash Team</p>
                `
              });
            } catch (emailError) {
              console.error('Failed to send refund email:', emailError);
            }
          }
        }
        break;

      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        console.log('Payment method attached:', paymentMethod.id);
        // Handle saved payment method if needed
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 to acknowledge receipt
    res.json({ received: true, error: error.message });
  }
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

/**
 * @swagger
 * /api/payments-stripe/payment-methods:
 *   get:
 *     tags: [Payments]
 *     summary: Get saved payment methods
 *     description: Retrieve user's saved payment methods
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/payment-methods', auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's Stripe customer ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single();

    if (!user?.stripe_customer_id) {
      return res.json({
        paymentMethods: [],
        message: 'No saved payment methods'
      });
    }

    // Get payment methods from Stripe
    const result = await paymentService.listCustomerPaymentMethods(user.stripe_customer_id);

    if (result.success) {
      res.json({
        paymentMethods: result.paymentMethods
      });
    } else {
      res.status(500).json({
        error: 'Failed to retrieve payment methods',
        message: result.error
      });
    }

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      error: 'Failed to fetch payment methods',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/payments-stripe/receipt/{transactionId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment receipt
 *     description: Retrieve payment receipt for a transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Receipt data retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Transaction not found
 */
router.get('/receipt/:transactionId', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.userId;

    // Get transaction details
    const { data: transaction, error } = await supabaseAdmin
      .from('financial_transactions')
      .select(`
        *,
        bookings (
          *,
          services (name, description),
          users!bookings_user_id_fkey (email, full_name, phone)
        )
      `)
      .eq('transaction_id', transactionId)
      .eq('user_id', userId)
      .single();

    if (error || !transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
        message: 'Receipt not available for this transaction'
      });
    }

    // Get payment intent details from Stripe
    let stripeDetails = null;
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
      stripeDetails = {
        paymentMethod: paymentIntent.payment_method,
        receiptEmail: paymentIntent.receipt_email,
        created: new Date(paymentIntent.created * 1000).toISOString(),
        receiptUrl: paymentIntent.charges?.data[0]?.receipt_url || null
      };
    } catch (stripeError) {
      console.error('Error fetching Stripe details:', stripeError);
    }

    // Format receipt data
    const receipt = {
      transactionNumber: transaction.transaction_number,
      transactionId: transaction.transaction_id,
      date: transaction.created_at,
      processedDate: transaction.processed_at,
      amount: transaction.amount,
      currency: 'AED',
      status: transaction.status,
      paymentMethod: transaction.payment_method,
      paymentProvider: transaction.payment_provider,
      description: transaction.description,
      booking: transaction.bookings ? {
        bookingNumber: transaction.bookings.booking_number,
        serviceName: transaction.bookings.services?.name,
        scheduledDate: transaction.bookings.scheduled_date,
        scheduledTime: transaction.bookings.scheduled_time,
        numberOfVehicles: transaction.bookings.number_of_vehicles,
        totalPrice: transaction.bookings.total_price
      } : null,
      customer: transaction.bookings?.users ? {
        name: transaction.bookings.users.full_name,
        email: transaction.bookings.users.email,
        phone: transaction.bookings.users.phone
      } : null,
      stripe: stripeDetails
    };

    res.json({
      receipt: receipt
    });

  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({
      error: 'Failed to fetch receipt',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/payments-stripe/publishable-key:
 *   get:
 *     tags: [Payments]
 *     summary: Get Stripe publishable key
 *     description: Retrieve the Stripe publishable key for frontend
 *     responses:
 *       200:
 *         description: Publishable key retrieved
 */
router.get('/publishable-key', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ''
  });
});

module.exports = router;
