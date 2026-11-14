import type { Cinema, Movie, NewTicket, Screening, Ticket, TicketDraft, TicketDraftErrors } from '@/types/movie';
import { formatTime } from './screenings';

/* ------------------------------------------------------------------ overlap detection */

/** How long a screening is assumed to last when its end time is unknown (a typical film plus the ads). */
export const DEFAULT_DURATION_MINUTES = 135;
const MINUTE = 60_000;

/** Anything that occupies a time slot in a cinema: a ticket, or a screening you are about to book. */
export interface Slot {
  startsAt: string;
  /** The end time printed on the ticket, when known. */
  endsAt?: string;
  cinemaId?: string;
  cinemaName?: string;
}

export const slotInterval = (slot: Slot): { start: number; end: number } => {
  const start = new Date(slot.startsAt).getTime();
  const end = slot.endsAt ? new Date(slot.endsAt).getTime() : start + DEFAULT_DURATION_MINUTES * MINUTE;
  return { start, end };
};

const normalize = (value: string | undefined) => (value ?? '').trim().toLowerCase();

/** How a slot clashes with one ticket (`other`): the two really overlap in time. A short gap between them is not a clash. */
export interface Conflict {
  other: Ticket;
  /** Is `other` before or after the slot? */
  position: 'before' | 'after';
  /** Minutes of overlap. */
  minutes: number;
}

const compare = (slot: Slot, other: Ticket): Conflict | null => {
  const a = slotInterval(slot);
  const b = slotInterval(other);
  if (Number.isNaN(a.start) || Number.isNaN(b.start)) return null;

  if (a.start < b.end && b.start < a.end) {
    const overlap = (Math.min(a.end, b.end) - Math.max(a.start, b.start)) / MINUTE;
    return { other, position: b.start < a.start ? 'before' : 'after', minutes: Math.round(overlap) };
  }
  return null;
};

/** Every ticket that clashes with this slot, chronologically. */
export const conflictsForSlot = (slot: Slot, tickets: Ticket[], ignoreId?: string): Conflict[] =>
  tickets
    .filter((ticket) => ticket.id !== ignoreId)
    .map((ticket) => compare(slot, ticket))
    .filter((conflict): conflict is Conflict => conflict !== null)
    .sort((a, b) => a.other.startsAt.localeCompare(b.other.startsAt));

/** For each ticket, the tickets it clashes with. Tickets without a clash are absent. */
export const conflictsByTicket = (tickets: Ticket[]): Map<string, Conflict[]> => {
  const byTicket = new Map<string, Conflict[]>();
  for (const ticket of tickets) {
    const conflicts = conflictsForSlot(ticket, tickets, ticket.id);
    if (conflicts.length > 0) byTicket.set(ticket.id, conflicts);
  }
  return byTicket;
};

export const describeConflict = ({ other }: Conflict): string => `overlaps ${other.title} (${formatTime(other.startsAt)})`;

/** A finder screening you already hold a ticket for (linked, or the same movie, cinema and time). */
export const isScreeningBooked = (screening: Screening, tickets: Ticket[]): boolean =>
  tickets.some(
    (ticket) =>
      ticket.screeningId === screening.id ||
      (ticket.movieId === screening.movieId &&
        ticket.cinemaId === screening.cinemaId &&
        ticket.startsAt.slice(0, 16) === screening.startsAt.slice(0, 16)),
  );

/* ------------------------------------------------------------------ form drafts */

export const EMPTY_TICKET_DRAFT: TicketDraft = {
  title: '',
  startsAt: '',
  cinemaName: '',
  endsTime: '',
  room: '',
  seats: '',
  places: '',
  movieId: '',
  cinemaId: '',
  coverUrl: '',
  screeningId: '',
};

const isWholeNumber = (value: string, min: number, max: number) =>
  Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
const pad = (n: number) => String(n).padStart(2, '0');
const nextDay = (date: string): string => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * The full end date-time from the start and the time of day printed on the ticket. A film that ends "before" it
 * starts ends after midnight. Undefined while either is missing, or when the result is not a plausible length.
 */
export const endsAtOf = (draft: Pick<TicketDraft, 'startsAt' | 'endsTime'>): string | undefined => {
  if (!/^\d{2}:\d{2}$/.test(draft.endsTime) || draft.startsAt.length < 16) return undefined;
  const date = draft.startsAt.slice(0, 10);
  const sameDay = `${date}T${draft.endsTime}`;
  const endsAt = `${sameDay > draft.startsAt.slice(0, 16) ? date : nextDay(date)}T${draft.endsTime}:00`;
  const minutes = (new Date(endsAt).getTime() - new Date(draft.startsAt).getTime()) / MINUTE;
  return minutes > 0 && minutes <= 12 * 60 ? endsAt : undefined;
};

const optional = (value: string): string | undefined => value.trim() || undefined;
const optionalInt = (value: string): number | undefined => (value.trim() ? Number(value) : undefined);

export const validateTicketDraft = (draft: TicketDraft): TicketDraftErrors => {
  const errors: TicketDraftErrors = {};
  if (!draft.title.trim()) errors.title = 'enter the movie title';
  if (!draft.cinemaName.trim()) errors.cinemaName = 'enter the cinema';

  if (!draft.startsAt) errors.startsAt = 'pick the date and time';
  else if (Number.isNaN(new Date(draft.startsAt).getTime())) errors.startsAt = 'that is not a valid date';

  if (draft.endsTime && !endsAtOf(draft)) errors.endsTime = 'check the end time';
  const places = draft.places.trim();
  if (places && !isWholeNumber(places, 1, 50)) errors.places = 'enter a number of places';
  return errors;
};

const findLinks = (draft: TicketDraft, movies: Movie[], cinemas: Cinema[]) => {
  const title = normalize(draft.title);
  const cinemaName = normalize(draft.cinemaName);
  return {
    // a carried-over id only counts while the typed name still matches it
    movie: movies.find((m) => m.id === draft.movieId && normalize(m.title) === title) ?? movies.find((m) => normalize(m.title) === title),
    cinema: cinemas.find((c) => c.id === draft.cinemaId && normalize(c.name) === cinemaName) ?? cinemas.find((c) => normalize(c.name) === cinemaName),
  };
};

interface Catalog {
  movies: Movie[];
  cinemas: Cinema[];
}

/** The poster a draft shows and saves: its own, else the linked watch-list movie's. */
export const draftCover = (draft: TicketDraft, { movies, cinemas }: Catalog): string | undefined =>
  optional(draft.coverUrl) ?? findLinks(draft, movies, cinemas).movie?.coverUrl;

/** Turns a validated draft into the API payload, linking it to a watch-list movie and a known cinema by name. */
export const draftToNewTicket = (draft: TicketDraft, { movies, cinemas }: Catalog): NewTicket => {
  const { movie, cinema } = findLinks(draft, movies, cinemas);
  return {
    title: draft.title.trim(),
    cinemaName: draft.cinemaName.trim(),
    startsAt: draft.startsAt.length === 16 ? `${draft.startsAt}:00` : draft.startsAt,
    movieId: movie?.id,
    cinemaId: cinema?.id,
    coverUrl: draftCover(draft, { movies, cinemas }),
    endsAt: endsAtOf(draft),
    room: optional(draft.room),
    seats: optional(draft.seats),
    places: optionalInt(draft.places),
    screeningId: optional(draft.screeningId),
  };
};

/** A ticket as the API wants it back, e.g. to change only its status. */
export const ticketToNewTicket = (ticket: Ticket, patch: Partial<NewTicket> = {}): NewTicket => ({
  title: ticket.title,
  cinemaName: ticket.cinemaName,
  cinemaId: ticket.cinemaId,
  startsAt: ticket.startsAt,
  endsAt: ticket.endsAt,
  room: ticket.room,
  seats: ticket.seats,
  places: ticket.places,
  movieId: ticket.movieId,
  coverUrl: ticket.coverUrl,
  screeningId: ticket.screeningId,
  status: ticket.status,
  ...patch,
});

/** A finder screening as a ticket: "tentative" puts it on the planner, "booked" says you hold it. */
export const screeningToNewTicket = (
  { screening, movie, cinema }: { screening: Screening; movie: Movie; cinema?: Cinema },
  status: NewTicket['status'],
): NewTicket => ({
  title: movie.title,
  cinemaName: cinema?.name ?? 'cinema',
  cinemaId: screening.cinemaId,
  startsAt: screening.startsAt,
  endsAt: screening.endsAt,
  room: screening.room,
  movieId: movie.id,
  coverUrl: movie.coverUrl,
  screeningId: screening.id,
  status,
});

export const ticketToDraft = (ticket: Ticket): TicketDraft => ({
  title: ticket.title,
  startsAt: ticket.startsAt.slice(0, 16),
  cinemaName: ticket.cinemaName,
  endsTime: ticket.endsAt?.slice(11, 16) ?? '',
  room: ticket.room ?? '',
  seats: ticket.seats ?? '',
  places: ticket.places?.toString() ?? '',
  movieId: ticket.movieId ?? '',
  cinemaId: ticket.cinemaId ?? '',
  coverUrl: ticket.coverUrl ?? '',
  screeningId: ticket.screeningId ?? '',
});

/** "I booked this": pre-fills the ticket form from a finder screening. */
export const screeningToDraft = ({ screening, movie, cinema }: { screening: Screening; movie: Movie; cinema?: Cinema }): TicketDraft => ({
  ...EMPTY_TICKET_DRAFT,
  title: movie.title,
  startsAt: screening.startsAt.slice(0, 16),
  cinemaName: cinema?.name ?? '',
  room: screening.room ?? '',
  movieId: movie.id,
  cinemaId: screening.cinemaId,
  coverUrl: movie.coverUrl ?? '',
  screeningId: screening.id,
});

/** The time slot a draft would occupy, for live clash warnings. Null until the date is valid. */
export const draftSlot = (draft: TicketDraft, catalog: Catalog): Slot | null => {
  if (!draft.startsAt || Number.isNaN(new Date(draft.startsAt).getTime())) return null;
  const { cinema } = findLinks(draft, catalog.movies, catalog.cinemas);
  return {
    startsAt: draft.startsAt.length === 16 ? `${draft.startsAt}:00` : draft.startsAt,
    endsAt: endsAtOf(draft),
    cinemaId: cinema?.id,
    cinemaName: draft.cinemaName,
  };
};

export const TICKET_FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
export const MAX_TICKET_FILE_BYTES = 8 * 1024 * 1024;

/** Checks a chosen file before uploading it, with a message the user can act on. */
export const validateTicketFile = (file: { type: string; size: number }): string | null => {
  if (!TICKET_FILE_TYPES.includes(file.type)) return 'use a png, jpeg, webp or pdf file';
  if (file.size === 0) return 'that file is empty';
  if (file.size > MAX_TICKET_FILE_BYTES) return 'that file is too large (8 MB max)';
  return null;
};

export const ticketImageUrl = (ticket: Ticket): string | null =>
  ticket.image ? `/api/tickets/${encodeURIComponent(ticket.id)}/image?v=${ticket.image.version}` : null;
