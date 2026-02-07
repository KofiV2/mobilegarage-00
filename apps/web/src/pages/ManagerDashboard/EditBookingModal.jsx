import React from 'react';
import { useTranslation } from 'react-i18next';

const EditBookingModal = ({
  editingBooking,
  editForm,
  setEditForm,
  updatingId,
  onClose,
  onSave
}) => {
  const { t } = useTranslation();

  if (!editingBooking) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={e => e.stopPropagation()}>
        <h3>{t('manager.editBooking') || 'Edit Booking'}</h3>
        <p className="edit-booking-id">#{editingBooking.id.slice(-6).toUpperCase()}</p>

        <div className="edit-form">
          <div className="form-row">
            <label>
              <span>{t('manager.table.dateTime')}</span>
              <div className="input-group">
                <input
                  type="date"
                  value={editForm.date}
                  onChange={e => setEditForm({...editForm, date: e.target.value})}
                />
                <input
                  type="text"
                  value={editForm.time}
                  onChange={e => setEditForm({...editForm, time: e.target.value})}
                  placeholder="14:00"
                />
              </div>
            </label>
          </div>

          <div className="form-row">
            <label>
              <span>{t('manager.table.location')}</span>
              <input
                type="text"
                value={editForm.area}
                onChange={e => setEditForm({...editForm, area: e.target.value})}
                placeholder={t('wizard.areaPlaceholder') || 'Area/Neighborhood'}
              />
              <input
                type="text"
                value={editForm.villa}
                onChange={e => setEditForm({...editForm, villa: e.target.value})}
                placeholder={t('wizard.villaPlaceholder') || 'Villa/House number'}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              <span>{t('manager.table.price')}</span>
              <div className="price-input">
                <span className="currency">AED</span>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={e => setEditForm({...editForm, price: e.target.value})}
                  min="0"
                />
              </div>
            </label>
          </div>

          <div className="form-row">
            <label>
              <span>{t('wizard.specialInstructions') || 'Notes'}</span>
              <textarea
                value={editForm.notes}
                onChange={e => setEditForm({...editForm, notes: e.target.value})}
                rows="3"
                placeholder={t('wizard.instructionsPlaceholder') || 'Special instructions...'}
              />
            </label>
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="save-btn" onClick={onSave} disabled={updatingId === editingBooking.id}>
            {updatingId === editingBooking.id ? '...' : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBookingModal;
