import React from 'react';
import { Center, Paper, Stack, Text } from '@mantine/core';
import { IconDatabaseOff } from '@tabler/icons-react';

export function EmptyDataState() {
  return (
    <Center style={{ minHeight: '40vh' }}>
      <Paper 
        shadow="md" 
        radius="md" 
        p="xl" 
        withBorder 
        style={{ 
          background: '#fff6f6', 
          borderColor: '#ffe0e0', 
          minWidth: 340 
        }}
      >
        <Stack align="center" spacing="xs">
          <IconDatabaseOff size={48} color="#fa5252" />
          <Text size="lg" weight={700} color="#fa5252">
            Data tidak ditemukan
          </Text>
          <Text size="sm" color="dimmed" align="center">
            File kosong, rusak, atau format tidak sesuai.<br />
            <span style={{ color: '#fa5252', fontWeight: 500 }}>
              Silakan upload ulang file yang valid.
            </span>
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}