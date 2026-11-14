import type pg from 'pg';
import type { Cinema, City, Movie, MovieUpdate, Screening, Settings, SyncResult, Ticket } from '../../../shared/types';
import type { LastSync, Snapshot, TrackerRepository } from '../trackerRepository';
import { runMigrations } from './migrations';

/* ------------------------------------------------------------------ row mapping */

interface MovieRow {
  id: string;
  title: string;
  allocine_id: number | null;
  director: string | null;
  cover_url: string | null;
}

interface CinemaRow {
  id: string;
  name: string;
  area: string;
  address: string | null;
}

interface ScreeningRow {
  id: string;
  movie_id: string;
  cinema_id: string;
  starts_at: string;
  room: string | null;
  formats: string[];
  ends_at: string | null;
  booking_url: string | null;
}

interface TicketRow {
  id: string;
  title: string;
  movie_id: string | null;
  cover_url: string | null;
  cinema_name: string;
  cinema_id: string | null;
  starts_at: string;
  ends_at: string | null;
  room: string | null;
  seats: string | null;
  places: number | null;
  status: Ticket['status'];
  screening_id: string | null;
  image_content_type: string | null;
  image_version: number | null;
  created_at: Date;
}

// SQL NULL becomes an absent field, to match the shape the rest of the app uses
const orUndefined = <T>(value: T | null): T | undefined => value ?? undefined;

const toMovie = (r: MovieRow): Movie => ({
  id: r.id,
  title: r.title,
  allocineId: orUndefined(r.allocine_id),
  director: orUndefined(r.director),
  coverUrl: orUndefined(r.cover_url),
});

const toCinema = (r: CinemaRow): Cinema => ({ id: r.id, name: r.name, area: r.area, address: orUndefined(r.address) });

const toScreening = (r: ScreeningRow): Screening => ({
  id: r.id,
  movieId: r.movie_id,
  cinemaId: r.cinema_id,
  startsAt: r.starts_at,
  room: orUndefined(r.room),
  formats: r.formats,
  endsAt: orUndefined(r.ends_at),
  bookingUrl: orUndefined(r.booking_url),
});

const toTicket = (r: TicketRow): Ticket => ({
  id: r.id,
  title: r.title,
  movieId: orUndefined(r.movie_id),
  coverUrl: orUndefined(r.cover_url),
  cinemaName: r.cinema_name,
  cinemaId: orUndefined(r.cinema_id),
  startsAt: r.starts_at,
  endsAt: orUndefined(r.ends_at),
  room: orUndefined(r.room),
  seats: orUndefined(r.seats),
  places: orUndefined(r.places),
  status: r.status,
  screeningId: orUndefined(r.screening_id),
  image: r.image_content_type ? { contentType: r.image_content_type, version: r.image_version ?? 1 } : undefined,
  createdAt: r.created_at.toISOString(),
});

const TICKET_COLUMNS = `id, title, movie_id, cover_url, cinema_name, cinema_id, starts_at, ends_at, room, seats,
  places, status, screening_id, image_content_type, image_version, created_at`;

/* ------------------------------------------------------------------ repository */

/** The production store: everything lives in PostgreSQL. */
export class PostgresTrackerRepository implements TrackerRepository {
  constructor(
    private readonly pool: pg.Pool,
    private readonly seedMovies: Movie[],
  ) {}

  /** Runs `work` inside a transaction. */
  private async transaction<T>(work: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(client);
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async init() {
    await runMigrations(this.pool);

    // Seed once, ever: the flag stops the seed coming back after you delete every movie.
    await this.transaction(async (client) => {
      const claimed = await client.query("insert into meta (key, value) values ('seeded', '1') on conflict (key) do nothing");
      if (claimed.rowCount === 0) return;
      // newest first is the display order, so the first seed must be inserted last
      for (const movie of [...this.seedMovies].reverse()) await this.insertMovie(client, movie);
    });
  }

  async ping() {
    await this.pool.query('select 1');
  }

  /* ---- movies */

  private insertMovie(client: pg.Pool | pg.PoolClient, movie: Movie) {
    return client.query(
      `insert into movies (id, title, allocine_id, director, cover_url)
       values ($1, $2, $3, $4, $5)`,
      [movie.id, movie.title, movie.allocineId ?? null, movie.director ?? null, movie.coverUrl ?? null],
    );
  }

  async listMovies() {
    const { rows } = await this.pool.query<MovieRow>('select * from movies order by seq desc');
    return rows.map(toMovie);
  }

  async addMovie(movie: Movie) {
    await this.insertMovie(this.pool, movie);
  }

  async updateMovie(id: string, change: MovieUpdate) {
    // an absent field is left as it is; "" and null remove a value
    const emptyToNull = (value: string | undefined) => (value === undefined ? undefined : value || null);
    const entries: [string, unknown][] = [
      ['title', change.title],
      ['cover_url', emptyToNull(change.coverUrl)],
      ['director', emptyToNull(change.director)],
      ['allocine_id', change.allocineId],
    ];
    const changed = entries.filter(([, value]) => value !== undefined);

    const assignments = changed.map(([column], index) => `${column} = $${index + 2}`).join(', ');
    const sql = changed.length > 0 ? `update movies set ${assignments} where id = $1 returning *` : 'select * from movies where id = $1';
    const { rows } = await this.pool.query<MovieRow>(sql, [id, ...changed.map(([, value]) => value)]);
    return rows[0] && toMovie(rows[0]);
  }

  async deleteMovie(id: string) {
    return this.transaction(async (client) => {
      const deleted = await client.query('delete from movies where id = $1', [id]); // screenings go with it (cascade)
      // drop cinemas nothing refers to anymore
      await client.query('delete from cinemas c where not exists (select 1 from screenings s where s.cinema_id = c.id)');
      return (deleted.rowCount ?? 0) > 0;
    });
  }

  async snapshot(): Promise<Snapshot> {
    const [movies, cinemas, screenings, cities, settings] = await Promise.all([
      this.listMovies(),
      this.pool.query<CinemaRow>('select * from cinemas order by name, id'),
      this.pool.query<ScreeningRow>('select * from screenings order by starts_at, id'),
      this.pool.query<City>('select id, name from known_cities'),
      this.getSettings(),
    ]);
    return {
      movies,
      cinemas: cinemas.rows.map(toCinema),
      screenings: screenings.rows.map(toScreening),
      cities: cities.rows.sort((a, b) => a.name.localeCompare(b.name, 'fr')), // same ordering as the JSON store
      settings,
    };
  }

  /* ---- screenings and cinemas */

  async replaceScreenings(movieId: string, cinemas: Cinema[], screenings: Screening[]) {
    await this.transaction(async (client) => {
      for (const cinema of cinemas) {
        await client.query(
          `insert into cinemas (id, name, area, address) values ($1, $2, $3, $4)
           on conflict (id) do update set name = excluded.name, area = excluded.area, address = excluded.address`,
          [cinema.id, cinema.name, cinema.area, cinema.address ?? null],
        );
      }
      await client.query('delete from screenings where movie_id = $1', [movieId]);
      for (const s of screenings) {
        await client.query(
          `insert into screenings (id, movie_id, cinema_id, starts_at, ends_at, room, formats, booking_url)
           values ($1, $2, $3, $4, $5, $6, $7, $8)
           on conflict (id) do update set movie_id = excluded.movie_id, cinema_id = excluded.cinema_id,
             starts_at = excluded.starts_at, ends_at = excluded.ends_at, room = excluded.room, formats = excluded.formats, booking_url = excluded.booking_url`,
          [s.id, movieId, s.cinemaId, s.startsAt, s.endsAt ?? null, s.room ?? null, s.formats, s.bookingUrl ?? null],
        );
      }
      // cinemas from an earlier, wider selection that no screening uses anymore must not linger in the suggestions
      await client.query('delete from cinemas c where not exists (select 1 from screenings s where s.cinema_id = c.id)');
    });
  }

  /* ---- settings, cities, sync */

  async getSettings(): Promise<Settings> {
    const { rows } = await this.pool.query<{ city_ids: number[] }>('select city_ids from settings');
    return { cityIds: rows[0]?.city_ids ?? [] };
  }

  async saveSettings({ cityIds }: Settings) {
    await this.pool.query('update settings set city_ids = $1', [cityIds]);
  }

  async addKnownCities(cities: City[]) {
    if (cities.length === 0) return;
    await this.pool.query(
      `insert into known_cities (id, name) select * from unnest($1::int[], $2::text[])
       on conflict (id) do update set name = excluded.name`,
      [cities.map((c) => c.id), cities.map((c) => c.name)],
    );
  }

  async getLastSync(): Promise<LastSync | undefined> {
    const { rows } = await this.pool.query<{ finished_at: string; result: SyncResult }>('select finished_at, result from last_sync');
    return rows[0] && { finishedAt: rows[0].finished_at, result: rows[0].result };
  }

  async saveLastSync(finishedAt: string, result: SyncResult) {
    await this.pool.query(
      `insert into last_sync (finished_at, result) values ($1, $2)
       on conflict (singleton) do update set finished_at = excluded.finished_at, result = excluded.result`,
      [finishedAt, JSON.stringify(result)],
    );
  }

  /* ---- tickets */

  async listTickets() {
    const { rows } = await this.pool.query<TicketRow>(`select ${TICKET_COLUMNS} from tickets order by seq`);
    return rows.map(toTicket);
  }

  async getTicket(id: string) {
    const { rows } = await this.pool.query<TicketRow>(`select ${TICKET_COLUMNS} from tickets where id = $1`, [id]);
    return rows[0] && toTicket(rows[0]);
  }

  async saveTicket(t: Ticket) {
    await this.pool.query(
      `insert into tickets (id, title, movie_id, cover_url, cinema_name, cinema_id, starts_at, ends_at, room, seats,
                            places, status, screening_id, image_content_type, image_version, created_at)
       values ($1, $2, (select id from movies where id = $3), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       on conflict (id) do update set
         title = excluded.title, movie_id = excluded.movie_id, cover_url = excluded.cover_url,
         cinema_name = excluded.cinema_name, cinema_id = excluded.cinema_id, starts_at = excluded.starts_at,
         ends_at = excluded.ends_at, room = excluded.room, seats = excluded.seats, places = excluded.places,
         status = excluded.status, screening_id = excluded.screening_id,
         image_content_type = excluded.image_content_type, image_version = excluded.image_version`,
      [
        t.id,
        t.title,
        t.movieId ?? null, // an id that is not on the watch list becomes NULL instead of failing the foreign key
        t.coverUrl ?? null,
        t.cinemaName,
        t.cinemaId ?? null,
        t.startsAt,
        t.endsAt ?? null,
        t.room ?? null,
        t.seats ?? null,
        t.places ?? null,
        t.status,
        t.screeningId ?? null,
        t.image?.contentType ?? null,
        t.image?.version ?? null,
        t.createdAt,
      ],
    );
  }

  async deleteTicket(id: string) {
    const result = await this.pool.query('delete from tickets where id = $1', [id]); // its file goes with it (cascade)
    return (result.rowCount ?? 0) > 0;
  }
}
