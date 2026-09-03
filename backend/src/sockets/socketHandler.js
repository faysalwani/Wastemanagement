let ioInstance = null;

const initSockets = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id} (transport: ${socket.conn.transport.name})`);

    // Client joins user-specific room for targeted notifications
    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`[Socket.io] Socket ${socket.id} joined private room: user_${userId}`);
      }
    });

    // Client joins ward-specific room for community announcements
    socket.on('join_ward_room', (wardName) => {
      if (wardName) {
        const cleanWard = wardName.trim().toLowerCase().replace(/\s+/g, '_');
        socket.join(`ward_${cleanWard}`);
        console.log(`[Socket.io] Socket ${socket.id} joined ward room: ward_${cleanWard}`);
      }
    });

    // Driver broadcasts live vehicle coordinates
    socket.on('driver_location_stream', (data) => {
      // Broadcast live vehicle movement to all listeners (Admin map & active citizens)
      io.emit('vehicle_location_updated', data);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized yet.');
  }
  return ioInstance;
};

module.exports = { initSockets, getIO };
