import { useCallback, useMemo, useState } from 'react';
import { useTrackerContext } from '@/context/TrackerDataContext';
import { conflictsByTicket, describeConflict, ticketImageUrl } from '@/lib/tickets';
import { describeCountdown, groupTicketsByDay, matchesTicketQuery, splitTickets, ticketFacts, GALLERY_COLUMNS, nextGalleryColumns, toGalleryTiles, toNextUp } from '@/lib/ticketViews';
import type { TicketsView } from '@/components/tickets/ViewDock';
import { useDisclosure } from './useDisclosure';
import { useNow } from './useNow';
import { useSelection } from './useSelection';
import { useTicketEditor } from './useTicketEditor';

/** Everything the tickets tab needs, composed from small pieces so the page stays presentational. */
export function useTicketsPage() {
  const { tracker, tickets } = useTrackerContext();
  const now = useNow();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<TicketsView>('list');
  const [showTentative, setShowTentative] = useState(false);
  const [columns, setColumns] = useState<number>(GALLERY_COLUMNS.initial);
  const removeModal = useDisclosure();
  const fileModal = useDisclosure();

  // tentative tickets (from the planner) only show when asked for
  const all = showTentative ? tickets.everything : tickets.tickets;
  const selection = useSelection(all);
  const { select, selected } = selection;
  const editor = useTicketEditor(tickets.saveTicket, (saved) => select(saved.id));

  // clashes are computed against every upcoming ticket, not only the ones the search shows
  const upcomingAll = useMemo(() => splitTickets(all, now).upcoming, [all, now]);
  const conflicts = useMemo(() => conflictsByTicket(upcomingAll), [upcomingAll]);

  const filtered = useMemo(() => all.filter((ticket) => matchesTicketQuery(ticket, query)), [all, query]);
  const { upcoming, past } = useMemo(() => splitTickets(filtered, now), [filtered, now]);

  // the next ticket gets its own block above the agenda, unless a search is narrowing the list
  const searching = query.trim() !== '';
  const nextTicket = searching ? null : (upcoming.find((ticket) => ticket.status === 'booked') ?? null);
  const nextUp = useMemo(() => nextTicket && toNextUp(nextTicket, conflicts.get(nextTicket.id), now), [nextTicket, conflicts, now]);
  const agenda = useMemo(() => upcoming.filter((ticket) => ticket.id !== nextTicket?.id), [nextTicket, upcoming]);

  const groups = useMemo(() => groupTicketsByDay(agenda, conflicts, now), [agenda, conflicts, now]);
  const tiles = useMemo(() => toGalleryTiles(filtered, now), [filtered, now]);
  const pastGroups = useMemo(() => groupTicketsByDay(past, new Map(), now, { past: true }), [past, now]);

  const isPast = selected ? !upcomingAll.some((ticket) => ticket.id === selected.id) : false;
  const panel = selected && {
    facts: ticketFacts(selected, now),
    conflicts: (conflicts.get(selected.id) ?? []).map((conflict) => ({ text: describeConflict(conflict) })),
    countdown: isPast ? '' : describeCountdown(selected.startsAt, now),
  };

  const { deleteTicket } = tickets;
  const { close: closeRemove } = removeModal;
  const removeSelected = useCallback(async () => {
    if (!selected) return;
    await deleteTicket(selected.id);
    closeRemove();
  }, [selected, deleteTicket, closeRemove]);

  const { open: openFile } = fileModal;
  const showFileFor = useCallback(
    (id: string) => {
      select(id);
      openFile();
    },
    [select, openFile],
  );

  return {
    status: tickets.status,
    reload: tickets.reload,
    search: { query, onChange: setQuery },
    view: { value: view, set: setView },
    tentative: { shown: showTentative, count: tickets.planned.length, toggle: () => setShowTentative((current) => !current) },
    tiles,
    columns: { value: columns, cycle: () => setColumns(nextGalleryColumns) },
    hasTickets: all.length > 0,
    searching,
    nextUp,
    groups,
    pastGroups,
    selected,
    panel,
    select,
    clearSelection: selection.clear,
    showFileFor,
    editor,
    catalog: { movies: tracker.movies, cinemas: tracker.cinemas, tickets: all },
    fileModal,
    remove: { modal: removeModal, confirm: removeSelected },
    fileUrl: selected ? ticketImageUrl(selected) : null,
  };
}
