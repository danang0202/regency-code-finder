import React from 'react';
import { Modal, Stack, Select, Group, Button } from '@mantine/core';
import { normalizeHeaderName, generateFilterOptions } from '@/helper/table-utils.helper';

interface FilterModalProps {
  opened: boolean;
  onClose: () => void;
  header: string[];
  allRows: string[][];
  activeFilters: { [colIdx: number]: string };
  onFilterChange: (filters: { [colIdx: number]: string }) => void;
}

export function FilterModal({
  opened,
  onClose,
  header,
  allRows,
  activeFilters,
  onFilterChange
}: FilterModalProps) {
  const [tempFilters, setTempFilters] = React.useState(activeFilters);

  React.useEffect(() => {
    setTempFilters(activeFilters);
  }, [activeFilters, opened]);

  const handleApply = () => {
    onFilterChange(tempFilters);
    onClose();
  };

  const handleReset = () => {
    const emptyFilters = {};
    setTempFilters(emptyFilters);
    onFilterChange(emptyFilters);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Filter Data"
      size="md"
    >
      <Stack>
        {header.map((col, idx) => (
          <Select
            key={idx}
            label={normalizeHeaderName(col)}
            placeholder={`Pilih nilai untuk ${normalizeHeaderName(col)}`}
            data={generateFilterOptions(allRows, idx)}
            value={tempFilters[idx] || ''}
            onChange={val => {
              setTempFilters(prev => ({ ...prev, [idx]: val || '' }));
            }}
            clearable
          />
        ))}
        <Group position="right">
          <Button size="sm" onClick={handleApply}>
            Terapkan
          </Button>
          <Button size="sm" variant="outline" color="red" onClick={handleReset}>
            Reset
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}