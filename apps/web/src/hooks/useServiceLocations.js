/**
 * useServiceLocations Hook
 * 
 * Manages service locations/branches for the 3ON Mobile Carwash.
 * Allows customers to select their service area and enables
 * location-based staff assignment and analytics.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Default service locations for UAE
const DEFAULT_LOCATIONS = [
  {
    id: 'dubai-downtown',
    name: 'Dubai Downtown',
    nameAr: 'دبي داون تاون',
    emirate: 'Dubai',
    emirateAr: 'دبي',
    areas: ['Downtown', 'DIFC', 'Business Bay', 'City Walk', 'Al Wasl'],
    areasAr: ['داون تاون', 'مركز دبي المالي', 'الخليج التجاري', 'سيتي ووك', 'الوصل'],
    isActive: true,
    basePrice: 0, // No surcharge
    estimatedTime: '45-60 min',
    coordinates: { lat: 25.1972, lng: 55.2744 },
    priority: 1,
  },
  {
    id: 'dubai-marina',
    name: 'Dubai Marina',
    nameAr: 'دبي مارينا',
    emirate: 'Dubai',
    emirateAr: 'دبي',
    areas: ['Marina', 'JBR', 'JLT', 'Palm Jumeirah', 'Internet City'],
    areasAr: ['مارينا', 'جي بي آر', 'أبراج بحيرات جميرا', 'نخلة جميرا', 'مدينة الإنترنت'],
    isActive: true,
    basePrice: 0,
    estimatedTime: '45-60 min',
    coordinates: { lat: 25.0805, lng: 55.1403 },
    priority: 2,
  },
  {
    id: 'dubai-deira',
    name: 'Dubai Deira & Bur Dubai',
    nameAr: 'ديرة وبر دبي',
    emirate: 'Dubai',
    emirateAr: 'دبي',
    areas: ['Deira', 'Bur Dubai', 'Al Rigga', 'Oud Metha', 'Al Karama'],
    areasAr: ['ديرة', 'بر دبي', 'الرقة', 'عود ميثاء', 'الكرامة'],
    isActive: true,
    basePrice: 0,
    estimatedTime: '45-60 min',
    coordinates: { lat: 25.2716, lng: 55.3095 },
    priority: 3,
  },
  {
    id: 'dubai-south',
    name: 'Dubai South & Al Quoz',
    nameAr: 'دبي الجنوب والقوز',
    emirate: 'Dubai',
    emirateAr: 'دبي',
    areas: ['Al Quoz', 'Motor City', 'Sports City', 'Dubai South', 'DIP'],
    areasAr: ['القوز', 'موتور سيتي', 'المدينة الرياضية', 'دبي الجنوب', 'مجمع دبي للاستثمار'],
    isActive: true,
    basePrice: 10, // Slight surcharge for distance
    estimatedTime: '60-90 min',
    coordinates: { lat: 25.0277, lng: 55.1722 },
    priority: 4,
  },
  {
    id: 'sharjah',
    name: 'Sharjah',
    nameAr: 'الشارقة',
    emirate: 'Sharjah',
    emirateAr: 'الشارقة',
    areas: ['Al Nahda', 'Al Majaz', 'Al Khan', 'Al Qasimia', 'Muwaileh'],
    areasAr: ['النهدة', 'المجاز', 'الخان', 'القاسمية', 'مويلح'],
    isActive: true,
    basePrice: 20, // Distance surcharge
    estimatedTime: '60-90 min',
    coordinates: { lat: 25.3573, lng: 55.4033 },
    priority: 5,
  },
  {
    id: 'ajman',
    name: 'Ajman',
    nameAr: 'عجمان',
    emirate: 'Ajman',
    emirateAr: 'عجمان',
    areas: ['Al Rashidiya', 'Al Nuaimiya', 'Al Jurf', 'Ajman Corniche'],
    areasAr: ['الراشدية', 'النعيمية', 'الجرف', 'كورنيش عجمان'],
    isActive: true,
    basePrice: 30,
    estimatedTime: '90-120 min',
    coordinates: { lat: 25.4052, lng: 55.5136 },
    priority: 6,
  },
];

export function useServiceLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Fetch locations from Firestore (with fallback to defaults)
  useEffect(() => {
    const locationsRef = collection(db, 'serviceLocations');
    const q = query(locationsRef, orderBy('priority', 'asc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (snapshot.empty) {
          // Use defaults if no locations in Firestore
          setLocations(DEFAULT_LOCATIONS);
        } else {
          const fetchedLocations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setLocations(fetchedLocations);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching locations:', err);
        // Fall back to defaults on error
        setLocations(DEFAULT_LOCATIONS);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Get active locations only
  const activeLocations = locations.filter(loc => loc.isActive);

  // Get locations by emirate
  const getLocationsByEmirate = useCallback((emirate) => {
    return locations.filter(loc => loc.emirate === emirate && loc.isActive);
  }, [locations]);

  // Get unique emirates
  const emirates = [...new Set(locations.map(loc => loc.emirate))];

  // Find location by area name
  const findLocationByArea = useCallback((areaName) => {
    return locations.find(loc => 
      loc.areas.some(area => 
        area.toLowerCase().includes(areaName.toLowerCase())
      ) ||
      loc.areasAr.some(area => area.includes(areaName))
    );
  }, [locations]);

  // Calculate price adjustment for a location
  const getPriceAdjustment = useCallback((locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    return location?.basePrice || 0;
  }, [locations]);

  // Manager: Add new location
  const addLocation = async (locationData) => {
    try {
      const docRef = await addDoc(collection(db, 'serviceLocations'), {
        ...locationData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { success: true, id: docRef.id };
    } catch (err) {
      console.error('Error adding location:', err);
      return { success: false, error: err.message };
    }
  };

  // Manager: Update location
  const updateLocation = async (locationId, updates) => {
    try {
      const docRef = doc(db, 'serviceLocations', locationId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      return { success: true };
    } catch (err) {
      console.error('Error updating location:', err);
      return { success: false, error: err.message };
    }
  };

  // Manager: Toggle location active status
  const toggleLocationActive = async (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) return { success: false, error: 'Location not found' };

    return updateLocation(locationId, { isActive: !location.isActive });
  };

  // Manager: Delete location
  const deleteLocation = async (locationId) => {
    try {
      await deleteDoc(doc(db, 'serviceLocations', locationId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting location:', err);
      return { success: false, error: err.message };
    }
  };

  // Initialize default locations in Firestore
  const initializeDefaults = async () => {
    try {
      const batch = [];
      for (const location of DEFAULT_LOCATIONS) {
        const docRef = doc(db, 'serviceLocations', location.id);
        batch.push(updateDoc(docRef, location).catch(() => 
          addDoc(collection(db, 'serviceLocations'), location)
        ));
      }
      await Promise.all(batch);
      return { success: true };
    } catch (err) {
      console.error('Error initializing defaults:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    locations,
    activeLocations,
    loading,
    error,
    selectedLocation,
    setSelectedLocation,
    emirates,
    getLocationsByEmirate,
    findLocationByArea,
    getPriceAdjustment,
    addLocation,
    updateLocation,
    toggleLocationActive,
    deleteLocation,
    initializeDefaults,
    DEFAULT_LOCATIONS,
  };
}

export default useServiceLocations;
