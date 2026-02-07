import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useReferrals } from '../hooks/useReferrals';
import { useToast } from './Toast';
import './ReferralCard.css';

const ReferralCard = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const {
    referralCode,
    referralCount,
    successfulReferrals,
    pendingReferrals,
    totalRewardsEarned,
    loading,
    getShareUrl,
    getWhatsAppShareUrl,
    config,
  } = useReferrals();

  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback(async () => {
    if (!referralCode) return;

    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      showToast(t('referral.codeCopied') || 'Referral code copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = referralCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralCode, showToast, t]);

  const handleShare = useCallback(async () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '3ON Mobile Carwash',
          text: t('referral.shareText', { code: referralCode }) || 
            `Join 3ON Mobile Carwash! Use my code ${referralCode} for 15% off your first wash.`,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      handleCopyCode();
    }
  }, [getShareUrl, referralCode, t, handleCopyCode]);

  const handleWhatsAppShare = useCallback(() => {
    const whatsappUrl = getWhatsAppShareUrl();
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank');
    }
  }, [getWhatsAppShareUrl]);

  if (loading) {
    return (
      <div className="referral-card loading">
        <div className="referral-skeleton"></div>
      </div>
    );
  }

  return (
    <div className="referral-card">
      <div className="referral-header">
        <span className="referral-icon">🎁</span>
        <h3>{t('referral.title') || 'Refer Friends & Earn'}</h3>
      </div>

      <p className="referral-description">
        {t('referral.description', { reward: config.referrerReward.value }) || 
          `Share your code and get ${config.referrerReward.value} free wash for every friend who books!`}
      </p>

      <div className="referral-code-box">
        <span className="referral-code">{referralCode}</span>
        <button 
          className={`copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopyCode}
          aria-label={t('referral.copyCode') || 'Copy code'}
        >
          {copied ? '✓' : '📋'}
        </button>
      </div>

      <div className="referral-stats">
        <div className="stat">
          <span className="stat-value">{referralCount}</span>
          <span className="stat-label">{t('referral.totalInvites') || 'Total Invites'}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{successfulReferrals}</span>
          <span className="stat-label">{t('referral.successful') || 'Successful'}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{totalRewardsEarned}</span>
          <span className="stat-label">{t('referral.washesEarned') || 'Washes Earned'}</span>
        </div>
      </div>

      {pendingReferrals > 0 && (
        <div className="referral-pending">
          <span className="pending-icon">⏳</span>
          <span>
            {t('referral.pendingCount', { count: pendingReferrals }) || 
              `${pendingReferrals} friend${pendingReferrals > 1 ? 's' : ''} pending first wash`}
          </span>
        </div>
      )}

      <div className="referral-actions">
        <button className="share-btn whatsapp" onClick={handleWhatsAppShare}>
          <span className="btn-icon">📱</span>
          {t('referral.shareWhatsApp') || 'WhatsApp'}
        </button>
        <button className="share-btn" onClick={handleShare}>
          <span className="btn-icon">🔗</span>
          {t('referral.share') || 'Share'}
        </button>
      </div>

      <p className="referral-terms">
        {t('referral.terms') || 
          'Your friend gets 15% off their first wash. You get 1 free wash when they complete their booking.'}
      </p>
    </div>
  );
};

export default ReferralCard;
