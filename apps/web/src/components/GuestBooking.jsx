import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './GuestBooking.css';

const GuestBooking = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    serviceId: '',
    vehicleMake: '',
    vehicleModel: '',
    scheduledDate: '',
    scheduledTime: '',
    location: 'at_location', // 'at_location' or 'mobile'
    address: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [confirmationCode, setConfirmationCode] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_URL}/admin/services`);
      const data = await response.json();
      setServices(data.filter(service => service.is_active));
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const validateStep = () => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = t('auth.fillAllFields');
      if (!formData.phone.trim()) newErrors.phone = t('auth.fillAllFields');
      if (!formData.email.trim()) newErrors.email = t('auth.fillAllFields');
      else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    } else if (step === 2) {
      if (!formData.serviceId) newErrors.serviceId = 'Please select a service';
      if (!formData.vehicleMake.trim()) newErrors.vehicleMake = 'Vehicle make required';
      if (!formData.vehicleModel.trim()) newErrors.vehicleModel = 'Vehicle model required';
      if (formData.location === 'mobile' && !formData.address.trim()) {
        newErrors.address = 'Address required for mobile service';
      }
    } else if (step === 3) {
      if (!formData.scheduledDate) newErrors.scheduledDate = 'Please select a date';
      if (!formData.scheduledTime) newErrors.scheduledTime = 'Please select a time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const selectedService = services.find(s => s.id === formData.serviceId);
      const bookingData = {
        guest_name: formData.name,
        guest_phone: formData.phone,
        guest_email: formData.email,
        service_id: formData.serviceId,
        vehicle_info: `${formData.vehicleMake} ${formData.vehicleModel}`,
        scheduled_date: formData.scheduledDate,
        scheduled_time: formData.scheduledTime,
        location_type: formData.location,
        address: formData.address || null,
        notes: formData.notes || null,
        total_price: selectedService?.base_price || 0
      };

      const response = await fetch(`${API_URL}/guest-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        const result = await response.json();
        setConfirmationCode(result.confirmationCode);
        setStep(4); // Success step
      } else {
        const error = await response.json();
        alert(error.error || error.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const selectedService = services.find(s => s.id === parseInt(formData.serviceId));
  const totalPrice = selectedService?.base_price || 0;
  const additionalFee = formData.location === 'mobile' ? 50 : 0;
  const finalPrice = totalPrice + additionalFee;

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (step === 4) {
    return (
      <div className="guest-booking">
        <div className="guest-booking-container success-container">
          <div className="success-icon">✓</div>
          <h1>Booking Confirmed!</h1>
          <p className="success-message">
            Your car wash has been scheduled successfully.
          </p>

          <div className="confirmation-details">
            <div className="confirmation-code">
              <span className="code-label">Confirmation Code:</span>
              <span className="code-value">{confirmationCode}</span>
            </div>

            <div className="booking-summary">
              <h3>Booking Details</h3>
              <div className="summary-item">
                <span>Service:</span>
                <strong>{selectedService?.name}</strong>
              </div>
              <div className="summary-item">
                <span>Date:</span>
                <strong>{new Date(formData.scheduledDate).toLocaleDateString()}</strong>
              </div>
              <div className="summary-item">
                <span>Time:</span>
                <strong>{formData.scheduledTime}</strong>
              </div>
              <div className="summary-item">
                <span>Vehicle:</span>
                <strong>{formData.vehicleMake} {formData.vehicleModel}</strong>
              </div>
              <div className="summary-item">
                <span>Location:</span>
                <strong>
                  {formData.location === 'mobile' ? 'Mobile Service' : 'At Our Location'}
                </strong>
              </div>
              <div className="summary-item total">
                <span>Total:</span>
                <strong>AED {finalPrice}</strong>
              </div>
            </div>

            <div className="confirmation-note">
              <p>
                A confirmation email has been sent to <strong>{formData.email}</strong>
              </p>
              <p>
                Please save your confirmation code for reference.
              </p>
            </div>
          </div>

          <div className="success-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              Back to Home
            </button>
            <button
              className="btn btn-outline"
              onClick={() => navigate('/register')}
            >
              Create an Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-booking">
      <div className="guest-booking-container">
        <div className="booking-header">
          <h1>Book as Guest</h1>
          <p>Quick and easy car wash booking - no account needed</p>
        </div>

        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Your Info</div>
          </div>
          <div className={`progress-line ${step > 1 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Service</div>
          </div>
          <div className={`progress-line ${step > 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Schedule</div>
          </div>
        </div>

        <div className="booking-form">
          {step === 1 && (
            <div className="form-step">
              <h2>Your Information</h2>
              <p className="step-description">Let us know who you are</p>

              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+971 50 123 4567"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <h2>Service & Vehicle</h2>
              <p className="step-description">Choose your service and tell us about your vehicle</p>

              <div className="form-group">
                <label htmlFor="serviceId">Select Service *</label>
                <select
                  id="serviceId"
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={handleChange}
                  className={errors.serviceId ? 'error' : ''}
                >
                  <option value="">Choose a service...</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - AED {service.base_price} ({service.duration} min)
                    </option>
                  ))}
                </select>
                {errors.serviceId && <span className="error-message">{errors.serviceId}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="vehicleMake">Vehicle Make *</label>
                  <input
                    type="text"
                    id="vehicleMake"
                    name="vehicleMake"
                    value={formData.vehicleMake}
                    onChange={handleChange}
                    placeholder="Toyota"
                    className={errors.vehicleMake ? 'error' : ''}
                  />
                  {errors.vehicleMake && <span className="error-message">{errors.vehicleMake}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="vehicleModel">Vehicle Model *</label>
                  <input
                    type="text"
                    id="vehicleModel"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    placeholder="Camry"
                    className={errors.vehicleModel ? 'error' : ''}
                  />
                  {errors.vehicleModel && <span className="error-message">{errors.vehicleModel}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Service Location *</label>
                <div className="location-options">
                  <div
                    className={`location-card ${formData.location === 'at_location' ? 'selected' : ''}`}
                    onClick={() => handleChange({ target: { name: 'location', value: 'at_location' } })}
                  >
                    <div className="location-icon">🏢</div>
                    <div className="location-title">At Our Location</div>
                    <div className="location-desc">Visit our premium facility</div>
                    <div className="location-price">Included</div>
                  </div>
                  <div
                    className={`location-card ${formData.location === 'mobile' ? 'selected' : ''}`}
                    onClick={() => handleChange({ target: { name: 'location', value: 'mobile' } })}
                  >
                    <div className="location-icon">🚗</div>
                    <div className="location-title">Mobile Service</div>
                    <div className="location-desc">We come to you</div>
                    <div className="location-price">+AED 50</div>
                  </div>
                </div>
              </div>

              {formData.location === 'mobile' && (
                <div className="form-group">
                  <label htmlFor="address">Service Address *</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your full address"
                    rows="3"
                    className={errors.address ? 'error' : ''}
                  />
                  {errors.address && <span className="error-message">{errors.address}</span>}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="form-step">
              <h2>Schedule</h2>
              <p className="step-description">When would you like your car wash?</p>

              <div className="form-group">
                <label htmlFor="scheduledDate">Preferred Date *</label>
                <input
                  type="date"
                  id="scheduledDate"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  min={getMinDate()}
                  className={errors.scheduledDate ? 'error' : ''}
                />
                {errors.scheduledDate && <span className="error-message">{errors.scheduledDate}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="scheduledTime">Preferred Time *</label>
                <select
                  id="scheduledTime"
                  name="scheduledTime"
                  value={formData.scheduledTime}
                  onChange={handleChange}
                  className={errors.scheduledTime ? 'error' : ''}
                >
                  <option value="">Choose a time...</option>
                  <option value="08:00">8:00 AM</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                  <option value="18:00">6:00 PM</option>
                </select>
                {errors.scheduledTime && <span className="error-message">{errors.scheduledTime}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="notes">Additional Notes (Optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any special requests or instructions..."
                  rows="4"
                />
              </div>

              <div className="booking-summary-card">
                <h3>Booking Summary</h3>
                <div className="summary-row">
                  <span>Service:</span>
                  <strong>{selectedService?.name || 'Not selected'}</strong>
                </div>
                <div className="summary-row">
                  <span>Base Price:</span>
                  <span>AED {totalPrice}</span>
                </div>
                {formData.location === 'mobile' && (
                  <div className="summary-row">
                    <span>Mobile Service Fee:</span>
                    <span>AED {additionalFee}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total:</span>
                  <strong>AED {finalPrice}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            {step > 1 && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleBack}
              >
                Back
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
              >
                Continue
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm Booking'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestBooking;
