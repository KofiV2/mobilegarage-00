import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CardSkeleton } from '../../components/SkeletonLoader';
import Skeleton from 'react-loading-skeleton';
import Pagination from '../../components/Pagination';
import { getApiUrl } from '../../services/api';
import './ServicesManagement.css';

const ServicesManagement = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Basic',
    basePrice: '',
    durationMinutes: '',
    isActive: true,
    features: []
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchServices();
  }, [user, navigate, currentPage, pageSize]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize
      });

      const response = await fetch(getApiUrl(`/admin/services?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();
      const formattedServices = data.services.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        basePrice: parseFloat(s.base_price) || 0,
        durationMinutes: s.duration || 0,
        isActive: s.is_active,
        totalBookings: s.stats?.totalBookings || 0,
        revenue: s.stats?.totalRevenue || 0,
        features: s.features || []
      }));
      setServices(formattedServices);
      setTotalItems(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching services:', error);
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleAddNew = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      category: 'Basic',
      basePrice: '',
      durationMinutes: '',
      isActive: true,
      features: []
    });
    setShowModal(true);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      basePrice: service.basePrice,
      durationMinutes: service.durationMinutes,
      isActive: service.isActive,
      features: service.features
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingService
        ? getApiUrl(`/admin/services/${editingService.id}`)
        : getApiUrl('/admin/services');

      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          basePrice: parseFloat(formData.basePrice),
          duration: parseInt(formData.durationMinutes),
          category: formData.category.toLowerCase(),
          features: formData.features
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save service');
      }

      // Refresh services list
      fetchServices();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service');
    }
  };

  const handleToggleStatus = async (serviceId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/admin/services/${serviceId}/toggle-status`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle service status');
      }

      // Refresh services list
      fetchServices();
    } catch (error) {
      console.error('Error toggling service status:', error);
      alert('Failed to update service status');
    }
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm(t('admin.services.deleteConfirm'))) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(getApiUrl(`/admin/services/${serviceId}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete service');
        }

        // Refresh services list
        fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        alert(error.message);
      }
    }
  };

  const stats = {
    total: services.length,
    active: services.filter(s => s.isActive).length,
    inactive: services.filter(s => !s.isActive).length,
    totalRevenue: services.reduce((sum, s) => sum + s.revenue, 0),
    totalBookings: services.reduce((sum, s) => sum + s.totalBookings, 0)
  };

  if (loading) {
    return (
      <div className="services-management">
        <div className="page-header">
          <div>
            <h1>🚗 {t('admin.services.title')}</h1>
            <p>{t('admin.services.description')}</p>
          </div>
          <div className="header-actions">
            <button className="btn-add" disabled>
              + {t('admin.services.addNew')}
            </button>
            <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
              ← {t('admin.services.backToDashboard')}
            </button>
          </div>
        </div>

        <div className="services-stats">
          <div className="stat-card-mini">
            <div className="stat-icon"><Skeleton circle width={40} height={40} /></div>
            <div>
              <div className="stat-label"><Skeleton width={100} /></div>
              <div className="stat-value"><Skeleton width={40} /></div>
            </div>
          </div>
          <div className="stat-card-mini">
            <div className="stat-icon"><Skeleton circle width={40} height={40} /></div>
            <div>
              <div className="stat-label"><Skeleton width={100} /></div>
              <div className="stat-value"><Skeleton width={40} /></div>
            </div>
          </div>
          <div className="stat-card-mini">
            <div className="stat-icon"><Skeleton circle width={40} height={40} /></div>
            <div>
              <div className="stat-label"><Skeleton width={100} /></div>
              <div className="stat-value"><Skeleton width={40} /></div>
            </div>
          </div>
          <div className="stat-card-mini">
            <div className="stat-icon"><Skeleton circle width={40} height={40} /></div>
            <div>
              <div className="stat-label"><Skeleton width={100} /></div>
              <div className="stat-value"><Skeleton width={40} /></div>
            </div>
          </div>
          <div className="stat-card-mini">
            <div className="stat-icon"><Skeleton circle width={40} height={40} /></div>
            <div>
              <div className="stat-label"><Skeleton width={120} /></div>
              <div className="stat-value"><Skeleton width={80} /></div>
            </div>
          </div>
        </div>

        <CardSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="services-management">
      <div className="page-header">
        <div>
          <h1>🚗 {t('admin.services.title')}</h1>
          <p>{t('admin.services.description')}</p>
        </div>
        <div className="header-actions">
          <button className="btn-add" onClick={handleAddNew}>
            + {t('admin.services.addNew')}
          </button>
          <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
            ← {t('admin.services.backToDashboard')}
          </button>
        </div>
      </div>

      <div className="services-stats">
        <div className="stat-card-mini stat-primary">
          <div className="stat-icon">📋</div>
          <div>
            <div className="stat-label">{t('admin.services.totalServices')}</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card-mini stat-success">
          <div className="stat-icon">✅</div>
          <div>
            <div className="stat-label">{t('admin.services.active')}</div>
            <div className="stat-value">{stats.active}</div>
          </div>
        </div>
        <div className="stat-card-mini stat-warning">
          <div className="stat-icon">⏸️</div>
          <div>
            <div className="stat-label">{t('admin.services.inactive')}</div>
            <div className="stat-value">{stats.inactive}</div>
          </div>
        </div>
        <div className="stat-card-mini stat-info">
          <div className="stat-icon">📅</div>
          <div>
            <div className="stat-label">{t('admin.services.totalBookings')}</div>
            <div className="stat-value">{stats.totalBookings}</div>
          </div>
        </div>
        <div className="stat-card-mini stat-revenue">
          <div className="stat-icon">💰</div>
          <div>
            <div className="stat-label">{t('admin.services.totalRevenue')}</div>
            <div className="stat-value">AED {stats.totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="services-grid">
        {services.map(service => (
          <div key={service.id} className={`service-card ${!service.isActive ? 'inactive' : ''}`}>
            <div className="service-header">
              <div>
                <h3>{service.name}</h3>
                <span className={`category-badge category-${service.category.toLowerCase()}`}>
                  {service.category}
                </span>
              </div>
              <div className="service-status">
                {service.isActive ? (
                  <span className="status-active">● {t('admin.services.activeStatus')}</span>
                ) : (
                  <span className="status-inactive">● {t('admin.services.inactiveStatus')}</span>
                )}
              </div>
            </div>

            <p className="service-description">{service.description}</p>

            <div className="service-details">
              <div className="detail-row">
                <span className="detail-label">{t('admin.services.price')}:</span>
                <span className="detail-value price">AED {service.basePrice}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('admin.services.duration')}:</span>
                <span className="detail-value">{service.durationMinutes} {t('admin.services.min')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('admin.services.bookings')}:</span>
                <span className="detail-value">{service.totalBookings}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('admin.services.revenue')}:</span>
                <span className="detail-value revenue">AED {service.revenue.toLocaleString()}</span>
              </div>
            </div>

            <div className="service-features">
              <strong>{t('admin.services.features')}:</strong>
              <ul>
                {service.features.map((feature, index) => (
                  <li key={index}>✓ {feature}</li>
                ))}
              </ul>
            </div>

            <div className="service-actions">
              <button className="btn-edit" onClick={() => handleEdit(service)}>
                ✏️ {t('admin.services.edit')}
              </button>
              <button
                className={`btn-toggle ${service.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                onClick={() => handleToggleStatus(service.id)}
              >
                {service.isActive ? `⏸️ ${t('admin.services.deactivate')}` : `▶️ ${t('admin.services.activate')}`}
              </button>
              <button className="btn-delete" onClick={() => handleDelete(service.id)}>
                🗑️ {t('admin.services.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content service-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingService ? t('admin.services.editService') : t('admin.services.addNewService')}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('admin.services.serviceName')} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('admin.services.serviceNamePlaceholder')}
                  />
                </div>

                <div className="form-group">
                  <label>{t('admin.services.category')} *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Basic">{t('admin.services.categoryBasic')}</option>
                    <option value="Premium">{t('admin.services.categoryPremium')}</option>
                    <option value="Deluxe">{t('admin.services.categoryDeluxe')}</option>
                    <option value="Express">{t('admin.services.categoryExpress')}</option>
                    <option value="Specialty">{t('admin.services.categorySpecialty')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('admin.services.basePrice')} *</label>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>{t('admin.services.durationMinutes')} *</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                    placeholder="0"
                  />
                </div>

                <div className="form-group full-width">
                  <label>{t('admin.services.description')} *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    placeholder={t('admin.services.descriptionPlaceholder')}
                  />
                </div>

                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>{t('admin.services.activeLabel')}</span>
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-save" onClick={handleSave}>
                  {editingService ? `💾 ${t('admin.services.updateService')}` : `✅ ${t('admin.services.createService')}`}
                </button>
                <button className="btn-cancel" onClick={() => setShowModal(false)}>
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;
