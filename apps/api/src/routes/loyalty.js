const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

// Points earning rules
const POINTS_PER_SAR = 1; // 1 point per SAR spent
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 1500,
  platinum: 3000
};

const TIER_BENEFITS = {
  bronze: {
    pointsMultiplier: 1,
    discountPercentage: 0,
    freeWashesPerYear: 0,
    priorityBooking: false
  },
  silver: {
    pointsMultiplier: 1.25,
    discountPercentage: 5,
    freeWashesPerYear: 1,
    priorityBooking: false
  },
  gold: {
    pointsMultiplier: 1.5,
    discountPercentage: 10,
    freeWashesPerYear: 2,
    priorityBooking: true
  },
  platinum: {
    pointsMultiplier: 2,
    discountPercentage: 15,
    freeWashesPerYear: 4,
    priorityBooking: true
  }
};

// Calculate tier based on points
function calculateTier(points) {
  if (points >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (points >= TIER_THRESHOLDS.gold) return 'gold';
  if (points >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

// Get user's loyalty program
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    let { data: loyalty, error } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Create loyalty program if doesn't exist
    if (error && error.code === 'PGRST116') {
      const { data: newLoyalty, error: createError } = await supabase
        .from('loyalty_programs')
        .insert({
          user_id: userId,
          points_balance: 0,
          points_earned_lifetime: 0,
          points_redeemed_lifetime: 0,
          tier_level: 'bronze',
          tier_benefits: TIER_BENEFITS.bronze,
          points_history: []
        })
        .select()
        .single();

      if (createError) throw createError;
      loyalty = newLoyalty;
    } else if (error) {
      throw error;
    }

    // Get tier info
    const currentTier = loyalty.tier_level;
    const nextTier = currentTier === 'bronze' ? 'silver' :
                     currentTier === 'silver' ? 'gold' :
                     currentTier === 'gold' ? 'platinum' : null;

    const pointsToNextTier = nextTier ?
      TIER_THRESHOLDS[nextTier] - loyalty.points_balance : 0;

    res.json({
      success: true,
      data: {
        ...loyalty,
        currentTierBenefits: TIER_BENEFITS[currentTier],
        nextTier,
        pointsToNextTier: nextTier ? pointsToNextTier : null,
        tierThresholds: TIER_THRESHOLDS
      }
    });
  } catch (error) {
    logger.error('Error fetching loyalty program', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loyalty program'
    });
  }
});

// Earn points (called when booking is completed)
router.post('/earn', auth, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    const userId = req.user.id;

    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and amount are required'
      });
    }

    // Verify booking belongs to user and is completed
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

    // Get loyalty program
    const { data: loyalty } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Calculate points
    const tierMultiplier = TIER_BENEFITS[loyalty.tier_level].pointsMultiplier;
    const basePoints = Math.floor(parseFloat(amount) * POINTS_PER_SAR);
    const earnedPoints = Math.floor(basePoints * tierMultiplier);

    // Update loyalty program
    const newPointsBalance = loyalty.points_balance + earnedPoints;
    const newPointsEarned = loyalty.points_earned_lifetime + earnedPoints;
    const newTier = calculateTier(newPointsBalance);

    const pointsHistory = loyalty.points_history || [];
    pointsHistory.push({
      date: new Date().toISOString(),
      type: 'earned',
      points: earnedPoints,
      bookingId: bookingId,
      description: `Earned from booking ${booking.booking_number}`
    });

    const { data: updatedLoyalty, error } = await supabase
      .from('loyalty_programs')
      .update({
        points_balance: newPointsBalance,
        points_earned_lifetime: newPointsEarned,
        tier_level: newTier,
        tier_benefits: TIER_BENEFITS[newTier],
        points_history: pointsHistory
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Points earned', { userId, points: earnedPoints, bookingId });

    res.json({
      success: true,
      message: `Earned ${earnedPoints} points!`,
      data: {
        earnedPoints,
        newBalance: newPointsBalance,
        tierChanged: newTier !== loyalty.tier_level,
        newTier: newTier,
        loyalty: updatedLoyalty
      }
    });
  } catch (error) {
    logger.error('Error earning points', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to earn points'
    });
  }
});

// Redeem points
router.post('/redeem', auth, async (req, res) => {
  try {
    const { points, rewardType, rewardDetails } = req.body;
    const userId = req.user.id;

    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid points amount is required'
      });
    }

    // Get loyalty program
    const { data: loyalty, error: fetchError } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Check if user has enough points
    if (loyalty.points_balance < points) {
      return res.status(400).json({
        success: false,
        message: `Insufficient points. You have ${loyalty.points_balance} points`
      });
    }

    // Update loyalty program
    const newPointsBalance = loyalty.points_balance - points;
    const newPointsRedeemed = loyalty.points_redeemed_lifetime + points;
    const newTier = calculateTier(newPointsBalance);

    const pointsHistory = loyalty.points_history || [];
    pointsHistory.push({
      date: new Date().toISOString(),
      type: 'redeemed',
      points: -points,
      rewardType: rewardType || 'discount',
      description: rewardDetails || `Redeemed ${points} points`
    });

    const { data: updatedLoyalty, error } = await supabase
      .from('loyalty_programs')
      .update({
        points_balance: newPointsBalance,
        points_redeemed_lifetime: newPointsRedeemed,
        tier_level: newTier,
        tier_benefits: TIER_BENEFITS[newTier],
        points_history: pointsHistory
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Points redeemed', { userId, points, rewardType });

    res.json({
      success: true,
      message: `Redeemed ${points} points successfully`,
      data: {
        redeemedPoints: points,
        newBalance: newPointsBalance,
        tierChanged: newTier !== loyalty.tier_level,
        newTier: newTier,
        loyalty: updatedLoyalty
      }
    });
  } catch (error) {
    logger.error('Error redeeming points', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to redeem points'
    });
  }
});

// Get points history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, type } = req.query;

    const { data: loyalty, error } = await supabase
      .from('loyalty_programs')
      .select('points_history')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    let history = loyalty.points_history || [];

    // Filter by type if specified
    if (type) {
      history = history.filter(h => h.type === type);
    }

    // Sort by date descending and limit
    history = history
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Error fetching points history', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch points history'
    });
  }
});

// Get available rewards
router.get('/rewards', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: loyalty } = await supabase
      .from('loyalty_programs')
      .select('points_balance, tier_level')
      .eq('user_id', userId)
      .single();

    const points = loyalty?.points_balance || 0;

    // Define available rewards
    const rewards = [
      {
        id: 'discount_50',
        name: '50 SAR Discount',
        pointsCost: 500,
        type: 'discount',
        value: 50,
        available: points >= 500
      },
      {
        id: 'discount_100',
        name: '100 SAR Discount',
        pointsCost: 900,
        type: 'discount',
        value: 100,
        available: points >= 900
      },
      {
        id: 'free_basic',
        name: 'Free Basic Wash',
        pointsCost: 250,
        type: 'service',
        serviceType: 'basic',
        available: points >= 250
      },
      {
        id: 'free_premium',
        name: 'Free Premium Wash',
        pointsCost: 500,
        type: 'service',
        serviceType: 'premium',
        available: points >= 500
      },
      {
        id: 'free_deluxe',
        name: 'Free Deluxe Detail',
        pointsCost: 1250,
        type: 'service',
        serviceType: 'deluxe',
        available: points >= 1250
      }
    ];

    res.json({
      success: true,
      data: {
        currentPoints: points,
        currentTier: loyalty?.tier_level || 'bronze',
        rewards: rewards
      }
    });
  } catch (error) {
    logger.error('Error fetching rewards', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rewards'
    });
  }
});

// Get tier benefits
router.get('/tiers', async (req, res) => {
  try {
    const tiers = Object.keys(TIER_THRESHOLDS).map(tier => ({
      name: tier,
      threshold: TIER_THRESHOLDS[tier],
      benefits: TIER_BENEFITS[tier]
    }));

    res.json({
      success: true,
      data: {
        tiers,
        pointsPerSAR: POINTS_PER_SAR
      }
    });
  } catch (error) {
    logger.error('Error fetching tier info', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tier information'
    });
  }
});

// Admin: Get all loyalty programs with statistics
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, tier } = req.query;

    let query = supabase
      .from('loyalty_programs')
      .select(`
        *,
        users:user_id (id, email, first_name, last_name)
      `, { count: 'exact' });

    if (tier) {
      query = query.eq('tier_level', tier);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .order('points_balance', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: programs, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: programs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching loyalty programs', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loyalty programs'
    });
  }
});

// Admin: Manually adjust points
router.post('/admin/adjust/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { points, reason } = req.body;

    if (!points || points === 0) {
      return res.status(400).json({
        success: false,
        message: 'Points amount is required'
      });
    }

    const { data: loyalty, error: fetchError } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const adjustment = parseInt(points);
    const newPointsBalance = Math.max(0, loyalty.points_balance + adjustment);
    const newTier = calculateTier(newPointsBalance);

    const pointsHistory = loyalty.points_history || [];
    pointsHistory.push({
      date: new Date().toISOString(),
      type: adjustment > 0 ? 'admin_credit' : 'admin_debit',
      points: adjustment,
      description: reason || `Admin adjustment by ${req.user.email}`
    });

    const updateData = {
      points_balance: newPointsBalance,
      tier_level: newTier,
      tier_benefits: TIER_BENEFITS[newTier],
      points_history: pointsHistory
    };

    if (adjustment > 0) {
      updateData.points_earned_lifetime = loyalty.points_earned_lifetime + adjustment;
    } else {
      updateData.points_redeemed_lifetime = loyalty.points_redeemed_lifetime + Math.abs(adjustment);
    }

    const { data: updatedLoyalty, error } = await supabase
      .from('loyalty_programs')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Points adjusted by admin', {
      adminId: req.user.id,
      userId,
      adjustment,
      reason
    });

    res.json({
      success: true,
      message: `Points adjusted by ${adjustment}`,
      data: updatedLoyalty
    });
  } catch (error) {
    logger.error('Error adjusting points', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to adjust points'
    });
  }
});

module.exports = router;
