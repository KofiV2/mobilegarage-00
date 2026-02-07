import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchLoyaltyHistory, fetchLoyaltyData } from '../utils/firestoreHelpers';
import { getCurrentTier, getNextTier, getTierProgress, getAllTiers } from '../utils/loyaltyTiers';
import { getUserFriendlyError } from '../utils/errorRecovery';
import logger from '../utils/logger';
import Skeleton from '../components/Skeleton';
import { useToast } from '../components/Toast';
import './LoyaltyHistoryPage.css';

// Icons
const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const WashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6l3 12h12l3-12H3z"></path>
    <path d="M7 6V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const GiftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"></polyline>
    <rect x="2" y="7" width="20" height="5"></rect>
    <line x1="12" y1="22" x2="12" y2="7"></line>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const LoyaltyHistoryPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [loyalty, setLoyalty] = useState(null);
  const [washHistory, setWashHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history' | 'benefits'

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [loyaltyData, historyData] = await Promise.all([
          fetchLoyaltyData(user.uid),
          fetchLoyaltyHistory(user.uid)
        ]);

        setLoyalty(loyaltyData);
        setWashHistory(historyData);
        logger.info('Loyalty history loaded', { uid: user.uid });
      } catch (error) {
        logger.error('Error fetching loyalty history', error);
        showToast(getUserFriendlyError(error), 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, showToast]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar-AE' : 'en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="loyalty-history-page">
        <header className="loyalty-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <BackIcon />
          </button>
          <Skeleton variant="text" width={150} height={24} />
          <div className="header-spacer"></div>
        </header>

        {/* Skeleton Tier Card */}
        <div className="tier-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Skeleton variant="circle" width={48} height={48} />
            <div>
              <Skeleton variant="text" width={100} height={20} />
              <Skeleton variant="text" width={60} height={14} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <Skeleton variant="text" width={40} height={28} />
              <Skeleton variant="text" width={60} height={12} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <Skeleton variant="text" width={40} height={28} />
              <Skeleton variant="text" width={60} height={12} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <Skeleton variant="text" width={40} height={28} />
              <Skeleton variant="text" width={60} height={12} />
            </div>
          </div>
        </div>

        {/* Skeleton Progress Card */}
        <div className="next-tier-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <Skeleton variant="text" width={120} height={16} />
            <Skeleton variant="text" width={80} height={16} />
          </div>
          <Skeleton variant="rect" width="100%" height={8} borderRadius={4} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <Skeleton variant="text" width={100} height={12} />
            <Skeleton variant="text" width={30} height={12} />
          </div>
        </div>

        {/* Skeleton Tabs */}
        <div className="loyalty-tabs">
          <Skeleton variant="rect" width="30%" height={36} borderRadius={8} />
          <Skeleton variant="rect" width="30%" height={36} borderRadius={8} />
          <Skeleton variant="rect" width="30%" height={36} borderRadius={8} />
        </div>

        {/* Skeleton Content */}
        <div className="tab-content" style={{ padding: '16px' }}>
          <Skeleton variant="rect" width="100%" height={120} borderRadius={12} />
          <div style={{ marginTop: '16px' }}>
            <Skeleton variant="text" width={140} height={20} />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
                <Skeleton variant="circle" width={40} height={40} />
                <div style={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={16} />
                  <Skeleton variant="text" width="40%" height={12} />
                </div>
                <Skeleton variant="text" width={40} height={16} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const washCount = loyalty?.washCount || 0;
  const currentTier = getCurrentTier(washCount);
  const nextTier = getNextTier(washCount);
  const progress = getTierProgress(washCount);
  const allTiers = getAllTiers();

  // Calculate free wash progress (every 6 washes)
  const freeWashProgress = washCount % 6;
  const freeWashAvailable = freeWashProgress === 0 && washCount > 0;

  return (
    <div className="loyalty-history-page">
      {/* Header */}
      <header className="loyalty-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <BackIcon />
        </button>
        <h1>{t('loyaltyHistory.title')}</h1>
        <div className="header-spacer"></div>
      </header>

      {/* Tier Card */}
      <div className="tier-card" style={{ '--tier-color': currentTier.color }}>
        <div className="tier-badge">
          <span className="tier-icon">{currentTier.icon}</span>
          <div className="tier-info">
            <span className="tier-name">{t(`loyaltyHistory.tiers.${currentTier.id}`)}</span>
            <span className="tier-member">{t('loyaltyHistory.member')}</span>
          </div>
        </div>
        <div className="tier-stats">
          <div className="stat">
            <span className="stat-value">{washCount}</span>
            <span className="stat-label">{t('loyaltyHistory.totalWashes')}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{currentTier.discount}%</span>
            <span className="stat-label">{t('loyaltyHistory.discount')}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{loyalty?.freeWashesEarned || 0}</span>
            <span className="stat-label">{t('loyaltyHistory.freeWashesEarned')}</span>
          </div>
        </div>
      </div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <div className="next-tier-card">
          <div className="next-tier-header">
            <span className="next-tier-label">{t('loyaltyHistory.progressToNext')}</span>
            <span className="next-tier-name">
              {nextTier.icon} {t(`loyaltyHistory.tiers.${nextTier.id}`)}
            </span>
          </div>
          <div className="tier-progress-bar">
            <div 
              className="tier-progress-fill" 
              style={{ 
                width: `${progress.percentage}%`,
                background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})`
              }}
            ></div>
          </div>
          <div className="tier-progress-text">
            <span>{progress.remaining} {t('loyaltyHistory.washesRemaining')}</span>
            <span>{progress.percentage}%</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="loyalty-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          {t('loyaltyHistory.tabs.overview')}
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          {t('loyaltyHistory.tabs.history')}
        </button>
        <button 
          className={`tab ${activeTab === 'benefits' ? 'active' : ''}`}
          onClick={() => setActiveTab('benefits')}
        >
          {t('loyaltyHistory.tabs.benefits')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Free Wash Progress */}
            <div className="free-wash-card">
              <div className="free-wash-header">
                <GiftIcon />
                <span>{t('loyaltyHistory.freeWashProgress')}</span>
              </div>
              <div className="free-wash-circles">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <div 
                    key={num} 
                    className={`wash-circle ${num <= freeWashProgress ? 'filled' : ''}`}
                  >
                    {num <= freeWashProgress ? <CheckIcon /> : num}
                  </div>
                ))}
                <div className={`wash-circle gift ${freeWashAvailable ? 'available' : ''}`}>
                  🎁
                </div>
              </div>
              <p className="free-wash-text">
                {freeWashAvailable 
                  ? t('loyaltyHistory.freeWashReady')
                  : t('loyaltyHistory.washesToFree', { count: 6 - freeWashProgress })}
              </p>
            </div>

            {/* Tier Ladder */}
            <div className="tier-ladder">
              <h3>{t('loyaltyHistory.tierLadder')}</h3>
              <div className="tiers-list">
                {allTiers.map((tier) => {
                  const isCurrentTier = tier.id === currentTier.id;
                  const isUnlocked = washCount >= tier.minWashes;
                  return (
                    <div 
                      key={tier.id} 
                      className={`tier-item ${isCurrentTier ? 'current' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`}
                      style={{ '--tier-color': tier.color }}
                    >
                      <div className="tier-item-icon">{tier.icon}</div>
                      <div className="tier-item-info">
                        <span className="tier-item-name">{t(`loyaltyHistory.tiers.${tier.id}`)}</span>
                        <span className="tier-item-range">
                          {tier.maxWashes === Infinity 
                            ? `${tier.minWashes}+ ${t('loyaltyHistory.washes')}`
                            : `${tier.minWashes}-${tier.maxWashes} ${t('loyaltyHistory.washes')}`}
                        </span>
                      </div>
                      <div className="tier-item-discount">
                        {tier.discount > 0 ? `${tier.discount}%` : '-'}
                      </div>
                      {isCurrentTier && (
                        <span className="current-badge">{t('loyaltyHistory.currentTier')}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="history-tab">
            {washHistory.length === 0 ? (
              <div className="empty-history">
                <WashIcon />
                <p>{t('loyaltyHistory.noHistory')}</p>
                <button className="book-btn" onClick={() => navigate('/dashboard')}>
                  {t('loyaltyHistory.bookFirst')}
                </button>
              </div>
            ) : (
              <div className="history-list">
                {washHistory.map((item, index) => (
                  <div key={item.id || index} className="history-item">
                    <div className="history-icon">
                      {item.isFreeWash ? <GiftIcon /> : <WashIcon />}
                    </div>
                    <div className="history-info">
                      <span className="history-package">
                        {t(`packages.${item.packageName}.name`)}
                      </span>
                      <span className="history-date">{formatDate(item.completedAt || item.createdAt)}</span>
                    </div>
                    <div className="history-price">
                      {item.isFreeWash ? (
                        <span className="free-badge">{t('loyaltyHistory.free')}</span>
                      ) : (
                        <span className="price">{item.price} AED</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Benefits Tab */}
        {activeTab === 'benefits' && (
          <div className="benefits-tab">
            <div className="current-benefits">
              <h3>
                {currentTier.icon} {t(`loyaltyHistory.tiers.${currentTier.id}`)} {t('loyaltyHistory.benefits')}
              </h3>
              <ul className="benefits-list">
                {currentTier.benefits.map((benefit, index) => (
                  <li key={index} className="benefit-item active">
                    <CheckIcon />
                    <span>{t(`loyaltyHistory.benefitsList.${currentTier.id}.${index}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {nextTier && (
              <div className="upcoming-benefits">
                <h3>
                  {t('loyaltyHistory.unlockWith')} {nextTier.icon} {t(`loyaltyHistory.tiers.${nextTier.id}`)}
                </h3>
                <ul className="benefits-list upcoming">
                  {nextTier.benefits
                    .filter(b => !currentTier.benefits.includes(b))
                    .map((benefit, index) => (
                      <li key={index} className="benefit-item locked">
                        <span className="lock-icon">🔒</span>
                        <span>{t(`loyaltyHistory.benefitsList.${nextTier.id}.${currentTier.benefits.length + index}`) || benefit}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoyaltyHistoryPage;
