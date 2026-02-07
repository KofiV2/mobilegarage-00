/**
 * Image Compression Utility
 * Compresses images before upload to reduce storage and bandwidth usage
 */

/**
 * Compress an image file
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width in pixels (default: 800)
 * @param {number} options.maxHeight - Maximum height in pixels (default: 800)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.8)
 * @param {number} options.maxSizeMB - Maximum file size in MB (default: 1)
 * @returns {Promise<Blob>} - Compressed image blob
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    maxSizeMB = 1
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          // Create canvas and draw image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with quality compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              
              // Check if further compression is needed
              const sizeMB = blob.size / (1024 * 1024);
              if (sizeMB > maxSizeMB && quality > 0.3) {
                // Recursively compress with lower quality
                const newFile = new File([blob], file.name, { type: 'image/jpeg' });
                compressImage(newFile, { ...options, quality: quality - 0.1 })
                  .then(resolve)
                  .catch(reject);
              } else {
                resolve(blob);
              }
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Create a thumbnail from an image file
 * @param {File|Blob} file - The image file
 * @param {number} size - Thumbnail size in pixels (default: 100)
 * @returns {Promise<string>} - Base64 data URL of the thumbnail
 */
export const createThumbnail = async (file, size = 100) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate crop dimensions for square thumbnail
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for thumbnail'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file for thumbnail'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Validate image file
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @returns {Object} - { valid: boolean, error: string | null }
 */
export const validateImageFile = (file, options = {}) => {
  const {
    maxSizeMB = 10,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  } = options;
  
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic|heif)$/i)) {
    return { valid: false, error: 'Invalid file type. Please use JPG, PNG, or WebP.' };
  }
  
  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return { valid: false, error: `File too large. Maximum size is ${maxSizeMB}MB.` };
  }
  
  return { valid: true, error: null };
};

export default {
  compressImage,
  createThumbnail,
  validateImageFile
};
