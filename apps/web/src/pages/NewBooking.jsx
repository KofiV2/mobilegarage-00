import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '../config/stripe';
import PaymentForm from '../components/PaymentForm';
import api from '../services/api';
import './NewBooking.css';

const NewBooking = () => {
  const { serviceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Step management - Only 2 steps now
  const [currentStep, setCurrentStep] = useState(1);

  // Service data
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simplified booking data
  const [numberOfVehicles, setNumberOfVehicles] = useState(1);
  const [bookingDate, setBookingDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');

  // GPS location
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  // Payment data
  const [paymentMethod, setPaymentMethod] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState('');

  // Success state
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingReference, setBookingReference] = useState('');

  // Time slot availability
  const [slotAvailability, setSlotAvailability] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Available time slots with capacity
  const allTimeSlots = [
    { time: '08:00 AM', maxCapacity: 3 },
    { time: '09:00 AM', maxCapacity: 3 },
    { time: '10:00 AM', maxCapacity: 3 },
    { time: '11:00 AM', maxCapacity: 3 },
    { time: '12:00 PM', maxCapacity: 3 },
    { time: '01:00 PM', maxCapacity: 3 },
    { time: '02:00 PM', maxCapacity: 3 },
    { time: '03:00 PM', maxCapacity: 3 },
    { time: '04:00 PM', maxCapacity: 3 },
    { time: '05:00 PM', maxCapacity: 3 },
    { time: '06:00 PM', maxCapacity: 2 },
    { time: '07:00 PM', maxCapacity: 2 }
  ];

  useEffect(() => {
    fetchService();
  }, [serviceId]);

  useEffect(() => {
    if (bookingDate) {
      checkSlotAvailability(bookingDate);
    }
  }, [bookingDate]);

  const checkSlotAvailability = async (date) => {
    setLoadingSlots(true);
    try {
      // API endpoint for slot availability is not yet implemented
      // For now, show all slots as available
      const defaultAvailability = {};
      allTimeSlots.forEach(slot => {
        defaultAvailability[slot.time] = {
          booked: 0,
          available: slot.maxCapacity,
          maxCapacity: slot.maxCapacity
        };
      });
      setSlotAvailability(defaultAvailability);
    } catch (error) {
      console.error('Error fetching slot availability:', error);
      // Fallback: show all slots as available
      const defaultAvailability = {};
      allTimeSlots.forEach(slot => {
        defaultAvailability[slot.time] = {
          booked: 0,
          available: slot.maxCapacity,
          maxCapacity: slot.maxCapacity
        };
      });
      setSlotAvailability(defaultAvailability);
    } finally {
      setLoadingSlots(false);
    }
  };

  const getCurrentLocation = () => {
    setUseCurrentLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setSelectedLocation(location);
          // Reverse geocode to get address
          reverseGeocode(location);
        },
        (error) => {
          toast.error('Unable to get your location');
          console.error('Geolocation error:', error);
          setUseCurrentLocation(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setUseCurrentLocation(false);
    }
  };

  const reverseGeocode = async (location) => {
    try {
      // Using OpenStreetMap's Nominatim API (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`
      );
      const data = await response.json();
      if (data.display_name) {
        setCustomerAddress(data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const getSlotStatus = (time) => {
    const availability = slotAvailability[time];
    if (!availability) return 'available';

    if (availability.available === 0) return 'full';
    if (availability.available <= 1) return 'limited';
    return 'available';
  };

  const getSlotLabel = (time) => {
    const availability = slotAvailability[time];
    if (!availability) return '';

    if (availability.available === 0) return 'Fully Booked';
    if (availability.available === 1) return '1 slot left';
    return `${availability.available} slots left`;
  };

  const fetchService = async () => {
    try {
      const serviceResponse = await api.get(`/services/${serviceId}`);
      setService(serviceResponse.data.service);
    } catch (error) {
      console.error('Error fetching service:', error);
      // Use mock data if API fails
      setService({
        _id: serviceId,
        id: serviceId,
        name: 'Premium Wash (In-Place)',
        description: 'Complete interior and exterior detailing.',
        basePrice: 150,
        duration: 50,
        category: 'in-place',
        type: 'washing'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    // Validation for step 1
    if (currentStep === 1) {
      if (!bookingDate) {
        toast.error('Please select a date');
        return;
      }
      if (!selectedTime) {
        toast.error('Please select a time slot');
        return;
      }
      if (!customerPhone) {
        toast.error('Please enter your phone number');
        return;
      }

      // Only require address for home service
      if (service.category === 'home' && !customerAddress) {
        toast.error('Please enter your address for home service');
        return;
      }
    }

    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitBooking = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      const totalPrice = service.basePrice * numberOfVehicles;

      const bookingData = {
        serviceId: service._id || service.id,
        numberOfVehicles: numberOfVehicles,
        scheduledDate: bookingDate,
        scheduledTime: selectedTime,
        customerPhone: customerPhone,
        customerAddress: service.category === 'home' ? customerAddress : null,
        notes: notes,
        paymentMethod: paymentMethod,
        totalPrice: totalPrice,
        status: 'pending'
      };

      const response = await api.post('/bookings', bookingData);
      const booking = response.data.booking || response.data;

      // If card payment, create payment intent
      if (paymentMethod === 'card') {
        setProcessingPayment(true);
        setCreatedBookingId(booking.id);

        const paymentIntentResponse = await api.post('/payments-stripe/create-payment-intent', {
          bookingId: booking.id,
          amount: totalPrice,
          currency: 'aed',
          saveCard: saveCard
        });

        setClientSecret(paymentIntentResponse.data.clientSecret);
        setPaymentIntentId(paymentIntentResponse.data.paymentIntentId);
        setProcessingPayment(false);
      } else {
        // For cash or online payment, proceed directly to success
        setBookingReference(booking.booking_number || `BK${Date.now().toString().slice(-8)}`);
        setBookingSuccess(true);
        toast.success('Booking confirmed successfully!');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
      setProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Confirm payment on backend
      const confirmResponse = await api.post('/payments-stripe/confirm-payment', {
        paymentIntentId: paymentIntent.id,
        bookingId: createdBookingId
      });

      setBookingReference(confirmResponse.data.bookingNumber);
      setBookingSuccess(true);
      toast.success('Payment successful! Booking confirmed.');
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Payment succeeded but confirmation failed. Please contact support.');
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    toast.error(error.message || 'Payment failed. Please try again.');
  };

  const calculateTotal = () => {
    return service.basePrice * numberOfVehicles;
  };

  if (loading) {
    return (
      <div className="new-booking-page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="new-booking-page">
        <div className="booking-success">
          <div className="success-icon">✅</div>
          <h2>Booking Confirmed!</h2>
          <p>Your car wash service has been successfully booked.</p>

          <div className="booking-reference">
            <p>Your Booking Reference:</p>
            <strong>{bookingReference}</strong>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3>Booking Details:</h3>
            <div style={{ textAlign: 'left', margin: '1.5rem auto', maxWidth: '400px' }}>
              <p><strong>Service:</strong> {service.name}</p>
              <p><strong>Number of Vehicles:</strong> {numberOfVehicles}</p>
              <p><strong>Date:</strong> {new Date(bookingDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {selectedTime}</p>
              <p><strong>Total Amount:</strong> AED {calculateTotal()}</p>
              <p><strong>Payment:</strong> {paymentMethod === 'card' ? 'Credit/Debit Card' :
                                           paymentMethod === 'cash' ? 'Cash on Service' : 'Online Payment'}</p>
            </div>

            <div style={{ background: '#fff3cd', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', border: '1px solid #ffc107' }}>
              <p style={{ margin: 0, color: '#856404', fontSize: '0.875rem' }}>
                <strong>Note:</strong> Our staff will collect vehicle details (plate numbers, etc.) when you arrive for service.
              </p>
            </div>
          </div>

          <div className="booking-actions" style={{ justifyContent: 'center', marginTop: '2rem' }}>
            <button className="btn-next" onClick={() => navigate('/bookings')}>
              View My Bookings
            </button>
            <button className="btn-back" onClick={() => navigate('/services')}>
              Book Another Service
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="new-booking-page">
      <div className="booking-header">
        <h1>Quick Booking</h1>
        <p>Book your service in 2 simple steps</p>
      </div>

      {/* Progress Steps */}
      <div className="booking-progress">
        <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-circle">{currentStep > 1 ? '✓' : '1'}</div>
          <div className="step-label">Booking Info</div>
        </div>
        <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
          <div className="step-circle">2</div>
          <div className="step-label">Payment</div>
        </div>
      </div>

      <div className="booking-form">
        {/* Step 1: Basic Booking Info */}
        {currentStep === 1 && (
          <>
            <div className="service-summary">
              <h4>Selected Service</h4>
              <div className="summary-item">
                <span>Service:</span>
                <span>{service.name}</span>
              </div>
              <div className="summary-item">
                <span>Duration:</span>
                <span>{service.duration} min per vehicle</span>
              </div>
              <div className="summary-item">
                <span>Location:</span>
                <span>{service.category === 'home' ? 'At Your Location' : 'At Our Location'}</span>
              </div>
              <div className="summary-item">
                <span>Price per Vehicle:</span>
                <span>AED {service.basePrice}</span>
              </div>
            </div>

            <div className="form-section">
              <h3>Number of Vehicles</h3>
              <div className="vehicle-counter">
                <button
                  className="counter-btn"
                  onClick={() => setNumberOfVehicles(Math.max(1, numberOfVehicles - 1))}
                >
                  −
                </button>
                <div className="counter-display">
                  <span className="counter-value">{numberOfVehicles}</span>
                  <span className="counter-label">Vehicle{numberOfVehicles > 1 ? 's' : ''}</span>
                </div>
                <button
                  className="counter-btn"
                  onClick={() => setNumberOfVehicles(Math.min(10, numberOfVehicles + 1))}
                >
                  +
                </button>
              </div>
              <p style={{ textAlign: 'center', color: '#718096', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Staff will collect vehicle details when you arrive
              </p>
            </div>

            <div className="form-section">
              <h3>Schedule</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Date <span className="required">*</span></label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ fontWeight: 600, color: '#4a5568', marginBottom: '1rem', display: 'block' }}>
                  Select Time Slot <span className="required">*</span>
                </label>
                {loadingSlots ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                    Loading availability...
                  </div>
                ) : (
                  <div className="time-slots">
                    {allTimeSlots.map(({ time }) => {
                      const status = getSlotStatus(time);
                      const label = getSlotLabel(time);
                      const isDisabled = status === 'full';

                      return (
                        <div
                          key={time}
                          className={`time-slot ${selectedTime === time ? 'selected' : ''} ${status === 'full' ? 'disabled' : ''} slot-${status}`}
                          onClick={() => !isDisabled && setSelectedTime(time)}
                          style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                        >
                          <div className="slot-time">{time}</div>
                          {label && (
                            <div className="slot-availability">{label}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h3>Contact Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Phone Number <span className="required">*</span></label>
                  <input
                    type="tel"
                    placeholder="+971 50 123 4567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>

                {service.category === 'home' && (
                  <div className="form-group full-width">
                    <label>Service Address <span className="required">*</span></label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <button
                        type="button"
                        className="location-btn"
                        onClick={getCurrentLocation}
                        disabled={useCurrentLocation}
                      >
                        📍 {useCurrentLocation ? 'Getting location...' : 'Use My Location'}
                      </button>
                      {selectedLocation && (
                        <button
                          type="button"
                          className="location-btn secondary"
                          onClick={() => setShowLocationPicker(true)}
                        >
                          🗺️ View on Map
                        </button>
                      )}
                    </div>
                    <textarea
                      placeholder="Enter your full address for home service..."
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      rows="3"
                    />
                    {selectedLocation && (
                      <div style={{ fontSize: '0.75rem', color: '#48bb78', marginTop: '0.5rem' }}>
                        ✓ GPS Location saved (Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)})
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h3>Additional Notes (Optional)</h3>
              <div className="form-group full-width">
                <textarea
                  placeholder="Any special requests or instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                />
              </div>
            </div>

            <div className="total-summary">
              <div className="total-row">
                <span>Total Amount:</span>
                <span className="total-amount">AED {calculateTotal()}</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#718096', margin: '0.5rem 0 0 0' }}>
                {numberOfVehicles} vehicle{numberOfVehicles > 1 ? 's' : ''} × AED {service.basePrice}
              </p>
            </div>
          </>
        )}

        {/* Step 2: Payment Method Only */}
        {currentStep === 2 && (
          <>
            {!clientSecret ? (
              <div className="form-section">
                <h3>Select Payment Method</h3>
                <div className="payment-methods">
                  <div
                    className={`payment-method ${paymentMethod === 'cash' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <div className="payment-icon">💵</div>
                    <div className="payment-info">
                      <h4>Cash on Service</h4>
                      <p>Pay when the service is completed</p>
                    </div>
                  </div>

                  <div
                    className={`payment-method ${paymentMethod === 'card' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className="payment-icon">💳</div>
                    <div className="payment-info">
                      <h4>Card Payment</h4>
                      <p>Pay securely with Stripe</p>
                    </div>
                  </div>

                  <div
                    className={`payment-method ${paymentMethod === 'online' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('online')}
                  >
                    <div className="payment-icon">🌐</div>
                    <div className="payment-info">
                      <h4>Online Payment</h4>
                      <p>Bank transfer or online gateway</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-section">
                <h3>Complete Payment</h3>
                <Elements stripe={getStripe()}>
                  <PaymentForm
                    clientSecret={clientSecret}
                    amount={calculateTotal()}
                    currency="AED"
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    saveCard={saveCard}
                    onSaveCardChange={setSaveCard}
                  />
                </Elements>
              </div>
            )}

            <div className="form-section">
              <h3>Booking Summary</h3>
              <div style={{ background: '#f7fafc', padding: '1.5rem', borderRadius: '12px' }}>
                <div className="summary-row">
                  <span>Service:</span>
                  <span><strong>{service.name}</strong></span>
                </div>
                <div className="summary-row">
                  <span>Number of Vehicles:</span>
                  <span><strong>{numberOfVehicles}</strong></span>
                </div>
                <div className="summary-row">
                  <span>Date:</span>
                  <span><strong>{new Date(bookingDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong></span>
                </div>
                <div className="summary-row">
                  <span>Time:</span>
                  <span><strong>{selectedTime}</strong></span>
                </div>
                <div className="summary-row">
                  <span>Phone:</span>
                  <span><strong>{customerPhone}</strong></span>
                </div>
                {service.category === 'home' && customerAddress && (
                  <div className="summary-row">
                    <span>Address:</span>
                    <span><strong>{customerAddress}</strong></span>
                  </div>
                )}
                <div className="summary-row" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0', fontSize: '1.125rem' }}>
                  <span><strong>Total Amount:</strong></span>
                  <span><strong style={{ color: '#4299e1' }}>AED {calculateTotal()}</strong></span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Navigation Buttons */}
        {!clientSecret && (
          <div className="booking-actions">
            {currentStep > 1 && (
              <button className="btn-back" onClick={handlePreviousStep}>
                ← Back
              </button>
            )}

            {currentStep < 2 ? (
              <button className="btn-next" onClick={handleNextStep}>
                Continue to Payment →
              </button>
            ) : (
              <button
                className="btn-submit"
                onClick={handleSubmitBooking}
                disabled={processingPayment}
              >
                {processingPayment ? 'Processing...' : '✓ Confirm Booking'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewBooking;
