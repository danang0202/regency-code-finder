// TODO: Add proper authentication later
import { Server } from 'socket.io';

let io = null;

// Initialize Socket.IO server
export function initSocketServer(httpServer) {
  if (io) {
    return io;
  }
  
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',') 
        : ["http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Temporary: Skip authentication for testing
  io.use((socket, next) => {
    // Set dummy user data for testing
    socket.data.user = {
      id: 'test-user',
      username: 'Test User',
      email: 'test@example.com'
    };
    next();
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`User ${user?.username} connected with socket ${socket.id}`);

    // Join file-specific rooms when user opens a file
    socket.on('join-file', (fileId) => {
      socket.join(`file:${fileId}`);
      
      // Get current active users in the room
      const room = io.sockets.adapter.rooms.get(`file:${fileId}`);
      const activeUsers = [];
      if (room) {
        room.forEach(socketId => {
          const roomSocket = io.sockets.sockets.get(socketId);
          const roomUser = roomSocket?.data.user;
          if (roomUser) {
            activeUsers.push({
              userId: roomUser.id,
              username: roomUser.username,
              timestamp: new Date().toISOString()
            });
          }
        });
      }
      
      // Send current active users to the joining user
      socket.emit('active-users', { fileId, users: activeUsers });
      
      // Notify others in the room about new user
      socket.to(`file:${fileId}`).emit('user-joined', {
        userId: user?.id,
        username: user?.username,
        timestamp: new Date().toISOString()
      });

      console.log(`User ${user?.username} joined file room: ${fileId}. Active users: ${activeUsers.length}`);
    });

    // Leave file-specific rooms
    socket.on('leave-file', (fileId) => {
      socket.leave(`file:${fileId}`);
      
      // Notify others in the room about user leaving
      socket.to(`file:${fileId}`).emit('user-left', {
        userId: user?.id,
        username: user?.username,
        timestamp: new Date().toISOString()
      });

      console.log(`User ${user?.username} left file room: ${fileId}`);
    });

    // Handle file updates
    socket.on('file-updated', (data) => {
      console.log('Socket server received file-updated event:', data);
      const { fileId, action, rowIndex, cellData } = data;
      
      const updateEvent = {
        fileId,
        userId: user?.id,
        username: user?.username,
        action,
        rowIndex,
        data: cellData,
        timestamp: new Date().toISOString()
      };

      console.log('Broadcasting file update to room file:' + fileId, updateEvent);
      // Broadcast to all users in the same file room except sender
      socket.to(`file:${fileId}`).emit('file-updated', updateEvent);
      
      console.log(`File ${fileId} updated by ${user?.username}:`, action);
    });

    // Handle user activity tracking
    socket.on('user-activity', (data) => {
      const { fileId, action } = data;
      
      const activityEvent = {
        userId: user?.id,
        username: user?.username,
        fileId,
        action,
        timestamp: new Date().toISOString()
      };

      // Broadcast to all users in the same file room except sender
      socket.to(`file:${fileId}`).emit('user-activity', activityEvent);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${user?.username} disconnected from socket ${socket.id}`);
      
      // Get all rooms this socket was in
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room.startsWith('file:')) {
          socket.to(room).emit('user-left', {
            userId: user?.id,
            username: user?.username,
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  });

  return io;
}

// Get active users in a specific file room
export function getActiveUsersInFile(fileId) {
  if (!io) return [];
  
  const room = io.sockets.adapter.rooms.get(`file:${fileId}`);
  if (!room) return [];
  
  const users = [];
  room.forEach(socketId => {
    const socket = io.sockets.sockets.get(socketId);
    const socketUser = socket?.data.user;
    if (socketUser) {
      users.push(socketUser);
    }
  });
  
  return users;
}

// Broadcast to specific file room
export function broadcastToFileRoom(fileId, event, data) {
  if (!io) return;
  io.to(`file:${fileId}`).emit(event, data);
}