import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { compressImage, validateImageFile } from '../utils/imageCompression';
import './VehiclePhotoUpload.css';

const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const VehiclePhotoUpload = ({ 
  photoUrl, 
  onPhotoChange, 
  onPhotoRemove,
  isUploading = false,
  error = null 
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [localError, setLocalError] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Detect if on mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset input value to allow selecting same file
    e.target.value = '';
    
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setLocalError(validation.error);
      return;
    }
    
    setLocalError(null);
    setIsCompressing(true);
    
    try {
      // Compress image
      const compressedBlob = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
        maxSizeMB: 1
      });
      
      // Create file from blob
      const compressedFile = new File(
        [compressedBlob], 
        file.name.replace(/\.[^/.]+$/, '.jpg'),
        { type: 'image/jpeg' }
      );
      
      onPhotoChange(compressedFile);
    } catch (err) {
      console.error('Image compression failed:', err);
      setLocalError(t('vehicles.photo.compressionError'));
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const displayError = localError || error;
  const isLoading = isUploading || isCompressing;

  return (
    <div className="vehicle-photo-upload">
      <label className="photo-label">{t('vehicles.photo.label')}</label>
      <p className="photo-hint">{t('vehicles.photo.hint')}</p>
      
      {photoUrl ? (
        <div className="photo-preview">
          <img src={photoUrl} alt={t('vehicles.photo.preview')} />
          <button 
            type="button"
            className="photo-remove-btn"
            onClick={onPhotoRemove}
            disabled={isLoading}
            title={t('vehicles.photo.remove')}
          >
            <TrashIcon />
          </button>
        </div>
      ) : (
        <div className="photo-actions">
          {isMobile && (
            <button
              type="button"
              className="photo-btn camera-btn"
              onClick={handleCameraClick}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="photo-spinner" />
              ) : (
                <CameraIcon />
              )}
              <span>{t('vehicles.photo.takePhoto')}</span>
            </button>
          )}
          
          <button
            type="button"
            className="photo-btn upload-btn"
            onClick={handleUploadClick}
            disabled={isLoading}
          >
            {isLoading && !isMobile ? (
              <span className="photo-spinner" />
            ) : (
              <UploadIcon />
            )}
            <span>{t('vehicles.photo.upload')}</span>
          </button>
        </div>
      )}
      
      {displayError && (
        <span className="photo-error">{displayError}</span>
      )}
      
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden-input"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={handleFileSelect}
        className="hidden-input"
      />
    </div>
  );
};

VehiclePhotoUpload.propTypes = {
  photoUrl: PropTypes.string,
  onPhotoChange: PropTypes.func.isRequired,
  onPhotoRemove: PropTypes.func.isRequired,
  isUploading: PropTypes.bool,
  error: PropTypes.string
};

export default VehiclePhotoUpload;
