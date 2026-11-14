import type pg from 'pg';

interface Migration {
  version: number;
  sql: string;
}

/**
 * Ordered, append-only schema changes. Never edit a migration that has shipped: add a new one.
 *
 * Dates stay `text` in local ISO form ("2026-11-14T17:30:00"): showtimes are wall-clock times in the cinema's
 * city, so converting them to instants would only introduce time-zone bugs.
 */
export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    sql: `
      create table movies (
        seq bigint generated always as identity,
        id text primary key,
        title text not null,
        allocine_id integer,
        director text,
        runtime_minutes integer,
        genre text,
        year integer,
        cover_url text
      );

      create table cinemas (
        id text primary key,
        name text not null,
        area text not null,
        address text
      );

      create table screenings (
        id text primary key,
        movie_id text not null references movies (id) on delete cascade,
        cinema_id text not null references cinemas (id),
        starts_at text not null,
        room text,
        formats text[] not null default '{}',
        booking_url text
      );
      create index screenings_movie_idx on screenings (movie_id);
      create index screenings_cinema_idx on screenings (cinema_id);

      create table known_cities (
        id integer primary key,
        name text not null
      );

      create table settings (
        singleton boolean primary key default true check (singleton),
        city_ids integer[] not null default '{}'
      );
      insert into settings default values;

      create table last_sync (
        singleton boolean primary key default true check (singleton),
        finished_at text not null,
        result jsonb not null
      );

      create table tickets (
        seq bigint generated always as identity,
        id text primary key,
        title text not null,
        movie_id text references movies (id) on delete set null,
        cover_url text,
        cinema_name text not null,
        cinema_id text,
        starts_at text not null,
        runtime_minutes integer,
        room text,
        seats text,
        places integer,
        formats text[] not null default '{}',
        price numeric(8, 2),
        notes text,
        screening_id text,
        image_content_type text,
        image_version integer,
        created_at timestamptz not null default now()
      );

      create table ticket_files (
        ticket_id text primary key references tickets (id) on delete cascade,
        content_type text not null,
        data bytea not null
      );

      create table meta (
        key text primary key,
        value text not null
      );
    `,
  },
  {
    version: 2,
    sql: `
      -- tickets keep only what is needed to find and use them
      alter table tickets drop column formats, drop column price, drop column notes;

      -- covers uploaded from the app, stored by the hash of their content (the same image is stored once)
      create table covers (
        id text primary key,
        content_type text not null,
        data bytea not null
      );
    `,
  },
  {
    version: 3,
    sql: `
      -- a movie keeps only what AlloCiné gives us: title, cover, director, its link
      alter table movies drop column runtime_minutes, drop column genre, drop column year;

      -- a ticket has its own end time, as printed on it, instead of a runtime.
      -- Where a runtime was entered, it becomes the end time (plus the 15 minutes of ads the old rule added).
      alter table tickets add column ends_at text;
      update tickets
         set ends_at = to_char(starts_at::timestamp + make_interval(mins => runtime_minutes + 15), 'YYYY-MM-DD"T"HH24:MI:SS')
       where runtime_minutes is not null;
      alter table tickets drop column runtime_minutes;
    `,
  },
  {
    version: 4,
    sql: `
      -- the planner: a screening you are considering is a ticket that is not booked yet
      alter table tickets add column status text not null default 'booked' check (status in ('booked', 'tentative'));

      -- when a screening should end, from the film's length
      alter table screenings add column ends_at text;
    `,
  },
];

/** Arbitrary constant: serializes migrations when several API instances start at once. */
const MIGRATION_LOCK = 727_274;

/** Applies every migration that has not run yet, each in its own transaction. */
export async function runMigrations(pool: pg.Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('select pg_advisory_lock($1)', [MIGRATION_LOCK]);
    await client.query(
      'create table if not exists schema_migrations (version integer primary key, applied_at timestamptz not null default now())',
    );
    const done = new Set<number>((await client.query<{ version: number }>('select version from schema_migrations')).rows.map((r) => r.version));

    for (const migration of MIGRATIONS) {
      if (done.has(migration.version)) continue;
      await client.query('begin');
      try {
        await client.query(migration.sql);
        await client.query('insert into schema_migrations (version) values ($1)', [migration.version]);
        await client.query('commit');
        console.log(`[db] applied migration ${migration.version}`);
      } catch (error) {
        await client.query('rollback');
        throw error;
      }
    }
  } finally {
    await client.query('select pg_advisory_unlock($1)', [MIGRATION_LOCK]).catch(() => undefined);
    client.release();
  }
}
