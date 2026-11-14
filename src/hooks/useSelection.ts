import { useCallback, useMemo, useState } from 'react';
import { useEscapeKey } from './useEscapeKey';

/** Which item is open in a detail panel. Escape closes it. */
export function useSelection<T extends { id: string }>(items: T[]) {
  const [selectedId, select] = useState<string | null>(null);
  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId]);

  const clear = useCallback(() => select(null), []);
  useEscapeKey(clear, selected !== null);

  return { selected, select, clear };
}
