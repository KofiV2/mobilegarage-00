const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  /**
   * Create a payment intent for wallet top-up
   */
  async createWalletTopUpIntent(userId, amount, paymentMethod = 'card') {
    try {
      // Validate amount
      if (!amount || amount < 1) {
        throw new Error('Invalid amount. Minimum top-up is $1');
      }

      if (amount > 10000) {
        throw new Error('Maximum top-up amount is $10,000');
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {
          user_id: userId,
          type: 'wallet_topup',
          description: 'Wallet Top-up'
        },
        description: `Wallet top-up for user ${userId}`
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: 'usd'
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify payment intent status
   */
  async verifyPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        success: true,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert from cents
        paid: paymentIntent.status === 'succeeded',
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process booking payment
   */
  async processBookingPayment(userId, bookingId, amount, paymentMethod = 'card') {
    try {
      if (!amount || amount < 1) {
        throw new Error('Invalid payment amount');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {
          user_id: userId,
          booking_id: bookingId,
          type: 'booking_payment'
        },
        description: `Booking payment for ${bookingId}`
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: 'usd'
      };
    } catch (error) {
      console.error('Error processing booking payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create refund
   */
  async createRefund(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    try {
      const refundData = {
        payment_intent: paymentIntentId,
        reason: reason
      };

      // If partial refund
      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const refund = await stripe.refunds.create(refundData);

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      };
    } catch (error) {
      console.error('Error creating refund:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payment method details
   */
  async getPaymentMethod(paymentMethodId) {
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

      return {
        success: true,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year
        } : null
      };
    } catch (error) {
      console.error('Error retrieving payment method:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethodToCustomer(paymentMethodId, customerId) {
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      return { success: true };
    } catch (error) {
      console.error('Error attaching payment method:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create or get Stripe customer
   */
  async createOrGetCustomer(userId, email, name) {
    try {
      // Search for existing customer
      const customers = await stripe.customers.list({
        email: email,
        limit: 1
      });

      if (customers.data.length > 0) {
        return {
          success: true,
          customerId: customers.data[0].id,
          isNew: false
        };
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: email,
        name: name,
        metadata: {
          user_id: userId
        }
      });

      return {
        success: true,
        customerId: customer.id,
        isNew: true
      };
    } catch (error) {
      console.error('Error creating/getting customer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * List customer payment methods
   */
  async listCustomerPaymentMethods(customerId) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return {
        success: true,
        paymentMethods: paymentMethods.data.map(pm => ({
          id: pm.id,
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year
        }))
      };
    } catch (error) {
      console.error('Error listing payment methods:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate cashback for transaction
   */
  calculateCashback(amount, cashbackPercentage = 5) {
    const cashback = (amount * cashbackPercentage) / 100;
    return Math.round(cashback * 100) / 100; // Round to 2 decimals
  }

  /**
   * Process wallet payment (deduct from wallet)
   */
  async processWalletPayment(userId, walletBalance, amount) {
    try {
      if (walletBalance < amount) {
        return {
          success: false,
          error: 'Insufficient wallet balance',
          required: amount,
          available: walletBalance,
          shortfall: amount - walletBalance
        };
      }

      return {
        success: true,
        newBalance: walletBalance - amount,
        amountPaid: amount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const paymentService = new PaymentService();

module.exports = paymentService;
