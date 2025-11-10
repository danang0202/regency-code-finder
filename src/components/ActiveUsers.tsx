'use client';

import { useEffect, useState } from 'react';
import { Badge, Group, Text, Avatar, Tooltip, Paper } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { useSocket, UserJoinedEvent } from '@/hooks/useSocket';

interface ActiveUsersProps {
  fileId: string;
}

interface ActiveUser {
  id: string;
  username: string;
  joinedAt: string;
}

export function ActiveUsers({ fileId }: ActiveUsersProps) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const { 
    isConnected, 
    joinFileRoom, 
    leaveFileRoom, 
    onUserJoined, 
    onUserLeft,
    onActiveUsers 
  } = useSocket();

  useEffect(() => {
    console.log('ActiveUsers: isConnected=', isConnected, 'fileId=', fileId);
    if (!isConnected || !fileId) return;

    // Join the file room
    console.log('ActiveUsers: Joining file room:', fileId);
    joinFileRoom(fileId);

    // Listen for active users list (when joining)
    const unsubscribeActiveUsers = onActiveUsers((event) => {
      console.log('ActiveUsers: Active users list received:', event);
      if (event.fileId === fileId) {
        const users = event.users.map(user => ({
          id: user.userId,
          username: user.username,
          joinedAt: user.timestamp
        }));
        console.log('ActiveUsers: Setting active users:', users);
        setActiveUsers(users);
      }
    });

    // Listen for users joining
    const unsubscribeJoined = onUserJoined((event: UserJoinedEvent) => {
      console.log('ActiveUsers: User joined event:', event);
      setActiveUsers(prev => {
        // Check if user already exists
        if (prev.some(user => user.id === event.userId)) {
          return prev;
        }
        const newUsers = [...prev, {
          id: event.userId,
          username: event.username,
          joinedAt: event.timestamp
        }];
        console.log('ActiveUsers: Updated user list:', newUsers);
        return newUsers;
      });
    });

    // Listen for users leaving
    const unsubscribeLeft = onUserLeft((event: UserJoinedEvent) => {
      console.log('ActiveUsers: User left event:', event);
      setActiveUsers(prev => {
        const newUsers = prev.filter(user => user.id !== event.userId);
        console.log('ActiveUsers: Updated user list after leave:', newUsers);
        return newUsers;
      });
    });

    return () => {
      leaveFileRoom(fileId);
      unsubscribeActiveUsers();
      unsubscribeJoined();
      unsubscribeLeft();
    };
  }, [isConnected, fileId, joinFileRoom, leaveFileRoom, onUserJoined, onUserLeft, onActiveUsers]);

  if (!isConnected) {
    return (
      <Paper p="xs" radius="md" withBorder>
        <Group spacing="xs">
          <IconUsers size={16} />
          <Text size="sm" color="dimmed">Offline</Text>
        </Group>
      </Paper>
    );
  }

  return (
    <Paper p="xs" radius="md" withBorder>
      <Group spacing="xs">
        <IconUsers size={16} />
        <Text size="sm" weight={500}>
          Active Users ({activeUsers.length})
        </Text>
        
        {activeUsers.length > 0 && (
          <Group spacing="xs">
            {activeUsers.slice(0, 5).map((user, index) => (
              <Tooltip key={user.id} label={user.username} withArrow>
                <Avatar
                  size="sm"
                  radius="xl"
                  color="blue"
                  style={{ 
                    marginLeft: index > 0 ? -8 : 0,
                    zIndex: activeUsers.length - index 
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
            
            {activeUsers.length > 5 && (
              <Badge variant="light" size="sm">
                +{activeUsers.length - 5}
              </Badge>
            )}
          </Group>
        )}
      </Group>
    </Paper>
  );
}