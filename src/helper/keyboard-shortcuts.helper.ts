/**
 * Keyboard shortcuts utilities
 */
import { useEffect } from "react";

/**
 * Hook for handling keyboard shortcuts
 */
export function useKeyboardShortcut(
  keys: { ctrl?: boolean; meta?: boolean; key: string },
  callback: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const ctrlPressed = keys.ctrl && (e.ctrlKey || e.metaKey);
      const metaPressed = keys.meta && (e.ctrlKey || e.metaKey);
      const keyPressed = e.key.toLowerCase() === keys.key.toLowerCase();

      if ((ctrlPressed || metaPressed) && keyPressed) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keys.ctrl, keys.meta, keys.key, callback, enabled]);
}

/**
 * Hook for focus search bar with Ctrl+F
 */
export function useFocusSearchShortcut(
  searchInputRef: React.RefObject<HTMLInputElement>,
  enabled = true
) {
  useKeyboardShortcut(
    { ctrl: true, key: 'f' },
    () => {
      searchInputRef.current?.focus();
    },
    enabled
  );
}

/**
 * Focus element after delay (for drawer open animation)
 */
export function focusElementAfterDelay(
  elementRef: React.RefObject<HTMLElement>,
  delay = 220
) {
  const timer = setTimeout(() => {
    elementRef.current?.focus();
  }, delay);
  
  return () => clearTimeout(timer);
}