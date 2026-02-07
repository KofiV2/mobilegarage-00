/**
 * Loyalty Tier System
 * 
 * Tiers based on total wash count:
 * - Bronze: 0-5 washes (no discount)
 * - Silver: 6-15 washes (5% discount)
 * - Gold: 16-30 washes (10% discount)
 * - Platinum: 31+ washes (15% discount)
 */

export const LOYALTY_TIERS = {
  bronze: {
    id: 'bronze',
    name: 'Bronze',
    minWashes: 0,
    maxWashes: 5,
    discount: 0,
    color: '#CD7F32',
    icon: '🥉',
    benefits: [
      'Earn free wash every 6 washes',
      'Access to all packages'
    ]
  },
  silver: {
    id: 'silver',
    name: 'Silver',
    minWashes: 6,
    maxWashes: 15,
    discount: 5,
    color: '#C0C0C0',
    icon: '🥈',
    benefits: [
      '5% discount on all washes',
      'Earn free wash every 6 washes',
      'Priority booking'
    ]
  },
  gold: {
    id: 'gold',
    name: 'Gold',
    minWashes: 16,
    maxWashes: 30,
    discount: 10,
    color: '#FFD700',
    icon: '🥇',
    benefits: [
      '10% discount on all washes',
      'Earn free wash every 6 washes',
      'Priority booking',
      'Free add-on per wash'
    ]
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum',
    minWashes: 31,
    maxWashes: Infinity,
    discount: 15,
    color: '#E5E4E2',
    icon: '💎',
    benefits: [
      '15% discount on all washes',
      'Earn free wash every 6 washes',
      'VIP priority booking',
      'Free premium add-ons',
      'Exclusive member offers'
    ]
  }
};

/**
 * Get the current tier based on total wash count
 * @param {number} washCount - Total number of completed washes
 * @returns {object} Tier object with all tier details
 */
export function getCurrentTier(washCount) {
  if (washCount >= LOYALTY_TIERS.platinum.minWashes) {
    return LOYALTY_TIERS.platinum;
  }
  if (washCount >= LOYALTY_TIERS.gold.minWashes) {
    return LOYALTY_TIERS.gold;
  }
  if (washCount >= LOYALTY_TIERS.silver.minWashes) {
    return LOYALTY_TIERS.silver;
  }
  return LOYALTY_TIERS.bronze;
}

/**
 * Get the next tier (or null if at max tier)
 * @param {number} washCount - Total number of completed washes
 * @returns {object|null} Next tier object or null if at platinum
 */
export function getNextTier(washCount) {
  const currentTier = getCurrentTier(washCount);
  
  if (currentTier.id === 'bronze') return LOYALTY_TIERS.silver;
  if (currentTier.id === 'silver') return LOYALTY_TIERS.gold;
  if (currentTier.id === 'gold') return LOYALTY_TIERS.platinum;
  return null; // Already at platinum
}

/**
 * Calculate progress to next tier
 * @param {number} washCount - Total number of completed washes
 * @returns {object} Progress info with current, required, and percentage
 */
export function getTierProgress(washCount) {
  const currentTier = getCurrentTier(washCount);
  const nextTier = getNextTier(washCount);
  
  if (!nextTier) {
    // At platinum tier
    return {
      current: washCount,
      required: currentTier.minWashes,
      remaining: 0,
      percentage: 100,
      isMaxTier: true
    };
  }
  
  const washesInCurrentTier = washCount - currentTier.minWashes;
  const washesNeededForTier = nextTier.minWashes - currentTier.minWashes;
  const percentage = Math.min(100, Math.round((washesInCurrentTier / washesNeededForTier) * 100));
  
  return {
    current: washCount,
    required: nextTier.minWashes,
    remaining: nextTier.minWashes - washCount,
    percentage,
    isMaxTier: false
  };
}

/**
 * Calculate discount amount for a given price
 * @param {number} price - Original price
 * @param {number} washCount - Total wash count for tier calculation
 * @returns {object} Discount info with amount, discounted price, and percentage
 */
export function calculateTierDiscount(price, washCount) {
  const tier = getCurrentTier(washCount);
  const discountAmount = (price * tier.discount) / 100;
  
  return {
    originalPrice: price,
    discountPercentage: tier.discount,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalPrice: Math.round((price - discountAmount) * 100) / 100,
    tier: tier
  };
}

/**
 * Get all tiers as an array (for display purposes)
 * @returns {array} Array of tier objects in order
 */
export function getAllTiers() {
  return [
    LOYALTY_TIERS.bronze,
    LOYALTY_TIERS.silver,
    LOYALTY_TIERS.gold,
    LOYALTY_TIERS.platinum
  ];
}

export default {
  LOYALTY_TIERS,
  getCurrentTier,
  getNextTier,
  getTierProgress,
  calculateTierDiscount,
  getAllTiers
};
