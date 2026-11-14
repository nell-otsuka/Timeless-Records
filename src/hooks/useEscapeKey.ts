import { useEffect } from 'react';

/**
 * Calls `handler` when Escape is pressed, except while a dialog is open:
 * a native <dialog> already uses Escape to close itself, and that must not also close the panel behind it.
 */
export function useEscapeKey(handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) handler();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handler, enabled]);
}
