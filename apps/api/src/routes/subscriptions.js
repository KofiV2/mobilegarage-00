const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

// Subscription plan configurations
const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Plan',
    price: 99,
    currency: 'SAR',
    interval: 'month',
    washes_included: 4,
    discount_percentage: 0,
    priority_booking: false,
    features: ['4 basic washes per month', 'Standard booking']
  },
  premium: {
    name: 'Premium Plan',
    price: 249,
    currency: 'SAR',
    interval: 'month',
    washes_included: 8,
    discount_percentage: 10,
    priority_booking: true,
    features: ['8 washes per month', '10% discount on extras', 'Priority booking', 'Free detailing once per month']
  },
  deluxe: {
    name: 'Deluxe Plan',
    price: 449,
    currency: 'SAR',
    interval: 'month',
    washes_included: 15,
    discount_percentage: 20,
    priority_booking: true,
    features: ['15 washes per month', '20% discount on all extras', 'Priority booking', 'Free premium detailing twice per month', 'Free pick-up and drop-off']
  },
  unlimited: {
    name: 'Unlimited Plan',
    price: 799,
    currency: 'SAR',
    interval: 'month',
    washes_included: -1, // -1 = unlimited
    discount_percentage: 25,
    priority_booking: true,
    features: ['Unlimited washes', '25% discount on all services', 'Priority booking', 'Free premium detailing weekly', 'Free pick-up and drop-off', '24/7 customer support']
  }
};

// Get all available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = Object.keys(SUBSCRIPTION_PLANS).map(key => ({
      id: key,
      ...SUBSCRIPTION_PLANS[key]
    }));

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    logger.error('Error fetching subscription plans', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans'
    });
  }
});

// Get user's subscriptions
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: subscriptions, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    logger.error('Error fetching user subscriptions', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions'
    });
  }
});

// Get subscription by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        users:user_id (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error('Error fetching subscription', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription'
    });
  }
});

// Create new subscription
router.post('/subscribe', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planType, paymentMethod, paymentId } = req.body;

    if (!planType || !SUBSCRIPTION_PLANS[planType]) {
      return res.status(400).json({
        success: false,
        message: 'Valid plan type is required'
      });
    }

    // Check if user already has an active subscription
    const { data: activeSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (activeSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription. Please cancel it before subscribing to a new plan.'
      });
    }

    const plan = SUBSCRIPTION_PLANS[planType];
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: planType,
        plan_name: plan.name,
        price: plan.price,
        currency: plan.currency,
        billing_interval: plan.interval,
        washes_included: plan.washes_included,
        washes_used: 0,
        discount_percentage: plan.discount_percentage,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        next_billing_date: endDate.toISOString(),
        payment_method: paymentMethod || 'stripe',
        auto_renew: true,
        usage_history: [],
        billing_history: [{
          date: startDate.toISOString(),
          amount: plan.price,
          payment_method: paymentMethod || 'stripe',
          payment_id: paymentId || null,
          status: 'paid',
          period_start: startDate.toISOString(),
          period_end: endDate.toISOString()
        }]
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Subscription created', { userId, subscriptionId: subscription.id, planType });

    res.status(201).json({
      success: true,
      message: `Successfully subscribed to ${plan.name}`,
      data: subscription
    });
  } catch (error) {
    logger.error('Error creating subscription', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    });
  }
});

// Use subscription (called when booking is made)
router.post('/:id/use', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingId } = req.body;
    const userId = req.user.id;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Verify booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (bookingError || !booking) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking'
      });
    }

    // Get subscription
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Check if subscription is active
    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Subscription is ${subscription.status}. Cannot use.`
      });
    }

    // Check if subscription has expired
    if (new Date(subscription.end_date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Subscription has expired'
      });
    }

    // Check if washes are available (unlimited = -1)
    if (subscription.washes_included !== -1 &&
        subscription.washes_used >= subscription.washes_included) {
      return res.status(400).json({
        success: false,
        message: 'No washes remaining in this billing period'
      });
    }

    // Record usage
    const usageHistory = subscription.usage_history || [];
    usageHistory.push({
      booking_id: bookingId,
      booking_number: booking.booking_number,
      service_id: booking.service_id,
      date: new Date().toISOString(),
      wash_number: subscription.washes_used + 1
    });

    const { data: updatedSubscription, error } = await supabase
      .from('subscriptions')
      .update({
        washes_used: subscription.washes_used + 1,
        usage_history: usageHistory
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const washesRemaining = subscription.washes_included === -1
      ? 'Unlimited'
      : subscription.washes_included - (subscription.washes_used + 1);

    logger.info('Subscription wash used', { userId, subscriptionId: id, bookingId });

    res.json({
      success: true,
      message: 'Wash recorded successfully',
      data: {
        subscription: updatedSubscription,
        washesRemaining
      }
    });
  } catch (error) {
    logger.error('Error using subscription', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to use subscription'
    });
  }
});

// Get usage history
router.get('/:id/usage', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('usage_history, washes_used, washes_included')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const history = (subscription.usage_history || [])
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        usage: history,
        washesUsed: subscription.washes_used,
        washesIncluded: subscription.washes_included,
        washesRemaining: subscription.washes_included === -1
          ? 'Unlimited'
          : subscription.washes_included - subscription.washes_used
      }
    });
  } catch (error) {
    logger.error('Error fetching usage history', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage history'
    });
  }
});

// Get billing history
router.get('/:id/billing', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('billing_history')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const history = (subscription.billing_history || [])
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Error fetching billing history', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing history'
    });
  }
});

// Update subscription (upgrade/downgrade)
router.patch('/:id/update', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPlanType } = req.body;
    const userId = req.user.id;

    if (!newPlanType || !SUBSCRIPTION_PLANS[newPlanType]) {
      return res.status(400).json({
        success: false,
        message: 'Valid new plan type is required'
      });
    }

    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Can only update active subscriptions'
      });
    }

    if (subscription.plan_type === newPlanType) {
      return res.status(400).json({
        success: false,
        message: 'Already subscribed to this plan'
      });
    }

    const newPlan = SUBSCRIPTION_PLANS[newPlanType];

    const { data: updatedSubscription, error } = await supabase
      .from('subscriptions')
      .update({
        plan_type: newPlanType,
        plan_name: newPlan.name,
        price: newPlan.price,
        washes_included: newPlan.washes_included,
        discount_percentage: newPlan.discount_percentage
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info('Subscription updated', {
      userId,
      subscriptionId: id,
      oldPlan: subscription.plan_type,
      newPlan: newPlanType
    });

    res.json({
      success: true,
      message: `Successfully updated to ${newPlan.name}`,
      data: updatedSubscription
    });
  } catch (error) {
    logger.error('Error updating subscription', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription'
    });
  }
});

// Toggle auto-renewal
router.patch('/:id/auto-renew', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { autoRenew } = req.body;
    const userId = req.user.id;

    if (autoRenew === undefined) {
      return res.status(400).json({
        success: false,
        message: 'autoRenew value is required'
      });
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update({ auto_renew: autoRenew })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Auto-renew toggled', { userId, subscriptionId: id, autoRenew });

    res.json({
      success: true,
      message: `Auto-renewal ${autoRenew ? 'enabled' : 'disabled'}`,
      data: subscription
    });
  } catch (error) {
    logger.error('Error toggling auto-renew', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to toggle auto-renewal'
    });
  }
});

// Cancel subscription
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is already cancelled or expired'
      });
    }

    const { data: updatedSubscription, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || null,
        auto_renew: false
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info('Subscription cancelled', { userId, subscriptionId: id, reason });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: updatedSubscription
    });
  } catch (error) {
    logger.error('Error cancelling subscription', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

// Renew subscription (manual or automatic)
router.post('/:id/renew', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentId } = req.body;
    const userId = req.user.id;

    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const newEndDate = new Date(subscription.end_date);
    newEndDate.setMonth(newEndDate.getMonth() + 1);

    const billingHistory = subscription.billing_history || [];
    billingHistory.push({
      date: new Date().toISOString(),
      amount: subscription.price,
      payment_method: paymentMethod || subscription.payment_method,
      payment_id: paymentId || null,
      status: 'paid',
      period_start: subscription.end_date,
      period_end: newEndDate.toISOString()
    });

    const { data: updatedSubscription, error } = await supabase
      .from('subscriptions')
      .update({
        end_date: newEndDate.toISOString(),
        next_billing_date: newEndDate.toISOString(),
        washes_used: 0, // Reset usage for new period
        billing_history: billingHistory,
        status: 'active'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info('Subscription renewed', { userId, subscriptionId: id });

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      data: updatedSubscription
    });
  } catch (error) {
    logger.error('Error renewing subscription', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to renew subscription'
    });
  }
});

// Admin: Get all subscriptions
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      planType
    } = req.query;

    let query = supabase
      .from('subscriptions')
      .select(`
        *,
        users:user_id (id, email, first_name, last_name)
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (planType) {
      query = query.eq('plan_type', planType);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: subscriptions, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: subscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching all subscriptions', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions'
    });
  }
});

// Admin: Get subscription statistics
router.get('/admin/statistics', adminAuth, async (req, res) => {
  try {
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*');

    if (error) throw error;

    const stats = {
      totalSubscriptions: subscriptions.length,
      byStatus: {
        active: subscriptions.filter(s => s.status === 'active').length,
        cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
        expired: subscriptions.filter(s => s.status === 'expired').length,
        paused: subscriptions.filter(s => s.status === 'paused').length
      },
      byPlan: subscriptions.reduce((acc, s) => {
        acc[s.plan_type] = (acc[s.plan_type] || 0) + 1;
        return acc;
      }, {}),
      totalRevenue: subscriptions.reduce((sum, s) => {
        const billingHistory = s.billing_history || [];
        return sum + billingHistory.reduce((total, b) => total + b.amount, 0);
      }, 0),
      monthlyRecurringRevenue: subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + s.price, 0),
      averageWashesPerSubscription: subscriptions.length > 0
        ? (subscriptions.reduce((sum, s) => sum + s.washes_used, 0) / subscriptions.length).toFixed(2)
        : 0,
      autoRenewCount: subscriptions.filter(s => s.auto_renew).length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching subscription statistics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Admin: Manually cancel subscription
router.patch('/admin/:subscriptionId/cancel', adminAuth, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { reason } = req.body;

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || `Cancelled by admin ${req.user.email}`,
        auto_renew: false
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Subscription cancelled by admin', {
      adminId: req.user.id,
      subscriptionId,
      reason
    });

    res.json({
      success: true,
      message: 'Subscription cancelled',
      data: subscription
    });
  } catch (error) {
    logger.error('Error cancelling subscription', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

// Admin: Extend subscription
router.patch('/admin/:subscriptionId/extend', adminAuth, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { days } = req.body;

    if (!days || days <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid number of days is required'
      });
    }

    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const newEndDate = new Date(subscription.end_date);
    newEndDate.setDate(newEndDate.getDate() + parseInt(days));

    const { data: updatedSubscription, error } = await supabase
      .from('subscriptions')
      .update({
        end_date: newEndDate.toISOString(),
        next_billing_date: newEndDate.toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Subscription extended by admin', {
      adminId: req.user.id,
      subscriptionId,
      extensionDays: days
    });

    res.json({
      success: true,
      message: `Subscription extended by ${days} days`,
      data: updatedSubscription
    });
  } catch (error) {
    logger.error('Error extending subscription', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to extend subscription'
    });
  }
});

// Admin: Get revenue report
router.get('/admin/revenue-report', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        users:user_id (id, email, first_name, last_name)
      `);

    if (error) throw error;

    let totalRevenue = 0;
    const revenueByPlan = {};
    const revenueDetails = [];

    subscriptions.forEach(subscription => {
      const billingHistory = subscription.billing_history || [];

      billingHistory.forEach(billing => {
        const billingDate = new Date(billing.date);

        // Apply date filters if provided
        if (startDate && billingDate < new Date(startDate)) return;
        if (endDate && billingDate > new Date(endDate)) return;

        if (billing.status === 'paid') {
          totalRevenue += billing.amount;

          if (!revenueByPlan[subscription.plan_type]) {
            revenueByPlan[subscription.plan_type] = 0;
          }
          revenueByPlan[subscription.plan_type] += billing.amount;

          revenueDetails.push({
            subscriptionId: subscription.id,
            user: subscription.users,
            planType: subscription.plan_type,
            amount: billing.amount,
            date: billing.date
          });
        }
      });
    });

    res.json({
      success: true,
      data: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        revenueByPlan,
        transactionCount: revenueDetails.length,
        details: revenueDetails.sort((a, b) => new Date(b.date) - new Date(a.date))
      }
    });
  } catch (error) {
    logger.error('Error generating revenue report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to generate revenue report'
    });
  }
});

module.exports = router;
