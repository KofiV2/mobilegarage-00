/**
 * useSubscription Hook
 * 
 * Subscription management for recurring carwash plans.
 * Creates predictable MRR with weekly wash packages.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

// Subscription Plans - UAE pricing in AED
export const SUBSCRIPTION_PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic Plan',
    nameAr: 'الباقة الأساسية',
    price: 199,
    currency: 'AED',
    period: 'month',
    washesPerMonth: 4,
    services: ['basic-wash'],
    extras: [],
    savings: 25,
    description: '4 basic washes per month',
    descriptionAr: '4 غسلات أساسية شهرياً',
    features: [
      'Weekly exterior wash',
      'Flexible scheduling',
      'Standard support',
    ],
    featuresAr: [
      'غسيل خارجي أسبوعي',
      'جدولة مرنة',
      'دعم عادي',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium Plan',
    nameAr: 'الباقة المميزة',
    price: 349,
    currency: 'AED',
    period: 'month',
    washesPerMonth: 4,
    services: ['premium-wash'],
    extras: ['interior_vacuum', 'tire_shine'],
    savings: 30,
    badge: 'MOST POPULAR',
    badgeAr: 'الأكثر شعبية',
    description: '4 premium washes + extras',
    descriptionAr: '4 غسلات مميزة + إضافات',
    features: [
      'Weekly premium wash',
      'Interior vacuum included',
      'Tire shine included',
      'Priority scheduling',
    ],
    featuresAr: [
      'غسيل مميز أسبوعي',
      'تنظيف داخلي مشمول',
      'تلميع الإطارات مشمول',
      'أولوية في الحجز',
    ],
  },
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited Plan',
    nameAr: 'الباقة اللامحدودة',
    price: 499,
    currency: 'AED',
    period: 'month',
    washesPerMonth: 8, // Soft cap
    services: ['platinum-wash'],
    extras: ['interior_vacuum', 'tire_shine', 'leather_care', 'engine_clean'],
    savings: 40,
    badge: 'BEST VALUE',
    badgeAr: 'أفضل قيمة',
    description: 'Unlimited washes, all extras',
    descriptionAr: 'غسيل غير محدود، جميع الإضافات',
    features: [
      'Unlimited washes (up to 8/month)',
      'All premium extras included',
      'Leather care included',
      'Engine cleaning included',
      'Dedicated staff assignment',
      'Priority scheduling',
      '24/7 WhatsApp support',
    ],
    featuresAr: [
      'غسيل غير محدود (حتى 8 شهرياً)',
      'جميع الإضافات المميزة مشمولة',
      'العناية بالجلد مشمولة',
      'تنظيف المحرك مشمول',
      'موظف مخصص',
      'أولوية في الحجز',
      'دعم واتساب 24/7',
    ],
  },
};

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's subscription
  useEffect(() => {
    if (!user?.uid) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const subRef = doc(db, 'subscriptions', user.uid);
    const unsubscribe = onSnapshot(subRef, 
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSubscription({
            ...data,
            plan: SUBSCRIPTION_PLANS[data.planId],
          });
        } else {
          setSubscription(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Subscription fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Check if subscription is active
  const isActive = useCallback(() => {
    if (!subscription) return false;
    if (subscription.status !== 'active') return false;
    
    const endDate = subscription.currentPeriodEnd?.toDate?.() || 
                    new Date(subscription.currentPeriodEnd);
    return endDate > new Date();
  }, [subscription]);

  // Get remaining washes this month
  const getRemainingWashes = useCallback(() => {
    if (!subscription || !isActive()) return 0;
    
    const plan = SUBSCRIPTION_PLANS[subscription.planId];
    const usedThisMonth = subscription.washesUsedThisMonth || 0;
    return Math.max(0, plan.washesPerMonth - usedThisMonth);
  }, [subscription, isActive]);

  // Subscribe to a plan
  const subscribe = async (planId) => {
    if (!user?.uid) throw new Error('Must be logged in');
    
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) throw new Error('Invalid plan');

    try {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const subscriptionData = {
        userId: user.uid,
        planId,
        status: 'active',
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
        washesUsedThisMonth: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'subscriptions', user.uid), subscriptionData);
      
      return { success: true };
    } catch (err) {
      console.error('Subscribe error:', err);
      return { success: false, error: err.message };
    }
  };

  // Use a wash from subscription
  const useWash = async (bookingId) => {
    if (!user?.uid || !subscription) return { success: false, error: 'No subscription' };
    if (!isActive()) return { success: false, error: 'Subscription not active' };
    if (getRemainingWashes() <= 0) return { success: false, error: 'No washes remaining' };

    try {
      const subRef = doc(db, 'subscriptions', user.uid);
      await updateDoc(subRef, {
        washesUsedThisMonth: (subscription.washesUsedThisMonth || 0) + 1,
        lastWashDate: serverTimestamp(),
        lastWashBookingId: bookingId,
        updatedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (err) {
      console.error('Use wash error:', err);
      return { success: false, error: err.message };
    }
  };

  // Cancel subscription
  const cancel = async () => {
    if (!user?.uid || !subscription) return { success: false, error: 'No subscription' };

    try {
      const subRef = doc(db, 'subscriptions', user.uid);
      await updateDoc(subRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (err) {
      console.error('Cancel error:', err);
      return { success: false, error: err.message };
    }
  };

  // Change plan
  const changePlan = async (newPlanId) => {
    if (!user?.uid || !subscription) return { success: false, error: 'No subscription' };
    
    const plan = SUBSCRIPTION_PLANS[newPlanId];
    if (!plan) return { success: false, error: 'Invalid plan' };

    try {
      const subRef = doc(db, 'subscriptions', user.uid);
      await updateDoc(subRef, {
        planId: newPlanId,
        planChangedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (err) {
      console.error('Change plan error:', err);
      return { success: false, error: err.message };
    }
  };

  // Calculate savings compared to pay-per-wash
  const calculateSavings = (planId, monthlyWashes = 4) => {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) return 0;
    
    // Assume average wash price is 89 AED
    const avgWashPrice = 89;
    const regularCost = avgWashPrice * monthlyWashes;
    const savings = regularCost - plan.price;
    
    return Math.max(0, savings);
  };

  return {
    subscription,
    loading,
    error,
    isActive,
    getRemainingWashes,
    subscribe,
    useWash,
    cancel,
    changePlan,
    calculateSavings,
    plans: SUBSCRIPTION_PLANS,
  };
}

export default useSubscription;
