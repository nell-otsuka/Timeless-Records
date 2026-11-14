import { createContext, useContext, type ReactNode } from 'react';
import { useTicketData } from '@/hooks/useTicketData';
import { useTrackerData } from '@/hooks/useTrackerData';

interface TrackerData {
  /** Watch list, cinemas, screenings, cities and sync status (the finder's data). */
  tracker: ReturnType<typeof useTrackerData>;
  /** The user's booked tickets. */
  tickets: ReturnType<typeof useTicketData>;
}

const TrackerDataContext = createContext<TrackerData | null>(null);

/** Loads everything once, so switching tabs is instant and both tabs see the same data. */
export function TrackerDataProvider({ children }: { children: ReactNode }) {
  const tracker = useTrackerData();
  const tickets = useTicketData();
  return <TrackerDataContext.Provider value={{ tracker, tickets }}>{children}</TrackerDataContext.Provider>;
}

export function useTrackerContext(): TrackerData {
  const value = useContext(TrackerDataContext);
  if (!value) throw new Error('useTrackerContext must be used inside <TrackerDataProvider>');
  return value;
}
