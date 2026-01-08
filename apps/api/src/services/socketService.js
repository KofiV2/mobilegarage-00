const socketIO = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    socket.on('join-staff-room', (staffId) => {
      socket.join('staff-room');
      socket.join(`staff-${staffId}`);
      console.log(`Staff ${staffId} joined staff room`);
    });

    socket.on('join-admin-room', () => {
      socket.join('admin-room');
      console.log('Admin joined admin room');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Notification helpers
const notifyUser = (userId, event, data) => {
  if (io) {
    io.to(`user-${userId}`).emit(event, data);
  }
};

const notifyStaff = (event, data) => {
  if (io) {
    io.to('staff-room').emit(event, data);
  }
};

const notifyAdmin = (event, data) => {
  if (io) {
    io.to('admin-room').emit(event, data);
  }
};

const notifyAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  notifyUser,
  notifyStaff,
  notifyAdmin,
  notifyAll
};
