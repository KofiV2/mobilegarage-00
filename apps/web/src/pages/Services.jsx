import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './Services.css';

const Services = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null); // null, 'home', or 'in-place'
  const [selectedType, setSelectedType] = useState(null); // null, 'washing', 'polish', or 'tint'
  const navigate = useNavigate();

  // Simplified service offerings
  const comprehensiveServices = [
    // IN-PLACE WASHING SERVICES
    {
      id: 1,
      name: 'Express Wash',
      category: 'in-place',
      type: 'washing',
      location: 'At Our Location',
      description: 'Quick automated wash for busy schedules.',
      basePrice: 30,
      duration: 10,
      features: [
        'Automated exterior wash',
        'Quick rinse & dry',
        'Basic tire clean'
      ],
      icon: '⚡'
    },
    {
      id: 2,
      name: 'Standard Wash',
      category: 'in-place',
      type: 'washing',
      location: 'At Our Location',
      description: 'Complete hand wash with attention to detail.',
      basePrice: 80,
      duration: 25,
      features: [
        'Exterior hand wash',
        'Wheel & tire cleaning',
        'Hand dry',
        'Tire shine',
        'Window cleaning'
      ],
      popular: true,
      icon: '🚗'
    },
    {
      id: 3,
      name: 'Premium Wash',
      category: 'in-place',
      type: 'washing',
      location: 'At Our Location',
      description: 'Complete interior and exterior detailing.',
      basePrice: 150,
      duration: 50,
      features: [
        'Full exterior hand wash',
        'Interior vacuum & cleaning',
        'Dashboard detail',
        'Premium wax coating',
        'All windows inside & out',
        'Leather conditioning'
      ],
      popular: true,
      icon: '🚗'
    },

    // HOME SERVICE WASHING
    {
      id: 4,
      name: 'Standard Wash',
      category: 'home',
      type: 'washing',
      location: 'At Your Location',
      description: 'Professional hand wash at your doorstep.',
      basePrice: 100,
      duration: 30,
      features: [
        'Mobile service to your location',
        'Exterior hand wash',
        'Wheel & tire cleaning',
        'Hand dry',
        'Tire shine',
        'All equipment provided'
      ],
      popular: true,
      icon: '🏠'
    },
    {
      id: 5,
      name: 'Premium Wash',
      category: 'home',
      type: 'washing',
      location: 'At Your Location',
      description: 'Complete mobile detailing at your home.',
      basePrice: 200,
      duration: 70,
      features: [
        'Mobile service to your location',
        'Complete exterior detail',
        'Full interior cleaning',
        'Premium wax coating',
        'Leather treatment',
        'All windows & mirrors',
        'Odor elimination'
      ],
      popular: true,
      icon: '🏠'
    },

    // IN-PLACE POLISHING SERVICES
    {
      id: 6,
      name: 'Standard Polish',
      category: 'in-place',
      type: 'polish',
      location: 'At Our Location',
      description: 'Machine polishing to restore shine and remove light scratches.',
      basePrice: 300,
      duration: 120,
      features: [
        'Machine polish',
        'Light scratch removal',
        'Paint correction',
        'Wax protection',
        'Exterior wash included'
      ],
      icon: '✨'
    },
    {
      id: 7,
      name: 'Premium Polish',
      category: 'in-place',
      type: 'polish',
      location: 'At Our Location',
      description: 'Advanced polishing with ceramic coating for lasting protection.',
      basePrice: 500,
      duration: 180,
      features: [
        'Two-step machine polish',
        'Medium scratch removal',
        'Swirl mark correction',
        'Ceramic coating (6 months)',
        'Paint thickness check',
        'Complete exterior detail'
      ],
      popular: true,
      icon: '✨'
    },

    // HOME SERVICE POLISHING
    {
      id: 8,
      name: 'Standard Polish',
      category: 'home',
      type: 'polish',
      location: 'At Your Location',
      description: 'Professional mobile polishing at your location.',
      basePrice: 400,
      duration: 150,
      features: [
        'Mobile service to your location',
        'Machine polish',
        'Light scratch removal',
        'Paint protection',
        'Professional equipment',
        'Wash & prep included'
      ],
      icon: '🏠'
    },
    {
      id: 9,
      name: 'Premium Polish',
      category: 'home',
      type: 'polish',
      location: 'At Your Location',
      description: 'Advanced mobile polishing with ceramic coating.',
      basePrice: 650,
      duration: 210,
      features: [
        'Mobile service to your location',
        'Two-step machine polish',
        'Paint correction',
        'Ceramic coating application',
        'Complete exterior prep',
        'All professional tools'
      ],
      popular: true,
      icon: '🏠'
    },

    // WINDOW TINTING SERVICES (In-Place Only)
    {
      id: 10,
      name: 'Standard Tint',
      category: 'in-place',
      type: 'tint',
      location: 'At Our Location',
      description: 'Quality window tinting for UV protection and privacy.',
      basePrice: 400,
      duration: 120,
      features: [
        'Standard tint film',
        'All side windows',
        'Rear window',
        'UV protection (70%)',
        '2-year warranty',
        'Professional installation'
      ],
      icon: '🔲'
    },
    {
      id: 11,
      name: 'Premium Tint',
      category: 'in-place',
      type: 'tint',
      location: 'At Our Location',
      description: 'High-quality ceramic tint with superior heat rejection.',
      basePrice: 650,
      duration: 150,
      features: [
        'Ceramic tint film',
        'All windows (including front)',
        'UV protection (99%)',
        'Heat rejection (65%)',
        'Lifetime warranty',
        'Maximum clarity'
      ],
      popular: true,
      icon: '🔲'
    }
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices(comprehensiveServices);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setSelectedType(null); // Reset type when location changes
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
  };

  const handleBack = () => {
    if (selectedType) {
      setSelectedType(null);
    } else if (selectedLocation) {
      setSelectedLocation(null);
    }
  };

  const getBadgeClass = (category) => {
    return category === 'home' ? 'badge-home' : 'badge-in-place';
  };

  const getFilteredServices = () => {
    const allServices = services.length > 0 ? services : comprehensiveServices;

    if (!selectedLocation) return [];
    if (!selectedType) return [];

    return allServices.filter(
      service => service.category === selectedLocation && service.type === selectedType
    );
  };

  if (loading) {
    return <div className="services-loading">{t('common.loading')}</div>;
  }

  const filteredServices = getFilteredServices();

  // Step 1: Choose Location
  if (!selectedLocation) {
    return (
      <div className="services-page">
        <div className="services-header">
          <h1>{t('services.whereService')}</h1>
          <p>{t('services.chooseLocation')}</p>
        </div>

        <div className="location-selection">
          <div className="location-card" onClick={() => handleLocationSelect('in-place')}>
            <div className="location-icon">🏢</div>
            <h2>{t('services.atOurLocation')}</h2>
            <p>{t('services.visitFacility')}</p>
            <ul className="location-benefits">
              <li>✓ {t('services.professionalEquipment')}</li>
              <li>✓ {t('services.fasterService')}</li>
              <li>✓ {t('services.lowerPrices')}</li>
              <li>✓ {t('services.allServicesAvailable')}</li>
            </ul>
            <button className="select-btn">{t('services.select')}</button>
          </div>

          <div className="location-card" onClick={() => handleLocationSelect('home')}>
            <div className="location-icon">🏠</div>
            <h2>{t('services.atYourLocation')}</h2>
            <p>{t('services.weComeToYou')}</p>
            <ul className="location-benefits">
              <li>✓ {t('services.mobileService')}</li>
              <li>✓ {t('services.saveTime')}</li>
              <li>✓ {t('services.convenient')}</li>
              <li>✓ {t('services.professionalQuality')}</li>
            </ul>
            <button className="select-btn select-btn-home">{t('services.select')}</button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Choose Service Type
  if (!selectedType) {
    return (
      <div className="services-page">
        <button className="back-btn" onClick={handleBack}>
          ← {t('common.back')}
        </button>

        <div className="services-header">
          <h1>{t('services.whatService')}</h1>
          <p>
            {selectedLocation === 'home'
              ? t('services.mobileServiceAtLocation')
              : t('services.serviceAtFacility')}
          </p>
        </div>

        <div className="service-type-selection">
          <div className="type-card" onClick={() => handleTypeSelect('washing')}>
            <div className="type-icon">💧</div>
            <h2>{t('services.washing')}</h2>
            <p>{t('services.washingDesc')}</p>
            <div className="price-range">{t('services.startingFrom')} AED {selectedLocation === 'home' ? '100' : '30'}</div>
            <button className="select-btn">{t('services.chooseWashing')}</button>
          </div>

          <div className="type-card" onClick={() => handleTypeSelect('polish')}>
            <div className="type-icon">✨</div>
            <h2>{t('services.polishing')}</h2>
            <p>{t('services.polishingDesc')}</p>
            <div className="price-range">{t('services.startingFrom')} AED {selectedLocation === 'home' ? '400' : '300'}</div>
            <button className="select-btn">{t('services.choosePolishing')}</button>
          </div>

          {selectedLocation === 'in-place' && (
            <div className="type-card" onClick={() => handleTypeSelect('tint')}>
              <div className="type-icon">🔲</div>
              <h2>{t('services.tinting')}</h2>
              <p>{t('services.tintingDesc')}</p>
              <div className="price-range">{t('services.startingFrom')} AED 400</div>
              <button className="select-btn">{t('services.chooseTinting')}</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 3: Show Services
  return (
    <div className="services-page">
      <button className="back-btn" onClick={handleBack}>
        ← {t('common.back')}
      </button>

      <div className="services-header">
        <h1>
          {selectedType === 'washing' ? t('services.washingServices') :
           selectedType === 'polish' ? t('services.polishingServices') : t('services.tintingServices')}
        </h1>
        <p>
          {selectedLocation === 'home'
            ? t('services.mobileServiceAtLocation')
            : t('services.serviceAtFacility')}
        </p>
      </div>

      <div className="services-grid simplified">
        {filteredServices.map(service => (
          <div key={service.id || service._id} className="service-card simplified">
            {service.popular && (
              <div className="popular-badge">⭐ {t('services.mostPopular')}</div>
            )}

            <div className={`service-badge ${getBadgeClass(service.category)}`}>
              {service.icon} {service.name}
            </div>

            <div className="service-content">
              <p className="service-description">{service.description}</p>

              <div className="service-features">
                <h4>{t('services.includes')}:</h4>
                <ul className="features-list">
                  {service.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div className="service-footer">
                <div className="service-duration">
                  ⏱️ {service.duration || service.durationMinutes} {t('services.minutes')}
                </div>

                <div className="service-price">
                  AED {service.basePrice}
                </div>
              </div>

              <div className="booking-actions">
                <button
                  className="book-now-btn"
                  onClick={() => navigate(`/book/${service.id || service._id}`)}
                >
                  📅 {t('services.bookThisService')}
                </button>
                <button
                  className="book-guest-btn"
                  onClick={() => navigate('/guest-booking')}
                >
                  ⚡ Book as Guest
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="no-services">
          <h3>{t('services.noServicesAvailable')}</h3>
          <p>{t('services.selectDifferentOption')}</p>
        </div>
      )}
    </div>
  );
};

export default Services;
