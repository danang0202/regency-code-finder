'use client';

import { useEffect, useState } from 'react';
import { Badge, Group, Text, Avatar, Tooltip, Paper } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { useSocket } from '@/hooks/useSocket';

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
      console.log('👥 CLIENT: Active users list received:', event);
      if (event.fileId === fileId) {
        const users = event.users.map(user => ({
          id: user.userId,
          username: user.username,
          joinedAt: user.timestamp
        }));
        
        // Deduplicate users by id
        const uniqueUsers = users.filter((user, index, self) => 
          index === self.findIndex(u => u.id === user.id)
        );
        
        console.log('👥 CLIENT: Setting active users (deduplicated):', uniqueUsers);
        setActiveUsers(uniqueUsers);
      }
    });

    // Note: We no longer listen to individual join/leave events
    // Instead, we rely on the authoritative 'active-users' event from the server
    // which contains the complete, deduplicated list of active users

    return () => {
      leaveFileRoom(fileId);
      unsubscribeActiveUsers();
    };
  }, [isConnected, fileId, joinFileRoom, leaveFileRoom, onActiveUsers]);

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
              <Tooltip key={index} label={user.username} withArrow>
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