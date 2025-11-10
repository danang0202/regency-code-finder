import React from 'react';
import { Button } from '@mantine/core';
import { IconFileTypeXls } from '@tabler/icons-react';

interface DownloadButtonProps {
  fileId: string;
  disabled?: boolean;
}

export function DownloadButton({ fileId, disabled = false }: DownloadButtonProps) {
  const handleDownload = async () => {
    if (!fileId) return;
    
    try {
      const res = await fetch(`/v2/api/file/${fileId}/download`);
      if (!res.ok) return;
      
      const blob = await res.blob();
      let filename = `data_${fileId}.csv`;
      
      const disposition = res.headers.get('Content-Disposition');
      if (disposition) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match) filename = match[1];
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch {
      // Optionally show error notification
    }
  };

  return (
    <Button
      size="sm"
      color="green"
      leftIcon={<IconFileTypeXls size={16} />} 
      variant="filled"
      onClick={handleDownload}
      disabled={disabled}
    >
      Download
    </Button>
  );
}