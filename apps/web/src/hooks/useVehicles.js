import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

const MAX_VEHICLES = 5;

export const useVehicles = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Upload vehicle photo to Firebase Storage
  const uploadVehiclePhoto = async (vehicleId, photoFile) => {
    if (!user || !storage) {
      return { success: false, error: 'Storage not available' };
    }

    try {
      setUploadingPhoto(true);
      
      // Create unique filename
      const timestamp = Date.now();
      const extension = photoFile.name?.split('.').pop() || 'jpg';
      const filename = `${vehicleId}_${timestamp}.${extension}`;
      const photoPath = `users/${user.uid}/vehicles/${filename}`;
      
      const storageRef = ref(storage, photoPath);
      await uploadBytes(storageRef, photoFile);
      const photoUrl = await getDownloadURL(storageRef);
      
      logger.info('Vehicle photo uploaded', { uid: user.uid, vehicleId, photoPath });
      return { success: true, photoUrl, photoPath };
    } catch (err) {
      logger.error('Error uploading vehicle photo', err, { uid: user?.uid, vehicleId });
      return { success: false, error: 'Failed to upload photo' };
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Delete vehicle photo from Firebase Storage
  const deleteVehiclePhoto = async (photoPath) => {
    if (!user || !storage || !photoPath) {
      return { success: true }; // No photo to delete
    }

    try {
      const photoRef = ref(storage, photoPath);
      await deleteObject(photoRef);
      logger.info('Vehicle photo deleted', { uid: user.uid, photoPath });
      return { success: true };
    } catch (err) {
      // Ignore if file doesn't exist
      if (err.code === 'storage/object-not-found') {
        return { success: true };
      }
      logger.error('Error deleting vehicle photo', err, { uid: user?.uid, photoPath });
      return { success: false, error: 'Failed to delete photo' };
    }
  };

  // Fetch all vehicles for the current user
  const fetchVehicles = useCallback(async () => {
    if (!user) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const vehiclesRef = collection(db, 'users', user.uid, 'vehicles');
      const q = query(vehiclesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const vehicleList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setVehicles(vehicleList);
    } catch (err) {
      logger.error('Error fetching vehicles', err, { uid: user?.uid });
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch vehicles on mount and when user changes
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Add a new vehicle
  const addVehicle = async (vehicleData, photoFile = null) => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (vehicles.length >= MAX_VEHICLES) {
      return { success: false, error: `Maximum ${MAX_VEHICLES} vehicles allowed` };
    }

    try {
      const vehiclesRef = collection(db, 'users', user.uid, 'vehicles');

      // If this is the first vehicle or marked as default, handle default logic
      const isDefault = vehicleData.isDefault || vehicles.length === 0;

      // If setting as default, unset other defaults first
      if (isDefault && vehicles.length > 0) {
        const batch = writeBatch(db);
        vehicles.forEach(v => {
          if (v.isDefault) {
            const vRef = doc(db, 'users', user.uid, 'vehicles', v.id);
            batch.update(vRef, { isDefault: false });
          }
        });
        await batch.commit();
      }

      const newVehicle = {
        nickname: vehicleData.nickname.trim(),
        type: vehicleData.type,
        size: vehicleData.size || null,
        licensePlate: vehicleData.licensePlate?.trim() || '',
        isDefault: isDefault,
        photoUrl: null,
        photoPath: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(vehiclesRef, newVehicle);

      // Upload photo if provided
      if (photoFile) {
        const uploadResult = await uploadVehiclePhoto(docRef.id, photoFile);
        if (uploadResult.success) {
          newVehicle.photoUrl = uploadResult.photoUrl;
          newVehicle.photoPath = uploadResult.photoPath;
          await updateDoc(docRef, {
            photoUrl: uploadResult.photoUrl,
            photoPath: uploadResult.photoPath
          });
        }
      }

      // Update local state
      const addedVehicle = { id: docRef.id, ...newVehicle, createdAt: new Date(), updatedAt: new Date() };

      setVehicles(prev => {
        const updated = isDefault
          ? prev.map(v => ({ ...v, isDefault: false }))
          : prev;
        return [addedVehicle, ...updated];
      });

      logger.info('Vehicle added successfully', { uid: user?.uid, vehicleId: docRef.id });
      return { success: true, vehicle: addedVehicle };
    } catch (err) {
      logger.error('Error adding vehicle', err, { uid: user?.uid });
      return { success: false, error: 'Failed to add vehicle' };
    }
  };

  // Update an existing vehicle
  const updateVehicle = async (vehicleId, vehicleData, photoFile = null, removePhoto = false) => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const vehicleRef = doc(db, 'users', user.uid, 'vehicles', vehicleId);
      const existingVehicle = vehicles.find(v => v.id === vehicleId);

      // If setting as default, unset other defaults first
      if (vehicleData.isDefault) {
        const batch = writeBatch(db);
        vehicles.forEach(v => {
          if (v.isDefault && v.id !== vehicleId) {
            const vRef = doc(db, 'users', user.uid, 'vehicles', v.id);
            batch.update(vRef, { isDefault: false });
          }
        });
        await batch.commit();
      }

      const updates = {
        ...(vehicleData.nickname && { nickname: vehicleData.nickname.trim() }),
        ...(vehicleData.type && { type: vehicleData.type }),
        ...(vehicleData.size !== undefined && { size: vehicleData.size || null }),
        ...(vehicleData.licensePlate !== undefined && { licensePlate: vehicleData.licensePlate?.trim() || '' }),
        ...(vehicleData.isDefault !== undefined && { isDefault: vehicleData.isDefault }),
        updatedAt: serverTimestamp()
      };

      // Handle photo removal
      if (removePhoto && existingVehicle?.photoPath) {
        await deleteVehiclePhoto(existingVehicle.photoPath);
        updates.photoUrl = null;
        updates.photoPath = null;
      }

      // Handle new photo upload
      if (photoFile) {
        // Delete old photo first if exists
        if (existingVehicle?.photoPath) {
          await deleteVehiclePhoto(existingVehicle.photoPath);
        }
        
        const uploadResult = await uploadVehiclePhoto(vehicleId, photoFile);
        if (uploadResult.success) {
          updates.photoUrl = uploadResult.photoUrl;
          updates.photoPath = uploadResult.photoPath;
        }
      }

      await updateDoc(vehicleRef, updates);

      // Update local state
      setVehicles(prev => prev.map(v => {
        if (v.id === vehicleId) {
          return { ...v, ...updates, updatedAt: new Date() };
        }
        // If this vehicle became default, unset others
        if (vehicleData.isDefault && v.isDefault) {
          return { ...v, isDefault: false };
        }
        return v;
      }));

      logger.info('Vehicle updated successfully', { uid: user?.uid, vehicleId });
      return { success: true };
    } catch (err) {
      logger.error('Error updating vehicle', err, { uid: user?.uid, vehicleId });
      return { success: false, error: 'Failed to update vehicle' };
    }
  };

  // Delete a vehicle
  const deleteVehicle = async (vehicleId) => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const vehicleRef = doc(db, 'users', user.uid, 'vehicles', vehicleId);
      const deletedVehicle = vehicles.find(v => v.id === vehicleId);

      // Delete photo from storage if exists
      if (deletedVehicle?.photoPath) {
        await deleteVehiclePhoto(deletedVehicle.photoPath);
      }

      await deleteDoc(vehicleRef);

      // If deleted vehicle was default, make another one default
      if (deletedVehicle?.isDefault && vehicles.length > 1) {
        const nextDefault = vehicles.find(v => v.id !== vehicleId);
        if (nextDefault) {
          const nextRef = doc(db, 'users', user.uid, 'vehicles', nextDefault.id);
          await updateDoc(nextRef, { isDefault: true });
        }
      }

      // Update local state
      setVehicles(prev => {
        const filtered = prev.filter(v => v.id !== vehicleId);
        // If we removed the default and have others, mark first as default
        if (deletedVehicle?.isDefault && filtered.length > 0) {
          filtered[0] = { ...filtered[0], isDefault: true };
        }
        return filtered;
      });

      logger.info('Vehicle deleted successfully', { uid: user?.uid, vehicleId });
      return { success: true };
    } catch (err) {
      logger.error('Error deleting vehicle', err, { uid: user?.uid, vehicleId });
      return { success: false, error: 'Failed to delete vehicle' };
    }
  };

  // Set a vehicle as default
  const setDefaultVehicle = async (vehicleId) => {
    return updateVehicle(vehicleId, { isDefault: true });
  };

  // Get the default vehicle
  const getDefaultVehicle = useCallback(() => {
    return vehicles.find(v => v.isDefault) || vehicles[0] || null;
  }, [vehicles]);

  return {
    vehicles,
    loading,
    error,
    uploadingPhoto,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    setDefaultVehicle,
    getDefaultVehicle,
    refreshVehicles: fetchVehicles,
    canAddMore: vehicles.length < MAX_VEHICLES,
    maxVehicles: MAX_VEHICLES
  };
};

export default useVehicles;
