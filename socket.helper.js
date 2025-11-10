import { Server } from 'socket.io';
import { getSession } from './socket-auth.helper.js';

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

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      // Get session from cookie
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) {
        return next(new Error('No cookies found'));
      }

      // Parse session cookie
      const sessionMatch = cookies.match(/session=([^;]+)/);
      if (!sessionMatch) {
        return next(new Error('No session cookie found'));
      }

      const sessionId = sessionMatch[1];
      
      // Get session data
      const session = await getSession(sessionId);
      if (!session) {
        return next(new Error('Invalid session'));
      }

      // Set user data from session
      socket.data.user = {
        id: session.id,
        username: session.username,
        email: session.email
      };
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    const user = socket.data.user;
    socket.data.joinedRooms = new Set(); // Track joined rooms for disconnect handling
    console.log(`User ${user?.username} connected with socket ${socket.id}`);

    // Join file-specific rooms when user opens a file
    socket.on('join-file', (fileId) => {
      console.log(`User ${user?.username} attempting to join file room: ${fileId}`);
      
      // Leave any existing file rooms for this socket
      Array.from(socket.rooms).forEach(room => {
        if (room.startsWith('file:') && room !== `file:${fileId}`) {
          socket.leave(room);
          console.log(`User ${user?.username} left previous room: ${room}`);
        }
      });
      
      socket.join(`file:${fileId}`);
      socket.data.joinedRooms.add(`file:${fileId}`); // Track joined room
      
      // Get current active users in the room (deduplicated by userId)
      const room = io.sockets.adapter.rooms.get(`file:${fileId}`);
      const activeUsers = [];
      const userIds = new Set();
      
      if (room) {
        room.forEach(socketId => {
          const roomSocket = io.sockets.sockets.get(socketId);
          const roomUser = roomSocket?.data.user;
          if (roomUser && !userIds.has(roomUser.id)) {
            userIds.add(roomUser.id);
            activeUsers.push({
              userId: roomUser.id,
              username: roomUser.username,
              timestamp: new Date().toISOString()
            });
          }
        });
      }
      
      // Send current active users to ALL users in the room (including the joiner)
      io.to(`file:${fileId}`).emit('active-users', { fileId, users: activeUsers });
      
      // Also notify about user joined (but not to the joining user)
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
      socket.data.joinedRooms.delete(`file:${fileId}`); // Remove from tracking
      
      // Get updated active users in the room after leaving
      const room = io.sockets.adapter.rooms.get(`file:${fileId}`);
      const activeUsers = [];
      const userIds = new Set();
      
      if (room) {
        room.forEach(socketId => {
          const roomSocket = io.sockets.sockets.get(socketId);
          const roomUser = roomSocket?.data.user;
          if (roomUser && !userIds.has(roomUser.id)) {
            userIds.add(roomUser.id);
            activeUsers.push({
              userId: roomUser.id,
              username: roomUser.username,
              timestamp: new Date().toISOString()
            });
          }
        });
      }
      
      // Send updated active users list to remaining users
      io.to(`file:${fileId}`).emit('active-users', { fileId, users: activeUsers });
      
      // Also notify about user leaving
      socket.to(`file:${fileId}`).emit('user-left', {
        userId: user?.id,
        username: user?.username,
        timestamp: new Date().toISOString()
      });

      console.log(`User ${user?.username} left file room: ${fileId}. Remaining active users: ${activeUsers.length}`);
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
    socket.on('disconnect', (reason) => {
      console.log(`🔌 DISCONNECT: User ${user?.username} disconnected from socket ${socket.id} (reason: ${reason})`);
      
      // Get all file rooms this socket was in (from our tracking)
      const rooms = Array.from(socket.data.joinedRooms || []);
      console.log(`🔌 DISCONNECT: Socket was in tracked rooms:`, rooms);
      
      rooms.forEach(room => {
        if (room.startsWith('file:')) {
          const fileId = room.replace('file:', '');
          console.log(`🔌 DISCONNECT: Processing file room: ${fileId}`);
          
          // Get updated active users after disconnect (this socket is already removed from room)
          const roomObj = io.sockets.adapter.rooms.get(room);
          const activeUsers = [];
          const userIds = new Set();
          
          console.log(`🔌 DISCONNECT: Room ${room} has ${roomObj ? roomObj.size : 0} remaining sockets`);
          
          if (roomObj) {
            roomObj.forEach(socketId => {
              const roomSocket = io.sockets.sockets.get(socketId);
              const roomUser = roomSocket?.data.user;
              console.log(`🔌 DISCONNECT: Checking remaining socket ${socketId} with user:`, roomUser?.username);
              if (roomUser && !userIds.has(roomUser.id)) {
                userIds.add(roomUser.id);
                activeUsers.push({
                  userId: roomUser.id,
                  username: roomUser.username,
                  timestamp: new Date().toISOString()
                });
              }
            });
          }
          
          console.log(`🔌 DISCONNECT: Broadcasting updated active users to room ${room}:`, activeUsers.map(u => u.username));
          
          // Send updated active users list to remaining users in room
          io.to(room).emit('active-users', { fileId, users: activeUsers });
          
          // Also notify about user leaving (to remaining users only)
          io.to(room).emit('user-left', {
            userId: user?.id,
            username: user?.username,
            timestamp: new Date().toISOString()
          });
          
          console.log(`🔌 DISCONNECT: User ${user?.username} disconnected from room ${room}. Remaining users: ${activeUsers.length}`);
        }
      });
    });
  });

  return io;
}

// Get active users in a specific file room (deduplicated)
export function getActiveUsersInFile(fileId) {
  if (!io) return [];
  
  const room = io.sockets.adapter.rooms.get(`file:${fileId}`);
  if (!room) return [];
  
  const users = [];
  const userIds = new Set();
  
  room.forEach(socketId => {
    const socket = io.sockets.sockets.get(socketId);
    const socketUser = socket?.data.user;
    if (socketUser && !userIds.has(socketUser.id)) {
      userIds.add(socketUser.id);
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