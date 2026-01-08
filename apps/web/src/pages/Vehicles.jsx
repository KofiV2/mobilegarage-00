import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const Vehicles = () => {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data.vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1>{t('vehicles.title')}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        {vehicles.length === 0 ? (
          <p>{t('vehicles.noVehicles')}</p>
        ) : (
          vehicles.map(vehicle => (
            <div key={vehicle._id} style={{
              background: 'white',
              borderRadius: '10px',
              padding: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <h3>{vehicle.make} {vehicle.model}</h3>
              <p>{t('vehicles.year')}: {vehicle.year}</p>
              <p>{t('vehicles.color')}: {vehicle.color}</p>
              <p>{t('vehicles.licensePlate')}: {vehicle.licensePlate}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Vehicles;
