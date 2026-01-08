const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);

    // Join user-specific room
    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined personal room`);
    });

    // Join admin room (for admins and staff)
    socket.on('join-admin', () => {
      if (socket.userRole === 'admin' || socket.userRole === 'staff') {
        socket.join('admin-room');
        console.log(`${socket.userRole} ${socket.userId} joined admin room`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });

    // Custom events can be added here
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  return io;
};

// Emit events to specific users or rooms
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user-${userId}`).emit(event, data);
  }
};

const emitToAdmin = (event, data) => {
  if (io) {
    io.to('admin-room').emit(event, data);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Booking events
const notifyBookingCreated = (booking) => {
  emitToAdmin('booking-created', booking);
  if (booking.user_id) {
    emitToUser(booking.user_id, 'booking-created', booking);
  }
};

const notifyBookingUpdated = (booking) => {
  emitToAdmin('booking-updated', booking);
  if (booking.user_id) {
    emitToUser(booking.user_id, 'booking-updated', booking);
  }
};

const notifyBookingCancelled = (booking) => {
  emitToAdmin('booking-cancelled', booking);
  if (booking.user_id) {
    emitToUser(booking.user_id, 'booking-cancelled', booking);
  }
};

// User events
const notifyUserCreated = (user) => {
  emitToAdmin('user-created', user);
};

const notifyUserUpdated = (user) => {
  emitToAdmin('user-updated', user);
  emitToUser(user.id, 'profile-updated', user);
};

// Payment events
const notifyPaymentReceived = (payment) => {
  emitToAdmin('payment-received', payment);
  if (payment.user_id) {
    emitToUser(payment.user_id, 'payment-received', payment);
  }
};

const notifyPaymentFailed = (payment) => {
  emitToAdmin('payment-failed', payment);
  if (payment.user_id) {
    emitToUser(payment.user_id, 'payment-failed', payment);
  }
};

// Staff events
const notifyStaffCheckin = (staff) => {
  emitToAdmin('staff-checkin', staff);
};

const notifyStaffCheckout = (staff) => {
  emitToAdmin('staff-checkout', staff);
};

// Notification system
const sendNotification = (userId, notification) => {
  emitToUser(userId, 'notification', notification);
};

module.exports = {
  initializeWebSocket,
  emitToUser,
  emitToAdmin,
  emitToAll,
  notifyBookingCreated,
  notifyBookingUpdated,
  notifyBookingCancelled,
  notifyUserCreated,
  notifyUserUpdated,
  notifyPaymentReceived,
  notifyPaymentFailed,
  notifyStaffCheckin,
  notifyStaffCheckout,
  sendNotification
};
