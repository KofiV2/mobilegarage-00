import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';
import logger from '../utils/logger';

/**
 * Upload vehicle image to Firebase Storage
 * @param {File} file - Image file to upload
 * @param {string} orderId - Order ID for folder naming
 * @returns {Promise<string>} Download URL
 */
export async function uploadVehicleImage(file, orderId) {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Image must be less than 5MB');
  }

  try {
    // Create unique filename with timestamp
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `orders/${orderId}/vehicle_${Date.now()}.${extension}`;
    const storageRef = ref(storage, filename);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);

    // Get download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);

    logger.info('Vehicle image uploaded successfully', {
      filename,
      size: file.size,
      type: file.type
    });

    return downloadUrl;
  } catch (error) {
    logger.error('Error uploading vehicle image', error);
    throw error;
  }
}

/**
 * Compress image before upload (optional utility)
 * @param {File} file - Original image file
 * @param {number} maxWidth - Max width in pixels
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>} Compressed image blob
 */
export async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}
