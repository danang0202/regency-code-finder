'use client';

import { useEffect, useState } from 'react';
import { Notification, Stack } from '@mantine/core';
import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';
import { useSocket, SystemNotificationEvent, FileUpdateEvent } from '@/hooks/useSocket';

interface RealtimeNotificationsProps {
  fileId?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: string;
}

export function RealtimeNotifications({ fileId }: RealtimeNotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { onSystemNotification, onFileUpdated } = useSocket();

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    if (notifications.length === 0) return;

    const timer = setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);

    return () => clearTimeout(timer);
  }, [notifications]);

  // Listen for system notifications
  useEffect(() => {
    console.log('RealtimeNotifications: Setting up system notification listener');
    const unsubscribe = onSystemNotification((event: SystemNotificationEvent) => {
      console.log('RealtimeNotifications: System notification received:', event);
      const notification: NotificationItem = {
        id: `system-${Date.now()}`,
        title: 'System Notification',
        message: event.message,
        type: event.type,
        timestamp: event.timestamp
      };
      
      setNotifications(prev => [...prev, notification]);
    });

    return unsubscribe;
  }, [onSystemNotification]);

  // Listen for file updates if fileId is provided
  useEffect(() => {
    if (!fileId) return;

    const unsubscribe = onFileUpdated((event: FileUpdateEvent) => {
      const actionText = {
        update: 'updated',
        delete: 'deleted',
        add: 'added'
      }[event.action] || 'modified';

      const notification: NotificationItem = {
        id: `file-${Date.now()}`,
        title: 'File Updated',
        message: `${event.username} ${actionText} data in the file`,
        type: 'info',
        timestamp: event.timestamp
      };
      
      setNotifications(prev => [...prev, notification]);
    });

    return unsubscribe;
  }, [fileId, onFileUpdated]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <IconCheck size={16} />;
      case 'error': return <IconX size={16} />;
      case 'warning': return <IconAlertTriangle size={16} />;
      default: return <IconInfoCircle size={16} />;
    }
  };

  const handleClose = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 20, 
      right: 20, 
      zIndex: 1000,
      maxWidth: 350 
    }}>
      <Stack spacing="xs">
        {notifications.slice(-3).map((notification) => (
          <Notification
            key={notification.id}
            icon={getIcon(notification.type)}
            color={notification.type === 'error' ? 'red' : 
                   notification.type === 'warning' ? 'yellow' :
                   notification.type === 'success' ? 'green' : 'blue'}
            title={notification.title}
            onClose={() => handleClose(notification.id)}
          >
            {notification.message}
          </Notification>
        ))}
      </Stack>
    </div>
  );
}