import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, increment, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

/**
 * Referral rewards configuration
 */
const REFERRAL_CONFIG = {
  // Referrer gets these rewards
  referrerReward: {
    type: 'washes', // 'washes' | 'discount' | 'credit'
    value: 1, // 1 free wash added to loyalty count
  },
  // Referee (new user) gets these rewards
  refereeReward: {
    type: 'discount', // 'discount' | 'washes' | 'credit'
    discountType: 'percentage', // 'percentage' | 'fixed'
    value: 15, // 15% off first wash
  },
  // Minimum completed bookings for referrer to qualify
  minReferrerBookings: 1,
  // Maximum referrals per user
  maxReferralsPerUser: 50,
};

/**
 * Generate a unique referral code based on userId
 */
const generateReferralCode = (userId) => {
  // Take first 4 chars of userId + random 4 chars
  const prefix = userId.slice(0, 4).toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `3ON${prefix}${suffix}`;
};

/**
 * Hook to manage referral system
 */
export function useReferrals() {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user's referral data
  useEffect(() => {
    if (!user?.uid) {
      setReferralData(null);
      setLoading(false);
      return;
    }

    const loadReferralData = async () => {
      try {
        const referralRef = doc(db, 'referrals', user.uid);
        const referralDoc = await getDoc(referralRef);

        if (referralDoc.exists()) {
          setReferralData(referralDoc.data());
        } else {
          // Create referral record for new user
          const newReferralData = {
            userId: user.uid,
            code: generateReferralCode(user.uid),
            referralCount: 0,
            successfulReferrals: 0,
            pendingReferrals: 0,
            totalRewardsEarned: 0,
            createdAt: serverTimestamp(),
            referredBy: null,
          };

          await setDoc(referralRef, newReferralData);
          setReferralData(newReferralData);
        }
      } catch (err) {
        console.error('Error loading referral data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadReferralData();
  }, [user?.uid]);

  /**
   * Apply a referral code when a new user signs up
   * @param {string} code - The referral code to apply
   */
  const applyReferralCode = useCallback(async (code) => {
    if (!user?.uid) {
      return { success: false, error: 'Must be logged in to apply referral code' };
    }

    if (!code || code.trim().length === 0) {
      return { success: false, error: 'Please enter a referral code' };
    }

    try {
      // Check if user already has a referrer
      const userReferralRef = doc(db, 'referrals', user.uid);
      const userReferralDoc = await getDoc(userReferralRef);
      
      if (userReferralDoc.exists() && userReferralDoc.data().referredBy) {
        return { success: false, error: 'You have already used a referral code' };
      }

      // Find the referrer by code
      const referralsRef = collection(db, 'referrals');
      const q = query(referralsRef, where('code', '==', code.toUpperCase().trim()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, error: 'Invalid referral code' };
      }

      const referrerDoc = snapshot.docs[0];
      const referrerData = referrerDoc.data();

      // Can't refer yourself
      if (referrerData.userId === user.uid) {
        return { success: false, error: 'You cannot use your own referral code' };
      }

      // Check max referrals
      if (referrerData.referralCount >= REFERRAL_CONFIG.maxReferralsPerUser) {
        return { success: false, error: 'This referral code has reached its limit' };
      }

      // Update referrer's count
      await updateDoc(doc(db, 'referrals', referrerData.userId), {
        referralCount: increment(1),
        pendingReferrals: increment(1),
      });

      // Update referee's record
      await setDoc(userReferralRef, {
        userId: user.uid,
        code: referralData?.code || generateReferralCode(user.uid),
        referralCount: 0,
        successfulReferrals: 0,
        pendingReferrals: 0,
        totalRewardsEarned: 0,
        referredBy: referrerData.userId,
        referredByCode: code.toUpperCase().trim(),
        referralAppliedAt: serverTimestamp(),
        refereeReward: REFERRAL_CONFIG.refereeReward,
        refereeRewardUsed: false,
        createdAt: referralData?.createdAt || serverTimestamp(),
      }, { merge: true });

      // Reload referral data
      const updatedDoc = await getDoc(userReferralRef);
      setReferralData(updatedDoc.data());

      return { 
        success: true, 
        reward: REFERRAL_CONFIG.refereeReward,
        message: `You got ${REFERRAL_CONFIG.refereeReward.value}% off your first wash!`
      };
    } catch (err) {
      console.error('Error applying referral code:', err);
      return { success: false, error: 'Failed to apply referral code' };
    }
  }, [user?.uid, referralData]);

  /**
   * Mark referral as successful (called when referee completes first booking)
   * @param {string} refereeUserId - The user ID of the referee
   */
  const completeReferral = useCallback(async (refereeUserId) => {
    try {
      const completeReferralReward = httpsCallable(functions, 'completeReferralReward');
      const result = await completeReferralReward({ refereeUserId });
      return result.data;
    } catch (err) {
      console.error('Error completing referral:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Get the referral discount for checkout
   */
  const getReferralDiscount = useCallback(() => {
    if (!referralData?.refereeReward || referralData.refereeRewardUsed) {
      return null;
    }

    return referralData.refereeReward;
  }, [referralData]);

  /**
   * Mark the referral discount as used
   */
  const useReferralDiscount = useCallback(async () => {
    if (!user?.uid || !referralData?.refereeReward) return;

    try {
      await updateDoc(doc(db, 'referrals', user.uid), {
        refereeRewardUsed: true,
        refereeRewardUsedAt: serverTimestamp(),
      });

      setReferralData(prev => ({ ...prev, refereeRewardUsed: true }));
    } catch (err) {
      console.error('Error using referral discount:', err);
    }
  }, [user?.uid, referralData]);

  /**
   * Get share URL for referral code
   */
  const getShareUrl = useCallback(() => {
    if (!referralData?.code) return null;
    
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?ref=${referralData.code}`;
  }, [referralData?.code]);

  /**
   * Get WhatsApp share message
   */
  const getWhatsAppShareUrl = useCallback(() => {
    if (!referralData?.code) return null;

    const message = `Join 3ON Mobile Carwash and get 15% off your first wash! Use my referral code: ${referralData.code}\n\n${getShareUrl()}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }, [referralData?.code, getShareUrl]);

  return {
    referralData,
    loading,
    error,
    referralCode: referralData?.code,
    referralCount: referralData?.referralCount || 0,
    successfulReferrals: referralData?.successfulReferrals || 0,
    pendingReferrals: referralData?.pendingReferrals || 0,
    totalRewardsEarned: referralData?.totalRewardsEarned || 0,
    hasReferrer: !!referralData?.referredBy,
    referralDiscount: getReferralDiscount(),
    applyReferralCode,
    completeReferral,
    useReferralDiscount,
    getShareUrl,
    getWhatsAppShareUrl,
    config: REFERRAL_CONFIG,
  };
}

export default useReferrals;
