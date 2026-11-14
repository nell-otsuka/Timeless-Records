import type { Ticket } from '@/types/movie';
import type { Fact, NextUpModel, TicketDayGroup, TicketRowModel, TicketTileModel } from '@/types/view-models';
import { dayParts, daysBetween, formatTime, getDayBadge } from './screenings';
import { describeConflict, slotInterval, type Conflict } from './tickets';

const byStart = (a: Ticket, b: Ticket) => a.startsAt.localeCompare(b.startsAt);

/** Upcoming = not over yet (a film that is playing right now still counts). Past tickets, newest first. */
export const splitTickets = (tickets: Ticket[], now: Date): { upcoming: Ticket[]; past: Ticket[] } => {
  const upcoming: Ticket[] = [];
  const past: Ticket[] = [];
  for (const ticket of tickets) (slotInterval(ticket).end > now.getTime() ? upcoming : past).push(ticket);
  return { upcoming: upcoming.sort(byStart), past: past.sort((a, b) => byStart(b, a)) };
};

export const GALLERY_COLUMNS = { min: 2, max: 6, initial: 4 } as const;

/** The next column count when the key is pressed: one more, and back to the fewest after the most. */
export const nextGalleryColumns = (current: number): number => (current >= GALLERY_COLUMNS.max ? GALLERY_COLUMNS.min : current + 1);

/** The gallery's posters: what is still to come first, in order, then what has passed, dimmed. */
export const toGalleryTiles = (tickets: Ticket[], now: Date): TicketTileModel[] => {
  const { upcoming, past } = splitTickets(tickets, now);
  const tile = (ticket: Ticket, isPast: boolean): TicketTileModel => ({ id: ticket.id, title: ticket.title, coverUrl: ticket.coverUrl, past: isPast });
  return [...upcoming.map((t) => tile(t, false)), ...[...past].reverse().map((t) => tile(t, true))];
};

export const matchesTicketQuery = (ticket: Ticket, query: string): boolean => {
  const needle = query.trim().toLowerCase();
  return !needle || `${ticket.title} ${ticket.cinemaName}`.toLowerCase().includes(needle);
};

/** "today · 11 nov", "tomorrow · 12 nov", "sat 14 nov". */
export const formatDayLabel = (startsAt: string, now: Date): string => {
  const { caption, day, month } = getDayBadge(startsAt, now);
  if (caption === 'today') return `today · ${day} ${month}`;
  if (caption === 'tmrw') return `tomorrow · ${day} ${month}`;
  return `${caption} ${day} ${month}`;
};

export const describeCountdown = (startsAt: string, now: Date): string => {
  const minutes = Math.round((new Date(startsAt).getTime() - now.getTime()) / 60_000);
  if (minutes <= 0) return 'now playing';
  if (minutes < 60) return `in ${minutes} min`;
  const days = daysBetween(now, new Date(startsAt));
  if (days === 0) return `today at ${formatTime(startsAt)}`;
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
};

/** How far a day is from today, for the agenda headings: "today", "in 3 days", "yesterday". */
export const describeDayDistance = (startsAt: string, now: Date): string => {
  const days = daysBetween(now, new Date(startsAt));
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
};

/** Seats already say how many people it is for, so the number of places is only shown when there are no seats. */
const seating = (ticket: Ticket): string | undefined =>
  ticket.seats ? `seats ${ticket.seats}` : ticket.places ? `${ticket.places} place${ticket.places > 1 ? 's' : ''}` : undefined;

const details = (ticket: Ticket) => [ticket.room, seating(ticket)].filter(Boolean).join(' · ');

interface RowOptions {
  conflicts?: Conflict[];
  past?: boolean;
}

export const toTicketRow = (ticket: Ticket, { conflicts = [], past = false }: RowOptions = {}): TicketRowModel => ({
  id: ticket.id,
  title: ticket.title,
  coverUrl: ticket.coverUrl,
  time: formatTime(ticket.startsAt),
  cinemaName: ticket.cinemaName,
  details: details(ticket),
  hasImage: Boolean(ticket.image),
  past,
  tentative: ticket.status === 'tentative',
  conflicts: conflicts.map((conflict) => ({ text: describeConflict(conflict) })),
});

/** One group per calendar day, in the order the tickets are given (so sort them first). */
export const groupTicketsByDay = (
  tickets: Ticket[],
  conflicts: Map<string, Conflict[]>,
  now: Date,
  { past = false }: { past?: boolean } = {},
): TicketDayGroup[] => {
  const groups = new Map<string, TicketDayGroup>();
  for (const ticket of tickets) {
    const key = ticket.startsAt.slice(0, 10);
    const group = groups.get(key) ?? { key, ...dayParts(ticket.startsAt), relative: describeDayDistance(ticket.startsAt, now), rows: [] };
    group.rows.push(toTicketRow(ticket, { conflicts: conflicts.get(ticket.id), past }));
    groups.set(key, group);
  }
  return [...groups.values()];
};

export const toNextUp = (ticket: Ticket, conflicts: Conflict[] | undefined, now: Date): NextUpModel => ({
  row: toTicketRow(ticket, { conflicts }),
  countdown: describeCountdown(ticket.startsAt, now),
  when: formatDayLabel(ticket.startsAt, now),
});

/** The key facts shown in the ticket panel. */
export const ticketFacts = (ticket: Ticket, now: Date): Fact[] => {
  const facts: Fact[] = [
    { label: 'when:', value: `${formatDayLabel(ticket.startsAt, now)} · ${formatTime(ticket.startsAt)}` },
    { label: 'cinema:', value: ticket.cinemaName },
  ];
  if (ticket.room) facts.push({ label: 'room:', value: ticket.room });
  if (ticket.seats) facts.push({ label: 'seats:', value: ticket.seats });
  else if (ticket.places) facts.push({ label: 'places:', value: String(ticket.places) });
  if (ticket.endsAt) facts.push({ label: 'ends:', value: formatTime(ticket.endsAt) });
  return facts;
};
