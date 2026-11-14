import { useCallback, useState } from 'react';

/** Wraps an async action with pending/error state, so forms and dialogs do not each reinvent it. */
export function useAsyncAction<Args extends unknown[]>(action: (...args: Args) => Promise<void>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Resolves to true on success, false on failure (the message is then in `error`). */
  const run = useCallback(
    async (...args: Args): Promise<boolean> => {
      setPending(true);
      setError(null);
      try {
        await action(...args);
        return true;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'something went wrong');
        return false;
      } finally {
        setPending(false);
      }
    },
    [action],
  );

  const clearError = useCallback(() => setError(null), []);

  return { run, pending, error, clearError };
}
