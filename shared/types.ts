/** Domain types shared by the web app (src/) and the scraper/API server (server/). */

/** A movie on the user's watch list. */
export interface Movie {
  id: string;
  title: string;
  /** AlloCiné film id (the number in `/film/fichefilm_gen_cfilm=1975.html`). Movies without one have no screenings. */
  allocineId?: number;
  director?: string;
  coverUrl?: string;
}

/** Payload for adding a movie. Either a title or an AlloCiné reference is required. */
export interface NewMovie {
  title?: string;
  /** An AlloCiné URL or a bare film id; the server resolves the title and cover from it. */
  allocineRef?: string;
  director?: string;
  coverUrl?: string;
}

/**
 * Changes to an existing movie; anything left out stays as it is. Text fields set to "" are removed. `allocineRef` is an AlloCiné link or id: changing it re-links the movie and refreshes its screenings.
 */
export interface MovieChange {
  title?: string;
  coverUrl?: string;
  allocineRef?: string;
  director?: string;
}

/** What the store applies: the same change, with the AlloCiné reference already resolved to an id (`null` unlinks). */
export type MovieUpdate = Omit<MovieChange, 'allocineRef'> & { allocineId?: number | null };

export interface Cinema {
  id: string;
  name: string;
  /** City, e.g. "Paris". */
  area: string;
  address?: string;
}

export interface Screening {
  id: string;
  movieId: string;
  cinemaId: string;
  /** Local date-time, e.g. "2026-11-12T20:45:00". */
  startsAt: string;
  room?: string;
  /** Lowercase labels such as "vost", "vf", "imax". */
  formats: string[];
  /** When the screening should end: the film's length plus the ads. Unknown until AlloCiné gave the length. */
  endsAt?: string;
  bookingUrl?: string;
}

/** An uploaded ticket file (QR screenshot or PDF). `version` busts caches when it is replaced. */
export interface TicketImage {
  contentType: string;
  version: number;
}

/** "tentative": on the planner, not booked yet. "booked": you hold the ticket. */
export type TicketStatus = 'booked' | 'tentative';

/** A booked screening. Stores its own copy of the details: finder screenings come and go with every sync. */
export interface Ticket {
  id: string;
  title: string;
  /** Link to a watch-list movie, when there is one. */
  movieId?: string;
  coverUrl?: string;
  cinemaName: string;
  /** Link to a known cinema (AlloCiné id), when there is one. */
  cinemaId?: string;
  /** Local date-time, e.g. "2026-11-14T17:30:00". */
  startsAt: string;
  /** Local date-time the film ends, as printed on the ticket. Without it a clash check assumes a typical length. */
  endsAt?: string;
  room?: string;
  seats?: string;
  places?: number;
  /** The finder screening this ticket was created from, if any. */
  screeningId?: string;
  image?: TicketImage;
  status: TicketStatus;
  createdAt: string;
}

/** What the API accepts to create or replace a ticket. Without a status it is a booked one. */
export type NewTicket = Omit<Ticket, 'id' | 'image' | 'createdAt' | 'status'> & { status?: TicketStatus };

/** An AlloCiné location (usually a city). */
export interface City {
  id: number;
  name: string;
}

/** Global settings, applied to every movie. */
export interface Settings {
  /** Cities to scrape. Empty = every city a film plays in (capped by the server). */
  cityIds: number[];
}

export type SyncTrigger = 'cron' | 'manual' | 'startup' | 'add' | 'edit' | 'settings';

export interface SyncResult {
  ok: boolean;
  movies: number;
  screenings: number;
  errors: string[];
}

export interface SyncStatus {
  state: 'idle' | 'running';
  trigger?: SyncTrigger;
  startedAt?: string;
  finishedAt?: string;
  progress?: { done: number; total: number; label?: string };
  lastResult?: SyncResult;
}

export interface TrackerSnapshot {
  movies: Movie[];
  cinemas: Cinema[];
  screenings: Screening[];
  /** Every city seen so far on AlloCiné film pages: the choices offered by the city picker. */
  cities: City[];
  settings: Settings;
  sync: SyncStatus;
}
