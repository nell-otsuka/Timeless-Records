import { useCallback, useMemo } from 'react';
import { useTrackerContext } from '@/context/TrackerDataContext';
import { summarizeCities } from '@/lib/cities';
import { attachScreenings } from '@/lib/movies';
import { groupScreeningsByCity, type ScreeningAnnotation } from '@/lib/screenings';
import { describeSync } from '@/lib/sync';
import { conflictsForSlot, describeConflict, isScreeningBooked, screeningToDraft, screeningToNewTicket } from '@/lib/tickets';
import { splitTickets } from '@/lib/ticketViews';
import type { MovieChange, NewMovie, Screening } from '@/types/movie';
import { useDisclosure } from './useDisclosure';
import { useMovieSearch } from './useMovieSearch';
import { useNow } from './useNow';
import { useSelection } from './useSelection';
import { useTicketEditor } from './useTicketEditor';

/** Composes every piece of state the finder tab needs, so the page itself stays presentational. */
export function useMovieTracker() {
  const { tracker: data, tickets } = useTrackerContext();
  const now = useNow();

  const addModal = useDisclosure();
  const citiesModal = useDisclosure();
  const removeModal = useDisclosure();
  const editModal = useDisclosure();

  // the finder is for what is still to pick: a screening you hold a ticket for, or already planned, is not shown
  const unbooked = useMemo(() => data.screenings.filter((s) => !isScreeningBooked(s, tickets.everything)), [data.screenings, tickets.everything]);
  const entries = useMemo(() => attachScreenings(data.movies, unbooked, now), [data.movies, unbooked, now]);
  const search = useMovieSearch(entries);
  const selection = useSelection(entries);
  const { selected, select } = selection;

  const editor = useTicketEditor(tickets.saveTicket);
  const upcomingTickets = useMemo(() => splitTickets(tickets.tickets, now).upcoming, [tickets.tickets, now]);

  /** For each screening: do I already hold a ticket for it, and would booking it clash with another? */
  const annotate = useCallback(
    (screening: Screening): ScreeningAnnotation => {
      const [first] = conflictsForSlot(
        { startsAt: screening.startsAt, cinemaId: screening.cinemaId },
        upcomingTickets,
      );
      return { conflict: first && { text: describeConflict(first) } };
    },
    [upcomingTickets],
  );

  const groups = useMemo(
    () => (selected ? groupScreeningsByCity(selected.screenings, data.cinemasById, now, annotate) : []),
    [selected, data.cinemasById, now, annotate],
  );

  /** "I booked this": opens the ticket form pre-filled from the screening. */
  const { openNew } = editor;
  const bookScreening = useCallback(
    (screeningId: string) => {
      const screening = selected?.screenings.find((s) => s.id === screeningId);
      if (!selected || !screening) return;
      openNew(screeningToDraft({ screening, movie: selected, cinema: data.cinemasById[screening.cinemaId] }));
    },
    [selected, data.cinemasById, openNew],
  );

  /** "plan it": puts the screening on the planner as a tentative ticket. */
  const { saveTicket } = tickets;
  const planScreening = useCallback(
    (screeningId: string) => {
      const screening = selected?.screenings.find((s) => s.id === screeningId);
      if (!selected || !screening) return;
      void saveTicket(screeningToNewTicket({ screening, movie: selected, cinema: data.cinemasById[screening.cinemaId] }, 'tentative'));
    },
    [selected, data.cinemasById, saveTicket],
  );

  const { addMovie, updateMovie, deleteMovie, saveCities } = data;
  const { close: closeEdit } = editModal;
  const { close: closeAdd } = addModal;
  const { close: closeCities } = citiesModal;
  const { close: closeRemove } = removeModal;

  const submitMovie = useCallback(
    async (input: NewMovie) => {
      const movie = await addMovie(input);
      select(movie.id);
      closeAdd();
    },
    [addMovie, select, closeAdd],
  );

  const submitEdit = useCallback(
    async (change: MovieChange) => {
      if (!selected) return;
      await updateMovie(selected.id, change);
      closeEdit();
    },
    [selected, updateMovie, closeEdit],
  );

  const removeSelected = useCallback(async () => {
    if (!selected) return;
    await deleteMovie(selected.id);
    closeRemove();
  }, [selected, deleteMovie, closeRemove]);

  const submitCities = useCallback(
    async (cityIds: number[]) => {
      await saveCities(cityIds);
      closeCities();
    },
    [saveCities, closeCities],
  );

  return {
    status: data.status,
    reload: data.reload,
    movies: search.results,
    search: { query: search.query, onChange: search.setQuery },
    selected,
    groups,
    select,
    clearSelection: selection.clear,
    sync: { label: describeSync(data.sync, now), refresh: data.refresh },
    cities: {
      label: summarizeCities(data.selectedCityIds, data.cities),
      options: data.cities,
      selectedIds: data.selectedCityIds,
      modal: citiesModal,
      save: submitCities,
    },
    add: { modal: addModal, submit: submitMovie },
    edit: { modal: editModal, submit: submitEdit },
    remove: { modal: removeModal, confirm: removeSelected },
    booking: {
      book: bookScreening,
      plan: planScreening,
      editor,
      catalog: { movies: data.movies, cinemas: data.cinemas, tickets: tickets.tickets },
    },
  };
}
