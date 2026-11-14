import type { Cinema, Movie, Screening, Ticket } from '@/types/movie';
import { dayParts, formatTime } from './screenings';
import { conflictsForSlot, isScreeningBooked, slotInterval, type Conflict } from './tickets';
import { describeDayDistance } from './ticketViews';

/** booked: you hold the ticket. tentative: on your planner. free: a screening you could still pick. */
export type PlannerState = 'booked' | 'tentative' | 'free';

export interface PlannerClash {
  title: string;
  /** Collides with a ticket you hold, not just with one you are considering. */
  hard: boolean;
}

export interface PlannerEntry {
  key: string;
  state: PlannerState;
  title: string;
  coverUrl?: string;
  startsAt: string;
  endsAt?: string;
  /** "21:00 - 23:51" */
  span: string;
  cinemaName: string;
  /** Set for booked and tentative entries: the ticket behind them. */
  ticketId?: string;
  /** Set for free entries: the finder screening. */
  screening?: Screening;
  clashes: PlannerClash[];
}

export interface PlannerDay {
  key: string;
  weekday: string;
  day: string;
  month: string;
  relative: string;
  entries: PlannerEntry[];
}

interface Catalog {
  /** Booked and tentative tickets together. */
  tickets: Ticket[];
  screenings: Screening[];
  movies: Movie[];
  cinemas: Cinema[];
}

const toClashes = (conflicts: Conflict[]): PlannerClash[] =>
  conflicts.map(({ other }) => ({ title: other.title, hard: other.status === 'booked' }));

const span = (startsAt: string, endsAt?: string) => (endsAt ? `${formatTime(startsAt)} - ${formatTime(endsAt)}` : formatTime(startsAt));

const byStart = (a: PlannerEntry, b: PlannerEntry) => a.startsAt.localeCompare(b.startsAt) || a.title.localeCompare(b.title, 'fr');

/**
 * Everything that is still to come, on one timeline: the tickets you hold, the ones you are considering, and every
 * finder screening you could still take, each with what it clashes with.
 */
export const buildPlannerEntries = ({ tickets, screenings, movies, cinemas }: Catalog, now: Date): PlannerEntry[] => {
  const movieById = new Map(movies.map((m) => [m.id, m]));
  const cinemaById = new Map(cinemas.map((c) => [c.id, c]));
  const stillToCome = (slot: { startsAt: string; endsAt?: string }) => slotInterval(slot).end > now.getTime();
  const entries: PlannerEntry[] = [];

  for (const ticket of tickets.filter(stillToCome)) {
    entries.push({
      key: `ticket-${ticket.id}`,
      state: ticket.status,
      title: ticket.title,
      coverUrl: ticket.coverUrl,
      startsAt: ticket.startsAt,
      endsAt: ticket.endsAt,
      span: span(ticket.startsAt, ticket.endsAt),
      cinemaName: ticket.cinemaName,
      ticketId: ticket.id,
      // what you hold is settled; what you are only considering shows what it would clash with
      clashes: ticket.status === 'tentative' ? toClashes(conflictsForSlot(ticket, tickets, ticket.id)) : [],
    });
  }

  for (const screening of screenings) {
    const movie = movieById.get(screening.movieId);
    const cinema = cinemaById.get(screening.cinemaId);
    if (!movie || !cinema || !stillToCome(screening) || isScreeningBooked(screening, tickets)) continue;
    entries.push({
      key: `screening-${screening.id}`,
      state: 'free',
      title: movie.title,
      coverUrl: movie.coverUrl,
      startsAt: screening.startsAt,
      endsAt: screening.endsAt,
      span: span(screening.startsAt, screening.endsAt),
      cinemaName: cinema.name,
      screening,
      clashes: toClashes(conflictsForSlot(screening, tickets)),
    });
  }

  return entries.sort(byStart);
};

interface Filter {
  query: string;
  /** Leave out the screenings that clash with something. */
  hideClashes: boolean;
}

export const filterPlanner = (entries: PlannerEntry[], { query, hideClashes }: Filter): PlannerEntry[] => {
  const needle = query.trim().toLowerCase();
  return entries.filter(
    (entry) =>
      (!needle || `${entry.title} ${entry.cinemaName}`.toLowerCase().includes(needle)) &&
      !(hideClashes && entry.state === 'free' && entry.clashes.length > 0),
  );
};

/** One group per calendar day, in the order the entries come. */
export const groupPlannerByDay = (entries: PlannerEntry[], now: Date): PlannerDay[] => {
  const days = new Map<string, PlannerDay>();
  for (const entry of entries) {
    const key = entry.startsAt.slice(0, 10);
    const day = days.get(key) ?? { key, ...dayParts(entry.startsAt), relative: describeDayDistance(entry.startsAt, now), entries: [] };
    day.entries.push(entry);
    days.set(key, day);
  }
  return [...days.values()];
};

export const summarizePlanner = (entries: PlannerEntry[]): { booked: number; tentative: number; free: number } => ({
  booked: entries.filter((e) => e.state === 'booked').length,
  tentative: entries.filter((e) => e.state === 'tentative').length,
  free: entries.filter((e) => e.state === 'free').length,
});

