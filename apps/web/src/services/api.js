import axios from 'axios';

// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000 // 30 second timeout
});

// Add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - server took too long to respond');
    } else if (error.response?.status === 401) {
      console.error('Unauthorized - please login again');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (!error.response) {
      console.error('Network error - cannot reach server');
    }
    return Promise.reject(error);
  }
);

// Export the base URL for use in fetch calls
export const getApiUrl = (endpoint) => {
  const base = API_URL.replace('/api', ''); // Remove /api if present
  return `${base}/api${endpoint}`;
};

// ============================================
// ADMIN API
// ============================================
export const adminAPI = {
  // Dashboard
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalUsers: 0,
        totalBookings: 0,
        totalRevenue: 0,
        activeBookings: 0,
        completedToday: 0,
        pendingBookings: 0
      };
    }
  },

  getRecentActivity: async (limit = 10) => api.get(`/admin/recent-activity?limit=${limit}`),

  // Users
  getUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },
  getUserById: async (id) => api.get(`/admin/users/${id}`),
  updateUser: async (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: async (id) => api.delete(`/admin/users/${id}`),

  // Bookings
  getBookings: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/admin/bookings${queryString ? `?${queryString}` : ''}`);
  },
  getBookingById: async (id) => api.get(`/admin/bookings/${id}`),
  updateBooking: async (id, data) => api.put(`/admin/bookings/${id}`, data),
  deleteBooking: async (id) => api.delete(`/admin/bookings/${id}`),
  updateBookingStatus: async (id, status) => api.patch(`/admin/bookings/${id}/status`, { status }),

  // Services
  getServices: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/admin/services${queryString ? `?${queryString}` : ''}`);
  },
  getServiceById: async (id) => api.get(`/admin/services/${id}`),
  createService: async (data) => api.post('/admin/services', data),
  updateService: async (id, data) => api.put(`/admin/services/${id}`, data),
  deleteService: async (id) => api.delete(`/admin/services/${id}`),

  // Analytics
  getAnalytics: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/admin/analytics${queryString ? `?${queryString}` : ''}`);
  },
  getRevenueStats: async (period = '30days') => api.get(`/admin/analytics/revenue?period=${period}`),
  getBookingStats: async (period = '30days') => api.get(`/admin/analytics/bookings?period=${period}`),
  getCustomerStats: async () => api.get('/admin/analytics/customers'),
  getServiceStats: async () => api.get('/admin/analytics/services')
};

// ============================================
// BOOKINGS API
// ============================================
export const bookingsAPI = {
  getMyBookings: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/bookings${queryString ? `?${queryString}` : ''}`);
  },
  getAllBookings: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/bookings/all${queryString ? `?${queryString}` : ''}`);
  },
  getBookingById: async (id) => api.get(`/bookings/${id}`),
  createBooking: async (data) => api.post('/bookings', data),
  updateBooking: async (id, data) => api.put(`/bookings/${id}`, data),
  cancelBooking: async (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),
  rescheduleBooking: async (id, newDate, newTime) =>
    api.patch(`/bookings/${id}/reschedule`, { newDate, newTime }),
  getAvailableSlots: async (serviceId, date) =>
    api.get(`/bookings/available-slots?serviceId=${serviceId}&date=${date}`),
  confirmBooking: async (id) => api.patch(`/bookings/${id}/confirm`),
  completeBooking: async (id) => api.patch(`/bookings/${id}/complete`)
};

// ============================================
// SERVICES API
// ============================================
export const servicesAPI = {
  getAllServices: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/services${queryString ? `?${queryString}` : ''}`);
  },
  getServiceById: async (id) => api.get(`/services/${id}`),
  getServiceCategories: async () => api.get('/services/categories'),
  getPopularServices: async (limit = 6) => api.get(`/services/popular?limit=${limit}`),
  searchServices: async (query) => api.get(`/services/search?q=${query}`)
};

// ============================================
// VEHICLES API
// ============================================
export const vehiclesAPI = {
  getMyVehicles: async () => api.get('/vehicles'),
  getVehicleById: async (id) => api.get(`/vehicles/${id}`),
  addVehicle: async (data) => api.post('/vehicles', data),
  updateVehicle: async (id, data) => api.put(`/vehicles/${id}`, data),
  deleteVehicle: async (id) => api.delete(`/vehicles/${id}`),
  setDefaultVehicle: async (id) => api.patch(`/vehicles/${id}/set-default`)
};

// ============================================
// LOYALTY API
// ============================================
export const loyaltyAPI = {
  getMyProgram: async () => api.get('/loyalty/my-program'),
  getRewards: async () => api.get('/loyalty/rewards'),
  redeemPoints: async (data) => api.post('/loyalty/redeem', data),
  getHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/loyalty/history${queryString ? `?${queryString}` : ''}`);
  },
  getTiers: async () => api.get('/loyalty/tiers'),
  getPointsBalance: async () => api.get('/loyalty/points-balance'),
  earnPoints: async (bookingId) => api.post('/loyalty/earn', { bookingId })
};

// ============================================
// WALLET API
// ============================================
export const walletsAPI = {
  getMyWallet: async () => api.get('/wallets/my-wallet'),
  getTransactions: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/wallets/transactions${queryString ? `?${queryString}` : ''}`);
  },
  getStatistics: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/wallets/statistics${queryString ? `?${queryString}` : ''}`);
  },
  topUp: async (amount, paymentMethod) =>
    api.post('/wallets/top-up', { amount, paymentMethod }),
  transfer: async (recipientId, amount, note) =>
    api.post('/wallets/transfer', { recipientId, amount, note }),
  configureCashback: async (enabled, percentage) =>
    api.put('/wallets/cashback-config', { enabled, percentage }),
  configureAutoReload: async (enabled, threshold, amount) =>
    api.put('/wallets/auto-reload-config', { enabled, threshold, amount }),
  getBalance: async () => api.get('/wallets/balance')
};

// ============================================
// REVIEWS API
// ============================================
export const reviewsAPI = {
  getServiceReviews: async (serviceId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/reviews/service/${serviceId}${queryString ? `?${queryString}` : ''}`);
  },
  getMyReviews: async () => api.get('/reviews/my-reviews'),
  createReview: async (data) => api.post('/reviews', data),
  updateReview: async (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: async (id) => api.delete(`/reviews/${id}`),
  likeReview: async (id) => api.post(`/reviews/${id}/like`),
  reportReview: async (id, reason) => api.post(`/reviews/${id}/report`, { reason })
};

// ============================================
// SUBSCRIPTIONS API
// ============================================
export const subscriptionsAPI = {
  getPlans: async () => api.get('/subscriptions/plans'),
  getMySubscription: async () => api.get('/subscriptions/my-subscription'),
  subscribe: async (planId, paymentMethod) =>
    api.post('/subscriptions/subscribe', { planId, paymentMethod }),
  cancelSubscription: async (reason) =>
    api.post('/subscriptions/cancel', { reason }),
  pauseSubscription: async () => api.post('/subscriptions/pause'),
  resumeSubscription: async () => api.post('/subscriptions/resume'),
  updatePaymentMethod: async (paymentMethodId) =>
    api.put('/subscriptions/payment-method', { paymentMethodId }),
  getSubscriptionHistory: async () => api.get('/subscriptions/history')
};

// ============================================
// PUNCH CARDS API
// ============================================
export const punchCardsAPI = {
  getMyCards: async () => api.get('/punch-cards/my-cards'),
  getCardById: async (id) => api.get(`/punch-cards/${id}`),
  activateCard: async (serviceId) => api.post('/punch-cards/activate', { serviceId }),
  stampCard: async (cardId, bookingId) =>
    api.post('/punch-cards/stamp', { cardId, bookingId }),
  redeemCard: async (cardId) => api.post('/punch-cards/redeem', { cardId }),
  getAvailableCards: async () => api.get('/punch-cards/available')
};

// ============================================
// SAVED LOCATIONS API
// ============================================
export const savedLocationsAPI = {
  getMyLocations: async () => api.get('/saved-locations'),
  getLocationById: async (id) => api.get(`/saved-locations/${id}`),
  addLocation: async (data) => api.post('/saved-locations', data),
  updateLocation: async (id, data) => api.put(`/saved-locations/${id}`, data),
  deleteLocation: async (id) => api.delete(`/saved-locations/${id}`),
  setDefaultLocation: async (id) => api.patch(`/saved-locations/${id}/set-default`)
};

// ============================================
// PAYMENTS API
// ============================================
export const paymentsAPI = {
  // Stripe
  createPaymentIntent: async (amount, bookingId) =>
    api.post('/payments-stripe/create-payment-intent', { amount, bookingId }),
  confirmPayment: async (paymentIntentId) =>
    api.post('/payments-stripe/confirm', { paymentIntentId }),
  getPaymentHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/payments-stripe/history${queryString ? `?${queryString}` : ''}`);
  },
  refundPayment: async (paymentIntentId, amount) =>
    api.post('/payments-stripe/refund', { paymentIntentId, amount }),

  // Payment Methods
  getPaymentMethods: async () => api.get('/payments-stripe/methods'),
  addPaymentMethod: async (data) => api.post('/payments-stripe/methods', data),
  deletePaymentMethod: async (id) => api.delete(`/payments-stripe/methods/${id}`),
  setDefaultPaymentMethod: async (id) =>
    api.patch(`/payments-stripe/methods/${id}/set-default`)
};

// ============================================
// TRACKING API (Staff & Fleet)
// ============================================
export const trackingAPI = {
  // Staff tracking
  updateStaffLocation: async (latitude, longitude) =>
    api.post('/tracking/staff/location', { latitude, longitude }),
  getStaffLocation: async (staffId) => api.get(`/tracking/staff/${staffId}/location`),
  getAllStaffLocations: async () => api.get('/tracking/staff/all-locations'),
  clockIn: async () => api.post('/tracking/staff/clock-in'),
  clockOut: async () => api.post('/tracking/staff/clock-out'),

  // Fleet tracking
  updateVehicleLocation: async (vehicleId, latitude, longitude) =>
    api.post('/tracking/fleet/location', { vehicleId, latitude, longitude }),
  getVehicleLocation: async (vehicleId) => api.get(`/tracking/fleet/${vehicleId}/location`),
  getAllVehicleLocations: async () => api.get('/tracking/fleet/all-locations'),

  // Work sessions
  getActiveSession: async () => api.get('/tracking/staff/active-session'),
  getSessionHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/tracking/staff/session-history${queryString ? `?${queryString}` : ''}`);
  }
};

// ============================================
// USER/PROFILE API
// ============================================
export const userAPI = {
  getProfile: async () => api.get('/users/profile'),
  updateProfile: async (data) => api.put('/users/profile', data),
  updatePassword: async (currentPassword, newPassword) =>
    api.put('/users/password', { currentPassword, newPassword }),
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteAccount: async (password) => api.delete('/users/account', { data: { password } }),
  getNotificationSettings: async () => api.get('/users/notification-settings'),
  updateNotificationSettings: async (settings) =>
    api.put('/users/notification-settings', settings)
};

// ============================================
// GUEST BOOKINGS API
// ============================================
export const guestBookingsAPI = {
  createGuestBooking: async (data) => api.post('/guest-bookings', data),
  getGuestBooking: async (bookingNumber, email) =>
    api.get(`/guest-bookings/${bookingNumber}?email=${email}`),
  cancelGuestBooking: async (bookingNumber, email, reason) =>
    api.post(`/guest-bookings/${bookingNumber}/cancel`, { email, reason })
};

export default api;
