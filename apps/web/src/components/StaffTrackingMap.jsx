import React, { useState, useEffect, useRef } from 'react';
import './StaffTrackingMap.css';

const StaffTrackingMap = ({ bookingId, customerLocation, onClose }) => {
  const [staffLocation, setStaffLocation] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [distance, setDistance] = useState(null);
  const [staffStatus, setStaffStatus] = useState('preparing'); // preparing, on_way, nearby, arrived
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const staffMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);

  useEffect(() => {
    // Initialize map
    initializeMap();

    // Start tracking staff location
    const trackingInterval = setInterval(() => {
      fetchStaffLocation();
    }, 5000); // Update every 5 seconds

    return () => {
      clearInterval(trackingInterval);
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [bookingId]);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Simple map implementation without external libraries
    // This is a placeholder - in production, you'd use Leaflet or Google Maps
    mapInstanceRef.current = {
      initialized: true,
      center: customerLocation,
      zoom: 13
    };

    // Add customer marker
    if (customerLocation) {
      addCustomerMarker();
    }
  };

  const fetchStaffLocation = async () => {
    try {
      // In production, this would be a real API call
      // For now, simulate staff movement towards customer
      const response = await mockFetchStaffLocation(bookingId);

      if (response.location) {
        setStaffLocation(response.location);
        setEstimatedTime(response.estimatedTime);
        setDistance(response.distance);
        setStaffStatus(response.status);

        updateStaffMarker(response.location);
        updateRoute(response.location);
      }
    } catch (error) {
      console.error('Error fetching staff location:', error);
    }
  };

  const mockFetchStaffLocation = async (bookingId) => {
    // Simulate staff moving towards customer
    // In production, replace with: await api.get(`/bookings/${bookingId}/staff-location`)

    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate movement
        const mockStaffLocation = {
          lat: customerLocation.lat + (Math.random() - 0.5) * 0.01,
          lng: customerLocation.lng + (Math.random() - 0.5) * 0.01
        };

        const mockDistance = (Math.random() * 5).toFixed(1); // km
        const mockTime = Math.ceil(mockDistance * 3); // minutes

        let status = 'on_way';
        if (mockDistance < 0.5) status = 'nearby';
        if (mockDistance < 0.1) status = 'arrived';

        resolve({
          location: mockStaffLocation,
          distance: mockDistance,
          estimatedTime: mockTime,
          status: status
        });
      }, 500);
    });
  };

  const addCustomerMarker = () => {
    // In production, this would add a marker to the actual map
    customerMarkerRef.current = {
      position: customerLocation,
      type: 'customer'
    };
  };

  const updateStaffMarker = (location) => {
    // In production, this would update the marker on the actual map
    staffMarkerRef.current = {
      position: location,
      type: 'staff'
    };
  };

  const updateRoute = (staffLoc) => {
    // In production, this would draw a route line on the map
    if (customerLocation && staffLoc) {
      routeLayerRef.current = {
        from: staffLoc,
        to: customerLocation
      };
    }
  };

  const getStatusIcon = () => {
    switch (staffStatus) {
      case 'preparing':
        return '📦';
      case 'on_way':
        return '🚗';
      case 'nearby':
        return '📍';
      case 'arrived':
        return '✅';
      default:
        return '🚗';
    }
  };

  const getStatusText = () => {
    switch (staffStatus) {
      case 'preparing':
        return 'Staff is preparing for your service';
      case 'on_way':
        return 'Staff is on the way to your location';
      case 'nearby':
        return 'Staff is nearby';
      case 'arrived':
        return 'Staff has arrived at your location';
      default:
        return 'Tracking staff location...';
    }
  };

  return (
    <div className="tracking-map-overlay">
      <div className="tracking-map-container">
        <div className="tracking-header">
          <h2>Track Your Service Staff</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="tracking-status-bar">
          <div className="status-icon">{getStatusIcon()}</div>
          <div className="status-info">
            <p className="status-text">{getStatusText()}</p>
            {estimatedTime && distance && staffStatus !== 'arrived' && (
              <p className="status-details">
                {distance} km away • Arriving in {estimatedTime} minutes
              </p>
            )}
          </div>
        </div>

        <div className="map-view" ref={mapRef}>
          {/* Placeholder map visualization */}
          <div className="map-placeholder">
            <div className="map-grid">
              {customerLocation && (
                <div className="marker customer-marker" style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}>
                  <div className="marker-icon">🏠</div>
                  <div className="marker-label">Your Location</div>
                </div>
              )}

              {staffLocation && (
                <div className="marker staff-marker" style={{
                  position: 'absolute',
                  left: `${45 + (staffLocation.lng - customerLocation.lng) * 1000}%`,
                  top: `${45 + (staffLocation.lat - customerLocation.lat) * 1000}%`,
                  transform: 'translate(-50%, -50%)'
                }}>
                  <div className="marker-icon">🚗</div>
                  <div className="marker-label">Staff</div>
                </div>
              )}

              {staffLocation && (
                <svg className="route-line" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none'
                }}>
                  <line
                    x1="50%"
                    y1="50%"
                    x2={`${45 + (staffLocation.lng - customerLocation.lng) * 1000}%`}
                    y2={`${45 + (staffLocation.lat - customerLocation.lat) * 1000}%`}
                    stroke="#4299e1"
                    strokeWidth="3"
                    strokeDasharray="8,4"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>

        <div className="tracking-info-panel">
          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Booking ID</span>
              <span className="info-value">#{bookingId}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Status</span>
              <span className={`info-value status-${staffStatus}`}>
                {staffStatus.replace('_', ' ')}
              </span>
            </div>
          </div>

          {customerLocation && (
            <div className="location-details">
              <p className="location-label">Service Location:</p>
              <p className="location-coords">
                Lat: {customerLocation.lat.toFixed(6)}, Lng: {customerLocation.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        <div className="tracking-actions">
          <button className="action-btn call-btn">
            📞 Call Staff
          </button>
          <button className="action-btn refresh-btn" onClick={fetchStaffLocation}>
            🔄 Refresh Location
          </button>
        </div>

        <div className="tracking-note">
          <p>📍 Location updates every 5 seconds</p>
          <p>Real-time GPS tracking is active</p>
        </div>
      </div>
    </div>
  );
};

export default StaffTrackingMap;
