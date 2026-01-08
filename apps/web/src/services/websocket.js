import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(userId, role) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    this.socket = io(apiUrl, {
      auth: {
        token: localStorage.getItem('token'),
        userId,
        role
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');

      // Join appropriate rooms based on role
      if (role === 'admin' || role === 'staff') {
        this.socket.emit('join-admin');
      }
      this.socket.emit('join-user', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Setup default event listeners
    this.setupDefaultListeners();

    return this.socket;
  }

  setupDefaultListeners() {
    // Booking events
    this.socket.on('booking-created', (booking) => {
      this.emit('booking-created', booking);
    });

    this.socket.on('booking-updated', (booking) => {
      this.emit('booking-updated', booking);
    });

    this.socket.on('booking-cancelled', (booking) => {
      this.emit('booking-cancelled', booking);
    });

    // User events
    this.socket.on('user-created', (user) => {
      this.emit('user-created', user);
    });

    this.socket.on('user-updated', (user) => {
      this.emit('user-updated', user);
    });

    // Notification events
    this.socket.on('notification', (notification) => {
      this.emit('notification', notification);
    });

    // Payment events
    this.socket.on('payment-received', (payment) => {
      this.emit('payment-received', payment);
    });

    this.socket.on('payment-failed', (payment) => {
      this.emit('payment-failed', payment);
    });

    // Staff events
    this.socket.on('staff-checkin', (staff) => {
      this.emit('staff-checkin', staff);
    });

    this.socket.on('staff-checkout', (staff) => {
      this.emit('staff-checkout', staff);
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        callback(data);
      });
    }
  }

  send(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
