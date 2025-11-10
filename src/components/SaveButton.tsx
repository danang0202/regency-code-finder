import React from 'react';
import { Button } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';

interface SaveButtonProps {
  hasChanges: boolean;
  loading?: boolean;
  onSave: () => void;
}

export function SaveButton({ hasChanges, loading = false, onSave }: SaveButtonProps) {
  return (
    <Button
      size="sm"
      color={hasChanges ? "blue" : "gray"}
      leftIcon={<IconDeviceFloppy size={16} />}
      onClick={onSave}
      loading={loading}
      disabled={!hasChanges}
    >
      Simpan
    </Button>
  );
}