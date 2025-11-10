'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/components/auth/AuthProvider';

export interface FileUpdateEvent {
  fileId: string;
  userId: string;
  username: string;
  action: 'update' | 'delete' | 'add';
  rowIndex?: number;
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

export interface UserJoinedEvent {
  userId: string;
  username: string;
  timestamp: string;
}

export interface CursorUpdateEvent {
  userId: string;
  username: string;
  fileId: string;
  rowIndex: number;
  columnIndex: number;
  timestamp: string;
}

export interface SystemNotificationEvent {
  message: string;
  type: 'info' | 'warning' | 'error';
  timestamp: string;
}

interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  // Temporary: disable auth for testing
  // const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const { autoConnect = true, onConnect, onDisconnect, onError } = options;

  const connect = useCallback(() => {
    // Temporary: Skip auth check for testing
    // if (!isAuthenticated || !user) {
    //   console.log('Cannot connect socket: not authenticated');
    //   return;
    // }

    if (socket && socket.connected) {
      console.log('Socket already connected');
      return;
    }

    console.log('Connecting socket...');
    
    // Temporary: Connect without session for testing
    const newSocket = io({
      auth: {
        sessionId: 'test-session'
      },
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
      onConnect?.();
    });

    newSocket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      onDisconnect?.(reason);
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
      
      // Auto-reconnect logic
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        console.log(`Reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
        setTimeout(() => {
          newSocket.connect();
        }, 1000 * reconnectAttempts.current);
      } else {
        console.log('Max reconnection attempts reached');
        onError?.(new Error('Failed to connect after multiple attempts'));
      }
    });

    setSocket(newSocket);
  }, [socket, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (socket) {
      console.log('Disconnecting socket...');
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  // File-specific room management
  const joinFileRoom = useCallback((fileId: string) => {
    if (socket && isConnected) {
      socket.emit('join-file', fileId);
      console.log(`Joined file room: ${fileId}`);
    }
  }, [socket, isConnected]);

  const leaveFileRoom = useCallback((fileId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-file', fileId);
      console.log(`Left file room: ${fileId}`);
    }
  }, [socket, isConnected]);

  // Emit file update
  const emitFileUpdate = useCallback((fileId: string, action: 'update' | 'delete' | 'add', data?: Record<string, unknown>, rowIndex?: number) => {
    if (socket && isConnected) {
      console.log('useSocket: Emitting file-updated event:', { fileId, action, data, rowIndex });
      socket.emit('file-updated', {
        fileId,
        action,
        rowIndex,
        cellData: data
      });
    }
  }, [socket, isConnected]);

  // Emit user activity
  const emitUserActivity = useCallback((fileId: string, action: string) => {
    if (socket && isConnected) {
      socket.emit('user-activity', {
        fileId,
        action
      });
    }
  }, [socket, isConnected]);

  // Emit cursor update
  const emitCursorUpdate = useCallback((fileId: string, rowIndex: number, columnIndex: number) => {
    if (socket && isConnected) {
      socket.emit('cursor-update', {
        fileId,
        rowIndex,
        columnIndex
      });
    }
  }, [socket, isConnected]);

  // Event listeners
  const onFileUpdated = useCallback((callback: (event: FileUpdateEvent) => void) => {
    if (socket) {
      socket.on('file-updated', callback);
      return () => socket.off('file-updated', callback);
    }
    return () => {};
  }, [socket]);

  const onUserJoined = useCallback((callback: (event: UserJoinedEvent) => void) => {
    if (socket) {
      socket.on('user-joined', callback);
      return () => socket.off('user-joined', callback);
    }
    return () => {};
  }, [socket]);

  const onUserLeft = useCallback((callback: (event: UserJoinedEvent) => void) => {
    if (socket) {
      socket.on('user-left', callback);
      return () => socket.off('user-left', callback);
    }
    return () => {};
  }, [socket]);

  const onActiveUsers = useCallback((callback: (event: { fileId: string; users: UserJoinedEvent[] }) => void) => {
    if (socket) {
      socket.on('active-users', callback);
      return () => socket.off('active-users', callback);
    }
    return () => {};
  }, [socket]);

  const onUserActivity = useCallback((callback: (event: UserActivityEvent) => void) => {
    if (socket) {
      socket.on('user-activity', callback);
      return () => socket.off('user-activity', callback);
    }
    return () => {};
  }, [socket]);

  const onCursorUpdated = useCallback((callback: (event: CursorUpdateEvent) => void) => {
    if (socket) {
      socket.on('cursor-updated', callback);
      return () => socket.off('cursor-updated', callback);
    }
    return () => {};
  }, [socket]);

  const onSystemNotification = useCallback((callback: (event: SystemNotificationEvent) => void) => {
    if (socket) {
      socket.on('system-notification', callback);
      return () => socket.off('system-notification', callback);
    }
    return () => {};
  }, [socket]);

  // Auto-connect on mount (testing mode)
  useEffect(() => {
    if (autoConnect && !socket) {
      const timer = setTimeout(() => {
        connect();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [autoConnect, socket, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return {
    socket,
    isConnected,
    connectionError,
    connect,
    disconnect,
    joinFileRoom,
    leaveFileRoom,
    emitFileUpdate,
    emitUserActivity,
    emitCursorUpdate,
    onFileUpdated,
    onUserJoined,
    onUserLeft,
    onActiveUsers,
    onUserActivity,
    onCursorUpdated,
    onSystemNotification
  };
}