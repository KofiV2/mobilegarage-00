const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

// Punch card configuration
const PUNCHES_FOR_REWARD = 5; // 5 washes = 1 free wash
const CARD_EXPIRY_DAYS = 90; // Cards expire after 90 days

// Get user's punch cards
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = supabase
      .from('punch_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: cards, error } = await query;

    if (error) throw error;

    // Check for expired cards and update them
    const now = new Date();
    for (const card of cards) {
      if (card.status === 'active' && new Date(card.expiry_date) < now) {
        await supabase
          .from('punch_cards')
          .update({ status: 'expired' })
          .eq('id', card.id);
        card.status = 'expired';
      }
    }

    res.json({
      success: true,
      data: cards
    });
  } catch (error) {
    logger.error('Error fetching punch cards', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch punch cards'
    });
  }
});

// Get punch card by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: card, error } = await supabase
      .from('punch_cards')
      .select(`
        *,
        users:user_id (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !card) {
      return res.status(404).json({
        success: false,
        message: 'Punch card not found'
      });
    }

    res.json({
      success: true,
      data: card
    });
  } catch (error) {
    logger.error('Error fetching punch card', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch punch card'
    });
  }
});

// Create new punch card
router.post('/create', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceType } = req.body;

    if (!serviceType) {
      return res.status(400).json({
        success: false,
        message: 'Service type is required'
      });
    }

    // Check if user has an active card for this service type
    const { data: existingCard } = await supabase
      .from('punch_cards')
      .select('id')
      .eq('user_id', userId)
      .eq('service_type', serviceType)
      .eq('status', 'active')
      .single();

    if (existingCard) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active punch card for this service type'
      });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + CARD_EXPIRY_DAYS);

    const { data: card, error } = await supabase
      .from('punch_cards')
      .insert({
        user_id: userId,
        service_type: serviceType,
        punches_current: 0,
        punches_required: PUNCHES_FOR_REWARD,
        rewards_earned: 0,
        rewards_redeemed: 0,
        status: 'active',
        expiry_date: expiryDate.toISOString(),
        punch_history: []
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Punch card created', { userId, cardId: card.id, serviceType });

    res.status(201).json({
      success: true,
      message: 'Punch card created successfully',
      data: card
    });
  } catch (error) {
    logger.error('Error creating punch card', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to create punch card'
    });
  }
});

// Add punch (called when booking is completed)
router.post('/:id/punch', auth, async (req, res) => {
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
      .eq('status', 'completed')
      .single();

    if (bookingError || !booking) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking or booking not completed'
      });
    }

    // Get punch card
    const { data: card, error: fetchError } = await supabase
      .from('punch_cards')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !card) {
      return res.status(404).json({
        success: false,
        message: 'Punch card not found'
      });
    }

    // Check if card is active
    if (card.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Punch card is ${card.status}. Cannot add punches.`
      });
    }

    // Check if card is expired
    if (new Date(card.expiry_date) < new Date()) {
      await supabase
        .from('punch_cards')
        .update({ status: 'expired' })
        .eq('id', id);

      return res.status(400).json({
        success: false,
        message: 'Punch card has expired'
      });
    }

    // Check if this booking was already punched
    const punchHistory = card.punch_history || [];
    if (punchHistory.some(p => p.booking_id === bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been punched'
      });
    }

    // Add punch
    const newPunchCount = card.punches_current + 1;
    let rewardEarned = false;
    let newRewardsEarned = card.rewards_earned;

    if (newPunchCount >= card.punches_required) {
      rewardEarned = true;
      newRewardsEarned += 1;
    }

    punchHistory.push({
      booking_id: bookingId,
      booking_number: booking.booking_number,
      date: new Date().toISOString(),
      service_id: booking.service_id
    });

    const updateData = {
      punches_current: rewardEarned ? 0 : newPunchCount,
      rewards_earned: newRewardsEarned,
      punch_history: punchHistory
    };

    const { data: updatedCard, error } = await supabase
      .from('punch_cards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info('Punch added to card', {
      userId,
      cardId: id,
      bookingId,
      rewardEarned
    });

    res.json({
      success: true,
      message: rewardEarned
        ? `Congratulations! You earned a free wash reward!`
        : `Punch added! ${card.punches_required - newPunchCount} more to free wash.`,
      data: {
        card: updatedCard,
        rewardEarned,
        punchesRemaining: rewardEarned ? card.punches_required : card.punches_required - newPunchCount
      }
    });
  } catch (error) {
    logger.error('Error adding punch', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to add punch'
    });
  }
});

// Redeem reward
router.post('/:id/redeem', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: card, error: fetchError } = await supabase
      .from('punch_cards')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !card) {
      return res.status(404).json({
        success: false,
        message: 'Punch card not found'
      });
    }

    if (card.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot redeem from ${card.status} card`
      });
    }

    const availableRewards = card.rewards_earned - card.rewards_redeemed;
    if (availableRewards <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No rewards available to redeem'
      });
    }

    const { data: updatedCard, error } = await supabase
      .from('punch_cards')
      .update({
        rewards_redeemed: card.rewards_redeemed + 1
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info('Reward redeemed', { userId, cardId: id });

    res.json({
      success: true,
      message: 'Reward redeemed successfully!',
      data: {
        card: updatedCard,
        remainingRewards: availableRewards - 1
      }
    });
  } catch (error) {
    logger.error('Error redeeming reward', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to redeem reward'
    });
  }
});

// Get punch history
router.get('/:id/history', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const { data: card, error } = await supabase
      .from('punch_cards')
      .select('punch_history')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !card) {
      return res.status(404).json({
        success: false,
        message: 'Punch card not found'
      });
    }

    const history = (card.punch_history || [])
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Error fetching punch history', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch punch history'
    });
  }
});

// Get punch card statistics
router.get('/me/statistics', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: cards, error } = await supabase
      .from('punch_cards')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      totalCards: cards.length,
      activeCards: cards.filter(c => c.status === 'active').length,
      completedCards: cards.filter(c => c.status === 'completed').length,
      expiredCards: cards.filter(c => c.status === 'expired').length,
      totalPunches: cards.reduce((sum, c) => sum + (c.punch_history?.length || 0), 0),
      totalRewardsEarned: cards.reduce((sum, c) => sum + c.rewards_earned, 0),
      totalRewardsRedeemed: cards.reduce((sum, c) => sum + c.rewards_redeemed, 0),
      availableRewards: cards.reduce((sum, c) => sum + (c.rewards_earned - c.rewards_redeemed), 0)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching punch card statistics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Cancel punch card
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: card, error: fetchError } = await supabase
      .from('punch_cards')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !card) {
      return res.status(404).json({
        success: false,
        message: 'Punch card not found'
      });
    }

    if (card.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel active punch cards'
      });
    }

    const { data: updatedCard, error } = await supabase
      .from('punch_cards')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info('Punch card cancelled', { userId, cardId: id });

    res.json({
      success: true,
      message: 'Punch card cancelled',
      data: updatedCard
    });
  } catch (error) {
    logger.error('Error cancelling punch card', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to cancel punch card'
    });
  }
});

// Admin: Get all punch cards
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      serviceType
    } = req.query;

    let query = supabase
      .from('punch_cards')
      .select(`
        *,
        users:user_id (id, email, first_name, last_name)
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: cards, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: cards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching all punch cards', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch punch cards'
    });
  }
});

// Admin: Get punch card statistics
router.get('/admin/statistics', adminAuth, async (req, res) => {
  try {
    const { data: cards, error } = await supabase
      .from('punch_cards')
      .select('*');

    if (error) throw error;

    const stats = {
      totalCards: cards.length,
      byStatus: {
        active: cards.filter(c => c.status === 'active').length,
        completed: cards.filter(c => c.status === 'completed').length,
        expired: cards.filter(c => c.status === 'expired').length,
        cancelled: cards.filter(c => c.status === 'cancelled').length
      },
      totalPunches: cards.reduce((sum, c) => sum + (c.punch_history?.length || 0), 0),
      totalRewardsEarned: cards.reduce((sum, c) => sum + c.rewards_earned, 0),
      totalRewardsRedeemed: cards.reduce((sum, c) => sum + c.rewards_redeemed, 0),
      unredeemed: cards.reduce((sum, c) => sum + (c.rewards_earned - c.rewards_redeemed), 0),
      byServiceType: cards.reduce((acc, c) => {
        acc[c.service_type] = (acc[c.service_type] || 0) + 1;
        return acc;
      }, {}),
      averagePunchesPerCard: cards.length > 0
        ? (cards.reduce((sum, c) => sum + (c.punch_history?.length || 0), 0) / cards.length).toFixed(2)
        : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching punch card statistics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Admin: Manually adjust punches
router.post('/admin/:cardId/adjust', adminAuth, async (req, res) => {
  try {
    const { cardId } = req.params;
    const { punches, reason } = req.body;

    if (punches === undefined || punches === null) {
      return res.status(400).json({
        success: false,
        message: 'Punches value is required'
      });
    }

    const { data: card, error: fetchError } = await supabase
      .from('punch_cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (fetchError || !card) {
      return res.status(404).json({
        success: false,
        message: 'Punch card not found'
      });
    }

    const adjustment = parseInt(punches);
    const newPunchCount = Math.max(0, card.punches_current + adjustment);

    const punchHistory = card.punch_history || [];
    punchHistory.push({
      booking_id: null,
      booking_number: null,
      date: new Date().toISOString(),
      service_id: null,
      type: 'admin_adjustment',
      adjustment: adjustment,
      reason: reason || `Admin adjustment by ${req.user.email}`
    });

    const { data: updatedCard, error } = await supabase
      .from('punch_cards')
      .update({
        punches_current: newPunchCount,
        punch_history: punchHistory
      })
      .eq('id', cardId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Punches adjusted by admin', {
      adminId: req.user.id,
      cardId,
      adjustment,
      reason
    });

    res.json({
      success: true,
      message: `Punches adjusted by ${adjustment}`,
      data: updatedCard
    });
  } catch (error) {
    logger.error('Error adjusting punches', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to adjust punches'
    });
  }
});

// Admin: Extend card expiry
router.patch('/admin/:cardId/extend', adminAuth, async (req, res) => {
  try {
    const { cardId } = req.params;
    const { days } = req.body;

    if (!days || days <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid number of days is required'
      });
    }

    const { data: card, error: fetchError } = await supabase
      .from('punch_cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (fetchError || !card) {
      return res.status(404).json({
        success: false,
        message: 'Punch card not found'
      });
    }

    const newExpiryDate = new Date(card.expiry_date);
    newExpiryDate.setDate(newExpiryDate.getDate() + parseInt(days));

    const updateData = {
      expiry_date: newExpiryDate.toISOString()
    };

    // If card was expired, reactivate it
    if (card.status === 'expired') {
      updateData.status = 'active';
    }

    const { data: updatedCard, error } = await supabase
      .from('punch_cards')
      .update(updateData)
      .eq('id', cardId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Card expiry extended', {
      adminId: req.user.id,
      cardId,
      extensionDays: days
    });

    res.json({
      success: true,
      message: `Card expiry extended by ${days} days`,
      data: updatedCard
    });
  } catch (error) {
    logger.error('Error extending card expiry', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to extend card expiry'
    });
  }
});

module.exports = router;
