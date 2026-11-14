import { useEffect, useState } from 'react';

/** The current time, refreshed on an interval so "past" screenings and "x min ago" labels stay accurate. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
