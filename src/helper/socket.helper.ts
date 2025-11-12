import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { getSession, UserSession } from "./auth.helper";

export interface SocketData {
  sessionId?: string;
  user?: UserSession;
}

export interface FileUpdateEvent {
  fileId: string;
  userId: string;
  username: string;
  action: 'update' | 'delete' | 'add';
  rowIndex?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export interface UserActivityEvent {
  userId: string;
  username: string;
  fileId: string;
  action: string;
  timestamp: string;
}

let io: SocketIOServer | null = null;

// Initialize Socket.IO server
export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',') 
        : ["http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const sessionId = socket.handshake.auth.sessionId;
      if (!sessionId) {
        return next(new Error('No session provided'));
      }

      const session = await getSession(sessionId);
      if (!session) {
        return next(new Error('Invalid session'));
      }

      socket.data.sessionId = sessionId;
      socket.data.user = session;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    const user = socket.data.user as UserSession;
    console.log(`User ${user?.username} connected with socket ${socket.id}`);

    // Join file-specific rooms when user opens a file
    socket.on('join-file', (fileId: string) => {
      socket.join(`file:${fileId}`);
      
      // Notify others in the room about new user
      socket.to(`file:${fileId}`).emit('user-joined', {
        userId: user?.id,
        username: user?.username,
        timestamp: new Date().toISOString()
      });

      console.log(`User ${user?.username} joined file room: ${fileId}`);
    });

    // Leave file-specific rooms
    socket.on('leave-file', (fileId: string) => {
      socket.leave(`file:${fileId}`);
      
      // Notify others in the room about user leaving
      socket.to(`file:${fileId}`).emit('user-left', {
        userId: user?.id,
        username: user?.username,
        timestamp: new Date().toISOString()
      });

      console.log(`User ${user?.username} left file room: ${fileId}`);
    });

    // Handle file data updates
    socket.on('file-update', (data: Omit<FileUpdateEvent, 'userId' | 'username' | 'timestamp'>) => {
      if (!user) return;

      const updateEvent: FileUpdateEvent = {
        ...data,
        userId: user.id,
        username: user.username,
        timestamp: new Date().toISOString()
      };

      // Broadcast to all users in the same file room except sender
      socket.to(`file:${data.fileId}`).emit('file-updated', updateEvent);
      
      console.log(`File update from ${user.username} in file ${data.fileId}:`, data.action);
    });

    // Handle user activity (typing, selecting, etc.)
    socket.on('user-activity', (data: Omit<UserActivityEvent, 'userId' | 'username' | 'timestamp'>) => {
      if (!user) return;

      const activityEvent: UserActivityEvent = {
        ...data,
        userId: user.id,
        username: user.username,
        timestamp: new Date().toISOString()
      };

      // Broadcast to all users in the same file room except sender
      socket.to(`file:${data.fileId}`).emit('user-activity', activityEvent);
    });

    // Handle cursor/selection updates
    socket.on('cursor-update', (data: { fileId: string; rowIndex: number; columnIndex: number }) => {
      if (!user) return;

      socket.to(`file:${data.fileId}`).emit('cursor-updated', {
        userId: user.id,
        username: user.username,
        ...data,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason: string) => {
      console.log(`User ${user?.username} disconnected: ${reason}`);
      
      // Notify all rooms this user was in
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (typeof room === 'string' && room.startsWith('file:')) {
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

// Get Socket.IO server instance
export function getSocketServer(): SocketIOServer | null {
  return io;
}

// Emit event to specific file room
export function emitToFileRoom(fileId: string, event: string, data: Record<string, unknown>): void {
  if (!io) return;
  io.to(`file:${fileId}`).emit(event, data);
}

// Emit event to specific user
export function emitToUser(userId: string, event: string, data: Record<string, unknown>): void {
  if (!io) return;
  
  // Find socket by user ID
  const sockets = io.sockets.sockets;
  sockets.forEach(socket => {
    const socketUser = socket.data.user as UserSession;
    if (socketUser?.id === userId) {
      socket.emit(event, data);
    }
  });
}

// Get active users in a file room
export function getActiveUsersInFile(fileId: string): UserSession[] {
  if (!io) return [];
  
  const room = io.sockets.adapter.rooms.get(`file:${fileId}`);
  if (!room) return [];
  
  const users: UserSession[] = [];
  room.forEach(socketId => {
    const socket = io?.sockets.sockets.get(socketId);
    const socketUser = socket?.data.user as UserSession;
    if (socketUser) {
      users.push(socketUser);
    }
  });
  
  return users;
}

// Get all active users
export function getAllActiveUsers(): UserSession[] {
  if (!io) return [];
  
  const users: UserSession[] = [];
  const sockets = io.sockets.sockets;
  
  sockets.forEach(socket => {
    const socketUser = socket.data.user as UserSession;
    if (socketUser) {
      users.push(socketUser);
    }
  });
  
  return users;
}

// Broadcast system notification
export function broadcastSystemNotification(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
  if (!io) return;
  
  io.emit('system-notification', {
    message,
    type,
    timestamp: new Date().toISOString()
  });
}

// Clean up Socket.IO server
export function closeSocketServer(): void {
  if (io) {
    io.close();
    io = null;
  }
}