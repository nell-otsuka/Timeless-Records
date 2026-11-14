import { useCallback, useMemo, useState } from 'react';
import { useDisclosure } from './useDisclosure';
import { useTrackerContext } from '@/context/TrackerDataContext';
import { buildPlannerEntries, filterPlanner, groupPlannerByDay, summarizePlanner, type PlannerEntry } from '@/lib/planner';
import { screeningToNewTicket, ticketToNewTicket } from '@/lib/tickets';
import { useAsyncAction } from './useAsyncAction';
import { useNow } from './useNow';

/**
 * Everything the planner tab needs. The planner is where the finder meets the tickets: it lists the finder's screenings
 * next to your tickets, and choosing one turns it into a tentative ticket, then a booked one.
 */
export function usePlannerPage() {
  const { tracker, tickets } = useTrackerContext();
  const now = useNow();
  const [query, setQuery] = useState('');
  const [hideClashes, setHideClashes] = useState(false);
  const deleteModal = useDisclosure();
  const [toDelete, setToDelete] = useState<PlannerEntry | null>(null);

  const entries = useMemo(
    () =>
      buildPlannerEntries(
        { tickets: tickets.everything, screenings: tracker.screenings, movies: tracker.movies, cinemas: tracker.cinemas },
        now,
      ),
    [tickets.everything, tracker.screenings, tracker.movies, tracker.cinemas, now],
  );
  const summary = useMemo(() => summarizePlanner(entries), [entries]);
  const days = useMemo(() => groupPlannerByDay(filterPlanner(entries, { query, hideClashes }), now), [entries, query, hideClashes, now]);

  const change = useAsyncAction(async (task: () => Promise<unknown>) => void (await task()));
  const { run } = change;
  const { saveTicket, deleteTicket, everything } = tickets;
  const { movies, cinemasById } = tracker;

  const plan = useCallback(
    (entry: PlannerEntry) => {
      const { screening } = entry;
      const movie = movies.find((m) => m.id === screening?.movieId);
      if (!screening || !movie) return;
      void run(() => saveTicket(screeningToNewTicket({ screening, movie, cinema: cinemasById[screening.cinemaId] }, 'tentative')));
    },
    [movies, cinemasById, saveTicket, run],
  );

  const unplan = useCallback(
    (entry: PlannerEntry) => {
      const { ticketId } = entry;
      if (ticketId) void run(() => deleteTicket(ticketId));
    },
    [deleteTicket, run],
  );

  const book = useCallback(
    (entry: PlannerEntry) => {
      const ticket = everything.find((t) => t.id === entry.ticketId);
      if (ticket) void run(() => saveTicket(ticketToNewTicket(ticket, { status: 'booked' }), { id: ticket.id }));
    },
    [everything, saveTicket, run],
  );

  /** Deleting a ticket you hold asks first; dropping a tentative one does not. */
  const { open: openDelete, close: closeDelete } = deleteModal;
  const askDelete = useCallback(
    (entry: PlannerEntry) => {
      setToDelete(entry);
      openDelete();
    },
    [openDelete],
  );
  const confirmDelete = useCallback(async () => {
    if (!toDelete?.ticketId) return;
    await deleteTicket(toDelete.ticketId);
    closeDelete();
  }, [toDelete, deleteTicket, closeDelete]);

  return {
    status: tickets.status === 'error' || tracker.status === 'error' ? ('error' as const) : ('ready' as const),
    reload: () => {
      void tickets.reload();
      void tracker.reload();
    },
    search: { query, onChange: setQuery },
    hideClashes: { value: hideClashes, toggle: () => setHideClashes((current) => !current) },
    summary,
    days,
    hasEntries: entries.length > 0,
    busy: change.pending,
    error: change.error,
    plan,
    unplan,
    book,
    remove: { modal: deleteModal, target: toDelete, ask: askDelete, confirm: confirmDelete },
  };
}
