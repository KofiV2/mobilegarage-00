import React, { useEffect, useCallback, useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { PACKAGES, getPackagePrice } from '../../config/packages';

const EditBookingModal = ({
  editingBooking,
  editForm,
  setEditForm,
  updatingId,
  onClose,
  onSave
}) => {
  const { t } = useTranslation();
  
  // Generate unique IDs for form fields (for proper label association)
  const formId = useId();
  const dateId = `${formId}-date`;
  const timeId = `${formId}-time`;
  const packageId = `${formId}-package`;
  const areaId = `${formId}-area`;
  const villaId = `${formId}-villa`;
  const priceId = `${formId}-price`;
  const notesId = `${formId}-notes`;

  // Focus trap for modal accessibility
  const modalRef = useFocusTrap(!!editingBooking, {
    autoFocus: true,
    restoreFocus: true,
    initialFocusSelector: `#${CSS.escape(dateId)}`
  });

  // Get available packages for the vehicle type
  const availablePackages = useMemo(() => {
    if (!editingBooking) return [];
    const vehicleType = editingBooking.vehicleType || 'sedan';
    const vehicleSize = editingBooking.vehicleSize || null;
    
    return Object.entries(PACKAGES)
      .filter(([_, pkg]) => {
        if (!pkg.available) return false;
        const price = getPackagePrice(pkg.id, vehicleType, vehicleSize);
        return price !== null;
      })
      .map(([key, pkg]) => ({
        id: key,
        icon: pkg.icon,
        price: getPackagePrice(pkg.id, vehicleType, vehicleSize)
      }));
  }, [editingBooking]);

  // Update price when package changes
  const handlePackageChange = useCallback((newPackageId) => {
    if (!editingBooking) return;
    
    const vehicleType = editingBooking.vehicleType || 'sedan';
    const vehicleSize = editingBooking.vehicleSize || null;
    const newPrice = getPackagePrice(newPackageId, vehicleType, vehicleSize);
    
    setEditForm(prev => ({
      ...prev,
      package: newPackageId,
      price: newPrice || prev.price
    }));
  }, [editingBooking, setEditForm]);

  // Handle escape key to close
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [onClose]);

  // Add escape key listener
  useEffect(() => {
    if (!editingBooking) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingBooking, handleKeyDown]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!editingBooking) return null;

  const isLoading = updatingId === editingBooking.id;
  const bookingIdDisplay = `#${editingBooking.id.slice(-6).toUpperCase()}`;
  const currentPackage = editForm.package || editingBooking.package;

  return (
    <div 
      className="modal-overlay" 
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div 
        ref={modalRef}
        className="edit-modal" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-title`}
        aria-describedby={`${formId}-desc`}
      >
        <h3 id={`${formId}-title`}>{t('manager.editBooking') || 'Edit Booking'}</h3>
        <p id={`${formId}-desc`} className="edit-booking-id">
          <span className="sr-only">Booking ID: </span>
          {bookingIdDisplay}
        </p>

        <form 
          className="edit-form" 
          onSubmit={(e) => { e.preventDefault(); onSave(); }}
          aria-label={t('manager.editBooking') || 'Edit Booking Form'}
        >
          {/* Date & Time */}
          <div className="form-row">
            <fieldset>
              <legend>{t('manager.table.dateTime')}</legend>
              <div className="input-group">
                <div className="field-wrapper">
                  <label htmlFor={dateId} className="sr-only">
                    {t('common.date') || 'Date'}
                  </label>
                  <input
                    id={dateId}
                    type="date"
                    value={editForm.date}
                    onChange={e => setEditForm({...editForm, date: e.target.value})}
                    aria-label={t('common.date') || 'Date'}
                  />
                </div>
                <div className="field-wrapper">
                  <label htmlFor={timeId} className="sr-only">
                    {t('common.time') || 'Time'}
                  </label>
                  <input
                    id={timeId}
                    type="text"
                    value={editForm.time}
                    onChange={e => setEditForm({...editForm, time: e.target.value})}
                    placeholder="14:00"
                    aria-label={t('common.time') || 'Time'}
                  />
                </div>
              </div>
            </fieldset>
          </div>

          {/* Package Selection */}
          <div className="form-row">
            <fieldset>
              <legend>{t('manager.table.package') || 'Package'}</legend>
              <div className="package-selector" role="radiogroup" aria-label={t('manager.table.package') || 'Package'}>
                {availablePackages.map(pkg => (
                  <button
                    key={pkg.id}
                    type="button"
                    className={`package-option-btn ${currentPackage === pkg.id ? 'selected' : ''}`}
                    onClick={() => handlePackageChange(pkg.id)}
                    role="radio"
                    aria-checked={currentPackage === pkg.id}
                  >
                    <span className="pkg-icon" aria-hidden="true">{pkg.icon}</span>
                    <span className="pkg-name">{t(`packages.${pkg.id}.name`)}</span>
                    <span className="pkg-price">AED {pkg.price}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Location */}
          <div className="form-row">
            <fieldset>
              <legend>{t('manager.table.location')}</legend>
              <div className="field-wrapper">
                <label htmlFor={areaId} className="sr-only">
                  {t('wizard.area') || 'Area'}
                </label>
                <input
                  id={areaId}
                  type="text"
                  value={editForm.area}
                  onChange={e => setEditForm({...editForm, area: e.target.value})}
                  placeholder={t('wizard.areaPlaceholder') || 'Area/Neighborhood'}
                  aria-label={t('wizard.area') || 'Area'}
                />
              </div>
              <div className="field-wrapper">
                <label htmlFor={villaId} className="sr-only">
                  {t('wizard.villa') || 'Villa/House number'}
                </label>
                <input
                  id={villaId}
                  type="text"
                  value={editForm.villa}
                  onChange={e => setEditForm({...editForm, villa: e.target.value})}
                  placeholder={t('wizard.villaPlaceholder') || 'Villa/House number'}
                  aria-label={t('wizard.villa') || 'Villa/House number'}
                />
              </div>
            </fieldset>
          </div>

          {/* Price */}
          <div className="form-row">
            <label htmlFor={priceId}>
              <span>{t('manager.table.price')}</span>
            </label>
            <div className="price-input">
              <span className="currency" aria-hidden="true">AED</span>
              <input
                id={priceId}
                type="number"
                value={editForm.price}
                onChange={e => setEditForm({...editForm, price: e.target.value})}
                min="0"
                aria-label={`${t('manager.table.price')} in AED`}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-row">
            <label htmlFor={notesId}>
              <span>{t('wizard.specialInstructions') || 'Notes'}</span>
            </label>
            <textarea
              id={notesId}
              value={editForm.notes}
              onChange={e => setEditForm({...editForm, notes: e.target.value})}
              rows="3"
              placeholder={t('wizard.instructionsPlaceholder') || 'Special instructions...'}
            />
          </div>

          {/* Loading announcement for screen readers */}
          <div 
            role="status" 
            aria-live="polite" 
            aria-atomic="true"
            className="sr-only"
          >
            {isLoading ? t('common.saving') || 'Saving changes...' : ''}
          </div>

          <div className="modal-actions" role="group" aria-label="Modal actions">
            <button 
              type="button"
              className="cancel-btn" 
              onClick={onClose}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit"
              className="save-btn" 
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="sr-only">{t('common.saving') || 'Saving'}</span>
                  <span aria-hidden="true">...</span>
                </>
              ) : (
                t('common.save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBookingModal;
