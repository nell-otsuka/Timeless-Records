import type { Cinema, City, Movie, MovieUpdate, Screening, Settings, SyncResult, Ticket } from '../../shared/types';
import { JsonStore } from './jsonStore';

interface Database {
  movies: Movie[];
  tickets: Ticket[];
  cinemas: Cinema[];
  screenings: Screening[];
  /** Global: every city seen on AlloCiné film pages so far. */
  knownCities: City[];
  /** Global: applies to every movie. */
  settings: Settings;
  lastSync?: LastSync;
}

export interface Snapshot {
  movies: Movie[];
  cinemas: Cinema[];
  screenings: Screening[];
  cities: City[];
  settings: Settings;
}

export interface LastSync {
  finishedAt: string;
  result: SyncResult;
}

/** What the app needs from persistence. Implemented by PostgreSQL (production) and a JSON file (local, tests). */
export interface TrackerRepository {
  /** Prepares storage (migrations, seed data). Call once at startup. */
  init(): Promise<void>;
  /** Rejects when the storage is unreachable. Used by the health check. */
  ping(): Promise<void>;

  listMovies(): Promise<Movie[]>;
  addMovie(movie: Movie): Promise<void>;
  /** Applies a change to a movie. Returns the updated movie, or undefined if it does not exist. */
  updateMovie(id: string, change: MovieUpdate): Promise<Movie | undefined>;
  /** Removes a movie and its screenings. Returns false if it did not exist. */
  deleteMovie(id: string): Promise<boolean>;
  snapshot(): Promise<Snapshot>;
  /** Replaces all screenings of one movie (and upserts the cinemas they mention). */
  replaceScreenings(movieId: string, cinemas: Cinema[], screenings: Screening[]): Promise<void>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
  /** Merges cities into the global list offered by the city picker. */
  addKnownCities(cities: City[]): Promise<void>;
  getLastSync(): Promise<LastSync | undefined>;
  saveLastSync(finishedAt: string, result: SyncResult): Promise<void>;

  listTickets(): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | undefined>;
  /** Inserts a new ticket or replaces the one with the same id. */
  saveTicket(ticket: Ticket): Promise<void>;
  /** Returns false if it did not exist. */
  deleteTicket(id: string): Promise<boolean>;
}

/** Fills in fields that older database files do not have yet. */
const withDefaults = (db: Database): Database => {
  db.knownCities ??= [];
  db.settings ??= { cityIds: [] };
  db.tickets ??= [];
  return db;
};

export class JsonTrackerRepository implements TrackerRepository {
  private readonly store: JsonStore<Database>;

  constructor(file: string, seedMovies: Movie[]) {
    this.store = new JsonStore<Database>(file, () => ({
      movies: [...seedMovies], // a copy: the database mutates its own list, never the caller's seed
      tickets: [],
      cinemas: [],
      screenings: [],
      knownCities: [],
      settings: { cityIds: [] },
    }));
  }

  private read = async () => withDefaults(await this.store.read());
  private update = (mutate: (db: Database) => void) => this.store.update((db) => mutate(withDefaults(db)));

  async init() {
    await this.read(); // creates and seeds the file on first run
  }

  async ping() {
    await this.read();
  }

  async listMovies() {
    return (await this.read()).movies;
  }

  async addMovie(movie: Movie) {
    await this.update((db) => void db.movies.unshift(movie));
  }

  async updateMovie(id: string, change: MovieUpdate) {
    let updated: Movie | undefined;
    await this.update((db) => {
      const movie = db.movies.find((m) => m.id === id);
      if (!movie) return;
      if (change.title !== undefined) movie.title = change.title;
      // "" and null remove a value
      if (change.coverUrl !== undefined) movie.coverUrl = change.coverUrl || undefined;
      if (change.director !== undefined) movie.director = change.director || undefined;
      if (change.allocineId !== undefined) movie.allocineId = change.allocineId ?? undefined;
      updated = { ...movie };
    });
    return updated;
  }

  async deleteMovie(id: string) {
    let existed = false;
    await this.update((db) => {
      existed = db.movies.some((m) => m.id === id);
      db.movies = db.movies.filter((m) => m.id !== id);
      db.screenings = db.screenings.filter((s) => s.movieId !== id);
      const used = new Set(db.screenings.map((s) => s.cinemaId));
      db.cinemas = db.cinemas.filter((c) => used.has(c.id)); // drop cinemas nothing refers to anymore
    });
    return existed;
  }

  async snapshot(): Promise<Snapshot> {
    const { movies, cinemas, screenings, knownCities, settings } = await this.read();
    return { movies, cinemas, screenings, cities: knownCities, settings };
  }

  async replaceScreenings(movieId: string, cinemas: Cinema[], screenings: Screening[]) {
    await this.update((db) => {
      db.screenings = [...db.screenings.filter((s) => s.movieId !== movieId), ...screenings];
      const byId = new Map(db.cinemas.map((c) => [c.id, c]));
      cinemas.forEach((c) => byId.set(c.id, c));
      const used = new Set(db.screenings.map((s) => s.cinemaId));
      db.cinemas = [...byId.values()].filter((c) => used.has(c.id)); // none left over from an earlier, wider selection
    });
  }

  async getSettings() {
    return (await this.read()).settings;
  }

  async saveSettings(settings: Settings) {
    await this.update((db) => void (db.settings = settings));
  }

  async addKnownCities(cities: City[]) {
    await this.update((db) => {
      const byId = new Map(db.knownCities.map((c) => [c.id, c]));
      cities.forEach((c) => byId.set(c.id, c));
      db.knownCities = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    });
  }

  async getLastSync() {
    return (await this.read()).lastSync;
  }

  async saveLastSync(finishedAt: string, result: SyncResult) {
    await this.update((db) => void (db.lastSync = { finishedAt, result }));
  }

  async listTickets() {
    return (await this.read()).tickets;
  }

  async getTicket(id: string) {
    return (await this.read()).tickets.find((t) => t.id === id);
  }

  async saveTicket(ticket: Ticket) {
    await this.update((db) => {
      const index = db.tickets.findIndex((t) => t.id === ticket.id);
      if (index >= 0) db.tickets[index] = ticket;
      else db.tickets.push(ticket);
    });
  }

  async deleteTicket(id: string) {
    let existed = false;
    await this.update((db) => {
      existed = db.tickets.some((t) => t.id === id);
      db.tickets = db.tickets.filter((t) => t.id !== id);
    });
    return existed;
  }
}
