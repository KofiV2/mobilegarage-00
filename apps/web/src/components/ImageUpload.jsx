import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import './ImageUpload.css';

const ImageUpload = ({ onImageSelect, currentImage, error, disabled }) => {
  const { t } = useTranslation();
  const [preview, setPreview] = useState(currentImage || null);
  const [dragActive, setDragActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef(null);

  // Detect mobile device for camera button visibility
  useEffect(() => {
    const checkMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(checkMobile);
  }, []);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onImageSelect(null, t('staff.imageUpload.invalidType'));
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      onImageSelect(null, t('staff.imageUpload.tooLarge'));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    onImageSelect(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      // Use 'environment' for back camera (default for most use cases)
      // Falls back to front camera or file picker if back camera not available
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`image-upload ${disabled ? 'disabled' : ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden-input"
        disabled={disabled}
      />

      {preview ? (
        <div className="image-preview">
          <img src={preview} alt={t('staff.imageUpload.vehiclePhoto')} />
          <div className="preview-overlay">
            <button
              type="button"
              className="remove-btn"
              onClick={handleRemove}
              disabled={disabled}
            >
              <span className="remove-icon">✕</span>
              {t('staff.imageUpload.remove')}
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="upload-icon">📷</div>
          <p className="upload-text">{t('staff.imageUpload.dragOrClick')}</p>
          <p className="upload-hint">{t('staff.imageUpload.maxSize')}</p>

          <div className="upload-buttons">
            <button
              type="button"
              className="upload-btn gallery"
              onClick={handleSelectClick}
              disabled={disabled}
            >
              <span>📁</span>
              {t('staff.imageUpload.selectFile')}
            </button>
            <button
              type="button"
              className="upload-btn camera"
              onClick={handleCameraClick}
              disabled={disabled}
            >
              <span>📸</span>
              {t('staff.imageUpload.takePhoto')}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="upload-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
};

ImageUpload.propTypes = {
  onImageSelect: PropTypes.func.isRequired,
  currentImage: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool
};

ImageUpload.defaultProps = {
  currentImage: null,
  error: null,
  disabled: false
};

export default ImageUpload;
