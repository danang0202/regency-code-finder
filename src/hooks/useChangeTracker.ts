import { useState, useCallback } from 'react';

export function useChangeTracker() {
  const [hasChanges, setHasChanges] = useState(false);

  const markAsChanged = useCallback(() => {
    setHasChanges(true);
  }, []);

  const markAsSaved = useCallback(() => {
    setHasChanges(false);
  }, []);

  const reset = useCallback(() => {
    setHasChanges(false);
  }, []);

  return {
    hasChanges,
    markAsChanged,
    markAsSaved,
    reset
  };
}