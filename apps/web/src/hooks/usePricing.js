import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PACKAGES, VEHICLE_TYPES, VEHICLE_SIZES } from '@3on/shared';
import logger from '../utils/logger';

/**
 * Hook to fetch dynamic pricing from Firestore
 * Falls back to hardcoded PACKAGES if Firestore document doesn't exist
 *
 * Firestore document structure (config/pricing):
 * {
 *   packages: {
 *     platinum: { prices: { sedan: 45, suv: 50, ... } },
 *     titanium: { prices: { sedan: 75, suv: 80, ... } },
 *     diamond: { prices: { sedan: 110, suv: 120, ... } }
 *   },
 *   lastUpdated: Timestamp
 * }
 */
const usePricing = () => {
  const [packages, setPackages] = useState(PACKAGES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPricing = async () => {
      if (!db) {
        setLoading(false);
        return;
      }

      try {
        const pricingDoc = await getDoc(doc(db, 'config', 'pricing'));

        if (pricingDoc.exists()) {
          const data = pricingDoc.data();

          if (data.packages) {
            // Merge Firestore prices with default PACKAGES structure
            const mergedPackages = { ...PACKAGES };

            Object.keys(data.packages).forEach((pkgId) => {
              if (mergedPackages[pkgId] && data.packages[pkgId].prices) {
                mergedPackages[pkgId] = {
                  ...mergedPackages[pkgId],
                  prices: {
                    ...mergedPackages[pkgId].prices,
                    ...data.packages[pkgId].prices
                  }
                };
              }
            });

            setPackages(mergedPackages);
            logger.info('Dynamic pricing loaded from Firestore');
          }
        } else {
          // No pricing document - use defaults
          logger.info('No pricing document found, using default prices');
        }
      } catch (err) {
        logger.error('Error fetching pricing', err);
        setError(err.message);
        // Keep using default PACKAGES on error
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, []);

  /**
   * Get price for a specific vehicle type and package
   * @param {string} packageId - Package ID (platinum, titanium, diamond)
   * @param {string} vehicleType - Vehicle type (sedan, suv, motorcycle, caravan, boat)
   * @param {string} vehicleSize - Optional size for caravan/boat (small, medium, large)
   * @returns {number|null} Price in AED or null if not available
   */
  const getPrice = (packageId, vehicleType, vehicleSize = null) => {
    const pkg = packages[packageId];
    if (!pkg) return null;

    const vehicleConfig = VEHICLE_TYPES.find(v => v.id === vehicleType);
    if (vehicleConfig?.hasSizes && vehicleSize) {
      const priceKey = `${vehicleType}_${vehicleSize}`;
      return pkg.prices[priceKey] ?? null;
    }

    return pkg.prices[vehicleType] ?? null;
  };

  return {
    packages,
    loading,
    error,
    getPrice,
    VEHICLE_TYPES,
    VEHICLE_SIZES
  };
};

export default usePricing;
