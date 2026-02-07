import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Hook to manage promo code validation and application
 */
export function usePromoCode() {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Validate a promo code against Firestore
   * @param {string} code - The promo code to validate
   * @param {string} packageId - The selected package ID
   * @returns {Promise<{valid: boolean, promo?: object, error?: string}>}
   */
  const validatePromoCode = useCallback(async (code, packageId) => {
    if (!code || code.trim().length === 0) {
      return { valid: false, error: 'Please enter a promo code' };
    }

    setIsValidating(true);
    setError(null);

    try {
      const promoRef = collection(db, 'promoCodes');
      const q = query(
        promoRef,
        where('code', '==', code.toUpperCase().trim()),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('Invalid promo code');
        return { valid: false, error: 'Invalid promo code' };
      }

      const promoDoc = snapshot.docs[0];
      const promo = { id: promoDoc.id, ...promoDoc.data() };

      // Check if expired
      const now = new Date();
      const expiresAt = promo.expiresAt?.toDate?.() || new Date(promo.expiresAt);
      if (expiresAt < now) {
        setError('This promo code has expired');
        return { valid: false, error: 'This promo code has expired' };
      }

      // Check max uses
      if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) {
        setError('This promo code has reached its usage limit');
        return { valid: false, error: 'This promo code has reached its usage limit' };
      }

      // Check if applicable to this package
      if (promo.applicablePackages && promo.applicablePackages.length > 0) {
        if (!promo.applicablePackages.includes(packageId)) {
          setError('This promo code is not valid for the selected package');
          return { valid: false, error: 'This promo code is not valid for the selected package' };
        }
      }

      // Promo is valid!
      setAppliedPromo(promo);
      return { valid: true, promo };
    } catch (err) {
      console.error('Error validating promo code:', err);
      setError('Failed to validate promo code');
      return { valid: false, error: 'Failed to validate promo code' };
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Apply the promo code by incrementing its usage counter
   * Call this when booking is confirmed
   */
  const applyPromoCode = useCallback(async () => {
    if (!appliedPromo) return;

    try {
      const promoRef = doc(db, 'promoCodes', appliedPromo.id);
      await updateDoc(promoRef, {
        currentUses: increment(1)
      });
    } catch (err) {
      console.error('Error applying promo code:', err);
    }
  }, [appliedPromo]);

  /**
   * Calculate the discount amount
   * @param {number} originalPrice - The original price before discount
   * @returns {number} - The discount amount
   */
  const calculateDiscount = useCallback((originalPrice) => {
    if (!appliedPromo) return 0;

    if (appliedPromo.discountType === 'percentage') {
      return Math.round(originalPrice * (appliedPromo.discountValue / 100));
    } else {
      // Fixed discount
      return Math.min(appliedPromo.discountValue, originalPrice);
    }
  }, [appliedPromo]);

  /**
   * Get the final price after discount
   * @param {number} originalPrice - The original price before discount
   * @returns {number} - The final price after discount
   */
  const getFinalPrice = useCallback((originalPrice) => {
    const discount = calculateDiscount(originalPrice);
    return Math.max(0, originalPrice - discount);
  }, [calculateDiscount]);

  /**
   * Clear the applied promo code
   */
  const clearPromoCode = useCallback(() => {
    setPromoCode('');
    setAppliedPromo(null);
    setError(null);
  }, []);

  return {
    promoCode,
    setPromoCode,
    appliedPromo,
    isValidating,
    error,
    validatePromoCode,
    applyPromoCode,
    calculateDiscount,
    getFinalPrice,
    clearPromoCode
  };
}

export default usePromoCode;
