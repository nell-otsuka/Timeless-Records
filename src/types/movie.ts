import type { Movie, Screening } from '@shared/types';

export type {
  Cinema,
  City,
  Movie,
  MovieChange,
  NewMovie,
  NewTicket,
  Screening,
  Settings,
  SyncResult,
  SyncStatus,
  Ticket,
  TicketImage,
  TicketStatus,
  TrackerSnapshot,
} from '@shared/types';

/** A movie joined with its upcoming screenings. */
export interface MovieEntry extends Movie {
  screenings: Screening[];
}

/** Raw (string) values of the movie forms, the same when adding and editing. */
export interface MovieDraft {
  allocineRef: string;
  title: string;
  coverUrl: string;
  director: string;
}

export type MovieDraftErrors = Partial<Record<keyof MovieDraft, string>>;

/** Raw (string) values of the ticket form. The last four are carried along, not shown. */
export interface TicketDraft {
  title: string;
  startsAt: string;
  cinemaName: string;
  /** Time of day the film ends, e.g. "19:45". Read from the ticket. */
  endsTime: string;
  room: string;
  seats: string;
  places: string;
  movieId: string;
  cinemaId: string;
  coverUrl: string;
  screeningId: string;
}

export type TicketDraftErrors = Partial<Record<keyof TicketDraft, string>>;
