import React, { useState, useEffect } from 'react';
import { loyaltyAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { toast } from 'react-toastify';
import './Loyalty.css';

const Loyalty = () => {
  const [loading, setLoading] = useState(true);
  const [loyalty, setLoyalty] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [history, setHistory] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [loyaltyRes, rewardsRes, historyRes, tiersRes] = await Promise.all([
        loyaltyAPI.getMyProgram(),
        loyaltyAPI.getRewards(),
        loyaltyAPI.getHistory({ limit: 20 }),
        loyaltyAPI.getTiers()
      ]);

      setLoyalty(loyaltyRes.data.data);
      setRewards(rewardsRes.data.data.rewards);
      setHistory(historyRes.data.data);
      setTiers(tiersRes.data.data.tiers);
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
      setError(err.response?.data?.message || 'Failed to load loyalty program');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async (rewardId, points) => {
    try {
      const reward = rewards.find(r => r.id === rewardId);
      if (!reward) return;

      await loyaltyAPI.redeemPoints({
        points: points,
        rewardType: reward.type,
        rewardDetails: reward.name
      });

      toast.success(`Successfully redeemed ${reward.name}!`);
      fetchLoyaltyData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to redeem reward');
    }
  };

  const getTierProgress = () => {
    if (!loyalty || !loyalty.nextTier) return 100;
    const currentPoints = loyalty.points_balance;
    const currentTierThreshold = loyalty.tierThresholds[loyalty.tier_level];
    const nextTierThreshold = loyalty.tierThresholds[loyalty.nextTier];
    const progress = ((currentPoints - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)) * 100;
    return Math.min(progress, 100);
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2'
    };
    return colors[tier] || '#666';
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading your loyalty program..." />;
  }

  if (error) {
    return (
      <div className="loyalty-page">
        <ErrorMessage
          message="Error Loading Loyalty Program"
          details={error}
          onRetry={fetchLoyaltyData}
        />
      </div>
    );
  }

  return (
    <div className="loyalty-page">
      <div className="loyalty-header">
        <h1>Loyalty Rewards</h1>
        <p>Earn points with every wash and unlock amazing rewards!</p>
      </div>

      <div className="loyalty-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'rewards' ? 'active' : ''}
          onClick={() => setActiveTab('rewards')}
        >
          Rewards Catalog
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          Points History
        </button>
        <button
          className={activeTab === 'tiers' ? 'active' : ''}
          onClick={() => setActiveTab('tiers')}
        >
          Tier Benefits
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="loyalty-overview">
          <div className="loyalty-card-main" style={{ borderTopColor: getTierColor(loyalty.tier_level) }}>
            <div className="tier-badge" style={{ backgroundColor: getTierColor(loyalty.tier_level) }}>
              {loyalty.tier_level.toUpperCase()}
            </div>
            <div className="points-display">
              <div className="points-value">{loyalty.points_balance.toLocaleString()}</div>
              <div className="points-label">Points Balance</div>
            </div>

            {loyalty.nextTier && (
              <div className="tier-progress-section">
                <div className="progress-header">
                  <span>Progress to {loyalty.nextTier}</span>
                  <span className="points-needed">{loyalty.pointsToNextTier} points needed</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${getTierProgress()}%` }}></div>
                </div>
              </div>
            )}

            <div className="current-benefits">
              <h3>Your Current Benefits</h3>
              <div className="benefits-grid">
                <div className="benefit-item">
                  <span className="benefit-icon">✨</span>
                  <span>{loyalty.currentTierBenefits.pointsMultiplier}x Points Multiplier</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">💰</span>
                  <span>{loyalty.currentTierBenefits.discountPercentage}% Discount</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🎁</span>
                  <span>{loyalty.currentTierBenefits.freeWashesPerYear} Free Washes/Year</span>
                </div>
                {loyalty.currentTierBenefits.priorityBooking && (
                  <div className="benefit-item">
                    <span className="benefit-icon">⚡</span>
                    <span>Priority Booking</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="loyalty-stats-grid">
            <div className="stat-card">
              <div className="stat-value">{loyalty.points_earned_lifetime.toLocaleString()}</div>
              <div className="stat-label">Lifetime Points Earned</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{loyalty.points_redeemed_lifetime.toLocaleString()}</div>
              <div className="stat-label">Lifetime Points Redeemed</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="rewards-catalog">
          <h2>Available Rewards</h2>
          <p className="rewards-subtitle">Redeem your points for these amazing rewards</p>

          <div className="rewards-grid">
            {rewards.map((reward) => (
              <div key={reward.id} className={`reward-card ${!reward.available ? 'disabled' : ''}`}>
                <div className="reward-icon">
                  {reward.type === 'discount' ? '💰' : '🚗'}
                </div>
                <h3>{reward.name}</h3>
                <div className="reward-cost">{reward.pointsCost} Points</div>
                {reward.value && <div className="reward-value">{reward.value} SAR Value</div>}
                {reward.serviceType && (
                  <div className="reward-service">{reward.serviceType.charAt(0).toUpperCase() + reward.serviceType.slice(1)} Service</div>
                )}
                <button
                  className="redeem-btn"
                  disabled={!reward.available}
                  onClick={() => handleRedeemReward(reward.id, reward.pointsCost)}
                >
                  {reward.available ? 'Redeem Now' : 'Not Enough Points'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="points-history">
          <h2>Points History</h2>
          {history.length === 0 ? (
            <div className="empty-state">
              <p>No points history yet. Start earning points with your first wash!</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item, index) => (
                <div key={index} className="history-item">
                  <div className="history-icon">
                    {item.type === 'earned' ? '➕' : '➖'}
                  </div>
                  <div className="history-content">
                    <div className="history-description">{item.description}</div>
                    <div className="history-date">{new Date(item.date).toLocaleDateString()}</div>
                  </div>
                  <div className={`history-points ${item.type === 'earned' ? 'positive' : 'negative'}`}>
                    {item.type === 'earned' ? '+' : ''}{item.points}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tiers' && (
        <div className="tiers-overview">
          <h2>Tier Benefits</h2>
          <p className="tiers-subtitle">Unlock better rewards as you progress through tiers</p>

          <div className="tiers-grid">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`tier-card ${loyalty.tier_level === tier.name ? 'current' : ''}`}
                style={{ borderTopColor: getTierColor(tier.name) }}
              >
                {loyalty.tier_level === tier.name && (
                  <div className="current-tier-badge">Current Tier</div>
                )}
                <div className="tier-header" style={{ backgroundColor: getTierColor(tier.name) }}>
                  <h3>{tier.name.toUpperCase()}</h3>
                  <div className="tier-threshold">{tier.threshold}+ Points</div>
                </div>
                <div className="tier-benefits-list">
                  <div className="tier-benefit">
                    <span className="benefit-label">Points Multiplier</span>
                    <span className="benefit-value">{tier.benefits.pointsMultiplier}x</span>
                  </div>
                  <div className="tier-benefit">
                    <span className="benefit-label">Discount</span>
                    <span className="benefit-value">{tier.benefits.discountPercentage}%</span>
                  </div>
                  <div className="tier-benefit">
                    <span className="benefit-label">Free Washes/Year</span>
                    <span className="benefit-value">{tier.benefits.freeWashesPerYear}</span>
                  </div>
                  <div className="tier-benefit">
                    <span className="benefit-label">Priority Booking</span>
                    <span className="benefit-value">{tier.benefits.priorityBooking ? '✓' : '✗'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Loyalty;
