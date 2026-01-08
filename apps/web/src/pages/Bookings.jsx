import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const Bookings = () => {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>{t('common.loading')}</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1>{t('bookings.title')}</h1>
      <div style={{ marginTop: '2rem' }}>
        {bookings.length === 0 ? (
          <p>{t('bookings.noBookings')}</p>
        ) : (
          bookings.map(booking => (
            <Link
              key={booking._id}
              to={`/booking/${booking._id}`}
              style={{
                display: 'block',
                background: 'white',
                padding: '1.5rem',
                marginBottom: '1rem',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <h3>{booking.serviceId?.name}</h3>
              <p>{t('common.date')}: {new Date(booking.scheduledDate).toLocaleDateString()}</p>
              <p>{t('common.time')}: {booking.scheduledTime}</p>
              <p>{t('common.status')}: <span style={{ fontWeight: 'bold' }}>{t(`bookings.status.${booking.status}`)}</span></p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Bookings;
