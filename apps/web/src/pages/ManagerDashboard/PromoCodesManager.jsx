import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';

const PromoCodesManager = ({ show, onClose }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    maxUses: 0, // 0 = unlimited
    expiresAt: '',
    applicablePackages: [],
    isActive: true
  });

  // Load promo codes
  useEffect(() => {
    if (!show) return;

    const promoRef = collection(db, 'promoCodes');
    const q = query(promoRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const codes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiresAt: doc.data().expiresAt?.toDate?.() || new Date(doc.data().expiresAt)
      }));
      setPromoCodes(codes);
      setLoading(false);
    }, (error) => {
      console.error('Error loading promo codes:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [show]);

  const resetForm = useCallback(() => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 10,
      maxUses: 0,
      expiresAt: '',
      applicablePackages: [],
      isActive: true
    });
    setEditingId(null);
    setShowAddForm(false);
  }, []);

  const handleEdit = useCallback((promo) => {
    setFormData({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxUses: promo.maxUses || 0,
      expiresAt: promo.expiresAt ? new Date(promo.expiresAt).toISOString().split('T')[0] : '',
      applicablePackages: promo.applicablePackages || [],
      isActive: promo.isActive
    });
    setEditingId(promo.id);
    setShowAddForm(true);
  }, []);

  const handleSave = async () => {
    if (!formData.code.trim()) {
      showToast(t('promoManager.codeRequired') || 'Promo code is required', 'error');
      return;
    }

    if (formData.discountValue <= 0) {
      showToast(t('promoManager.invalidDiscount') || 'Discount value must be greater than 0', 'error');
      return;
    }

    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      showToast(t('promoManager.maxPercentage') || 'Percentage cannot exceed 100%', 'error');
      return;
    }

    setSaving(true);
    try {
      const promoData = {
        code: formData.code.toUpperCase().trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        maxUses: Number(formData.maxUses) || 0,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null,
        applicablePackages: formData.applicablePackages,
        isActive: formData.isActive,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        // Update existing
        await updateDoc(doc(db, 'promoCodes', editingId), promoData);
        showToast(t('promoManager.updated') || 'Promo code updated', 'success');
      } else {
        // Create new
        promoData.createdAt = serverTimestamp();
        promoData.currentUses = 0;
        await addDoc(collection(db, 'promoCodes'), promoData);
        showToast(t('promoManager.created') || 'Promo code created', 'success');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving promo code:', error);
      showToast(t('promoManager.saveError') || 'Failed to save promo code', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (promo) => {
    const confirmed = await confirm({
      title: t('promoManager.deleteTitle') || 'Delete Promo Code',
      message: t('promoManager.deleteConfirm', { code: promo.code }) || `Are you sure you want to delete "${promo.code}"?`,
      confirmText: t('common.delete') || 'Delete',
      cancelText: t('common.cancel') || 'Cancel',
      danger: true
    });

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'promoCodes', promo.id));
      showToast(t('promoManager.deleted') || 'Promo code deleted', 'success');
    } catch (error) {
      console.error('Error deleting promo code:', error);
      showToast(t('promoManager.deleteError') || 'Failed to delete promo code', 'error');
    }
  };

  const handleToggleActive = async (promo) => {
    try {
      await updateDoc(doc(db, 'promoCodes', promo.id), {
        isActive: !promo.isActive,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error toggling promo code:', error);
      showToast(t('promoManager.toggleError') || 'Failed to update promo code', 'error');
    }
  };

  const togglePackage = (packageId) => {
    setFormData(prev => ({
      ...prev,
      applicablePackages: prev.applicablePackages.includes(packageId)
        ? prev.applicablePackages.filter(p => p !== packageId)
        : [...prev.applicablePackages, packageId]
    }));
  };

  if (!show) return null;

  const isExpired = (promo) => promo.expiresAt && new Date(promo.expiresAt) < new Date();
  const isMaxedOut = (promo) => promo.maxUses > 0 && promo.currentUses >= promo.maxUses;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="promo-manager-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <h3>🎟️ {t('promoManager.title') || 'Promo Codes'}</h3>
        <p className="promo-manager-subtitle">
          {t('promoManager.subtitle') || 'Create and manage discount codes'}
        </p>

        {/* Add/Edit Form */}
        {showAddForm ? (
          <div className="promo-form">
            <div className="promo-form-row">
              <label>
                <span>{t('promoManager.code') || 'Code'}</span>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="SUMMER20"
                  disabled={saving}
                  className="promo-code-input"
                />
              </label>
            </div>

            <div className="promo-form-row two-col">
              <label>
                <span>{t('promoManager.discountType') || 'Type'}</span>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                  disabled={saving}
                >
                  <option value="percentage">{t('promoManager.percentage') || 'Percentage (%)'}</option>
                  <option value="fixed">{t('promoManager.fixed') || 'Fixed Amount (AED)'}</option>
                </select>
              </label>

              <label>
                <span>{t('promoManager.value') || 'Value'}</span>
                <div className="value-input-wrapper">
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                    min="0"
                    max={formData.discountType === 'percentage' ? 100 : 999}
                    disabled={saving}
                  />
                  <span className="value-suffix">
                    {formData.discountType === 'percentage' ? '%' : 'AED'}
                  </span>
                </div>
              </label>
            </div>

            <div className="promo-form-row two-col">
              <label>
                <span>{t('promoManager.maxUses') || 'Max Uses'}</span>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                  min="0"
                  placeholder="0 = unlimited"
                  disabled={saving}
                />
                <span className="field-hint">{t('promoManager.maxUsesHint') || '0 = unlimited'}</span>
              </label>

              <label>
                <span>{t('promoManager.expiresAt') || 'Expires'}</span>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  disabled={saving}
                />
              </label>
            </div>

            <div className="promo-form-row">
              <span className="field-label">{t('promoManager.applicableTo') || 'Applicable to'}</span>
              <div className="package-checkboxes">
                {['platinum', 'titanium', 'diamond'].map(pkg => (
                  <label key={pkg} className="package-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.applicablePackages.length === 0 || formData.applicablePackages.includes(pkg)}
                      onChange={() => togglePackage(pkg)}
                      disabled={saving}
                    />
                    <span>{t(`packages.${pkg}.name`)}</span>
                  </label>
                ))}
              </div>
              <span className="field-hint">{t('promoManager.allPackagesHint') || 'Leave all unchecked for all packages'}</span>
            </div>

            <div className="promo-form-row">
              <label className="active-toggle">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  disabled={saving}
                />
                <span>{t('promoManager.active') || 'Active'}</span>
              </label>
            </div>

            <div className="promo-form-actions">
              <button className="cancel-btn" onClick={resetForm} disabled={saving}>
                {t('common.cancel') || 'Cancel'}
              </button>
              <button className="save-btn" onClick={handleSave} disabled={saving}>
                {saving ? '...' : (editingId ? t('common.save') : t('promoManager.create')) || 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <button className="add-promo-btn" onClick={() => setShowAddForm(true)}>
            ➕ {t('promoManager.addNew') || 'Add New Promo Code'}
          </button>
        )}

        {/* Promo Codes List */}
        <div className="promo-codes-list">
          {loading ? (
            <div className="promo-loading">{t('common.loading') || 'Loading...'}</div>
          ) : promoCodes.length === 0 ? (
            <div className="promo-empty">
              <span className="empty-icon">🎟️</span>
              <p>{t('promoManager.noPromoCodes') || 'No promo codes yet'}</p>
            </div>
          ) : (
            promoCodes.map(promo => (
              <div 
                key={promo.id} 
                className={`promo-card ${!promo.isActive ? 'inactive' : ''} ${isExpired(promo) ? 'expired' : ''} ${isMaxedOut(promo) ? 'maxed' : ''}`}
              >
                <div className="promo-card-header">
                  <span className="promo-card-code">{promo.code}</span>
                  <div className="promo-card-badges">
                    {!promo.isActive && <span className="badge inactive">{t('promoManager.inactive') || 'Inactive'}</span>}
                    {isExpired(promo) && <span className="badge expired">{t('promoManager.expired') || 'Expired'}</span>}
                    {isMaxedOut(promo) && <span className="badge maxed">{t('promoManager.maxedOut') || 'Max Used'}</span>}
                  </div>
                </div>

                <div className="promo-card-details">
                  <span className="promo-discount">
                    {promo.discountType === 'percentage' 
                      ? `${promo.discountValue}% off`
                      : `AED ${promo.discountValue} off`
                    }
                  </span>
                  <span className="promo-uses">
                    {promo.currentUses || 0} / {promo.maxUses || '∞'} {t('promoManager.uses') || 'uses'}
                  </span>
                  {promo.expiresAt && (
                    <span className="promo-expiry">
                      {t('promoManager.expires') || 'Expires'}: {new Date(promo.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="promo-card-actions">
                  <button 
                    className="toggle-btn"
                    onClick={() => handleToggleActive(promo)}
                    title={promo.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {promo.isActive ? '⏸️' : '▶️'}
                  </button>
                  <button 
                    className="edit-btn"
                    onClick={() => handleEdit(promo)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(promo)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PromoCodesManager;
