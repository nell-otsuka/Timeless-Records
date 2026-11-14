/** Presentation-ready shapes, built in `lib/` so components stay dumb. */

export interface DayBadge {
  /** "today", "tmrw" or a short weekday ("mon"). */
  caption: string;
  day: string;
  month: string;
}

export interface FormatTag {
  label: string;
  premium: boolean;
}

export interface ScreeningRowModel {
  id: string;
  badge: DayBadge;
  time: string;
  formats: FormatTag[];
  bookingUrl?: string;
  /** Why booking it would clash with an existing ticket. */
  conflict?: ConflictModel;
}

export interface ConflictModel {
  text: string;
}

export interface TicketRowModel {
  id: string;
  title: string;
  coverUrl?: string;
  time: string;
  cinemaName: string;
  /** "salle 4 · seats a9, a10 · 2 places" */
  details: string;
  hasImage: boolean;
  /** Screening already happened. */
  past: boolean;
  /** Only planned, not booked: shown when the tentative tickets are switched on. */
  tentative: boolean;
  /** Clashes with other tickets, shown on the ticket itself. */
  conflicts: ConflictModel[];
}

/** A poster in the gallery: no details, just the cover. */
export interface TicketTileModel {
  id: string;
  title: string;
  coverUrl?: string;
  past: boolean;
}

/** One day of the agenda. */
export interface TicketDayGroup {
  key: string;
  weekday: string;
  day: string;
  month: string;
  /** "today", "tomorrow", "in 3 days", "2 days ago". */
  relative: string;
  rows: TicketRowModel[];
}

/** The ticket you will use next, shown large above the agenda. */
export interface NextUpModel {
  row: TicketRowModel;
  /** "in 3 days", "now playing"… */
  countdown: string;
  /** "sat 14 nov" */
  when: string;
}

export interface CinemaGroupModel {
  id: string;
  name: string;
  address?: string;
  screenings: ScreeningRowModel[];
}

/** All screenings of one movie in one city, grouped by cinema. */
export interface CityGroupModel {
  city: string;
  count: number;
  cinemas: CinemaGroupModel[];
}

export interface SyncLabel {
  running: boolean;
  text: string;
  /** Problems from the last sync, for a tooltip. */
  issues: string[];
}

export interface Fact {
  label: string;
  value: string;
}
