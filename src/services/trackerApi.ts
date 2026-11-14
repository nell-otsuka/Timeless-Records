import type { Movie, MovieChange, NewMovie, NewTicket, Settings, SyncStatus, Ticket, TrackerSnapshot } from '@/types/movie';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** `fetch` rejects with a bare TypeError ("Failed to fetch") when offline: say so in plain words. */
const send = async (path: string, init?: RequestInit): Promise<Response> => {
  try {
    return await fetch(path, init);
  } catch {
    throw new ApiError('connection problem. check your internet and try again.', 0);
  }
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await send(path, init);
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new ApiError(body.error ?? response.statusText, response.status);
  return body;
};

/** Client for the tracker API (see server/app.ts). */
export const trackerApi = {
  getTracker: () => request<TrackerSnapshot>('/api/tracker'),
  getSync: () => request<SyncStatus>('/api/sync'),

  /** Starts a refresh. If one is already running the server answers 409 with the current status, which is fine. */
  startRefresh: async (): Promise<SyncStatus> => {
    const response = await send('/api/refresh', { method: 'POST' });
    return (await response.json()) as SyncStatus;
  },

  getTickets: () => request<Ticket[]>('/api/tickets'),

  createTicket: (ticket: NewTicket) =>
    request<Ticket>('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    }),

  updateTicket: (id: string, ticket: NewTicket) =>
    request<Ticket>(`/api/tickets/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    }),

  deleteTicket: (id: string) => request<void>(`/api/tickets/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  uploadTicketFile: (id: string, file: File) => {
    const form = new FormData();
    form.set('file', file);
    return request<Ticket>(`/api/tickets/${encodeURIComponent(id)}/image`, { method: 'PUT', body: form });
  },

  deleteTicketFile: (id: string) => request<Ticket>(`/api/tickets/${encodeURIComponent(id)}/image`, { method: 'DELETE' }),

  updateMovie: (id: string, change: MovieChange) =>
    request<Movie>(`/api/movies/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(change),
    }),

  /** Uploads a poster; answers the URL to use as a `coverUrl`. */
  uploadCover: (file: File) => {
    const form = new FormData();
    form.set('file', file);
    return request<{ url: string }>('/api/covers', { method: 'POST', body: form });
  },

  deleteMovie: (id: string) => request<void>(`/api/movies/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  /** Saves the global city selection; the server then re-syncs every movie. */
  saveCities: (cityIds: number[]) =>
    request<Settings>('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cityIds }),
    }),

  addMovie: (movie: NewMovie) =>
    request<Movie>('/api/movies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movie),
    }),
};
