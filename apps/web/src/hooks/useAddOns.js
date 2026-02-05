import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { DEFAULT_ADDONS } from '../config/packages';
import logger from '../utils/logger';

/**
 * Hook to fetch dynamic add-on pricing from Firestore
 * Falls back to DEFAULT_ADDONS if Firestore document doesn't exist
 *
 * Firestore document structure (config/addOns):
 * {
 *   addOns: {
 *     tip: { price: 10, enabled: true, presetAmounts: [5, 10, 20, 50] },
 *     exterior_wax: { price: 25, enabled: true },
 *     plastic_seats: { price: 15, enabled: true },
 *     tissue_box: { price: 10, enabled: true }
 *   },
 *   lastUpdated: Timestamp
 * }
 */
const useAddOns = () => {
  const [addOns, setAddOns] = useState(
    DEFAULT_ADDONS.map(addon => ({
      ...addon,
      price: addon.defaultPrice,
      enabled: true
    }))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAddOns = useCallback(async () => {
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      const addOnsDoc = await getDoc(doc(db, 'config', 'addOns'));

      if (addOnsDoc.exists()) {
        const data = addOnsDoc.data();

        if (data.addOns) {
          // Merge Firestore prices with default add-ons structure
          const mergedAddOns = DEFAULT_ADDONS.map(defaultAddon => {
            const firestoreAddon = data.addOns[defaultAddon.id] || {};
            return {
              ...defaultAddon,
              price: firestoreAddon.price ?? defaultAddon.defaultPrice,
              enabled: firestoreAddon.enabled !== false, // Default to enabled
              presetAmounts: firestoreAddon.presetAmounts || defaultAddon.presetAmounts
            };
          });

          setAddOns(mergedAddOns);
          logger.info('Dynamic add-on pricing loaded from Firestore');
        }
      } else {
        // No add-ons document - use defaults
        logger.info('No add-ons document found, using default prices');
      }
    } catch (err) {
      logger.error('Error fetching add-ons', err);
      setError(err.message);
      // Keep using default add-ons on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddOns();
  }, [fetchAddOns]);

  /**
   * Get enabled add-ons only
   * @returns {Array} List of enabled add-ons
   */
  const getEnabledAddOns = useCallback(() => {
    return addOns.filter(addon => addon.enabled);
  }, [addOns]);

  /**
   * Get add-on by ID
   * @param {string} addonId - Add-on ID
   * @returns {Object|null} Add-on object or null
   */
  const getAddOn = useCallback((addonId) => {
    return addOns.find(addon => addon.id === addonId) || null;
  }, [addOns]);

  /**
   * Calculate total price for selected add-ons
   * @param {Object} selectedAddOns - Object with addon IDs as keys and selected values
   * @returns {number} Total add-ons price
   */
  const calculateAddOnsTotal = useCallback((selectedAddOns) => {
    let total = 0;

    Object.entries(selectedAddOns).forEach(([addonId, value]) => {
      if (!value) return;

      const addon = addOns.find(a => a.id === addonId);
      if (!addon || !addon.enabled) return;

      if (addonId === 'tip') {
        // Tip can be custom amount
        total += typeof value === 'number' ? value : addon.price;
      } else if (value === true) {
        // Boolean add-ons
        total += addon.price;
      }
    });

    return total;
  }, [addOns]);

  return {
    addOns,
    loading,
    error,
    getEnabledAddOns,
    getAddOn,
    calculateAddOnsTotal,
    refetch: fetchAddOns
  };
};

export default useAddOns;
