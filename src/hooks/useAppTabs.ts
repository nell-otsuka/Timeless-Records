import { useMemo } from 'react';
import { useTrackerContext } from '@/context/TrackerDataContext';
import { splitTickets } from '@/lib/ticketViews';
import { useNow } from './useNow';

export interface AppTab {
  to: string;
  label: string;
  /** A count shown next to the label. */
  badge?: number;
}

/** The app's top-level tabs: the finder, the planner (with what is tentative) and the tickets (with what is coming up). */
export function useAppTabs(): AppTab[] {
  const { tickets } = useTrackerContext();
  const now = useNow();

  return useMemo(
    () => [
      { to: '/', label: 'finder' },
      { to: '/planner', label: 'planner', badge: tickets.planned.length || undefined },
      { to: '/tickets', label: 'tickets', badge: splitTickets(tickets.tickets, now).upcoming.length || undefined },
    ],
    [tickets.tickets, tickets.planned.length, now],
  );
}
