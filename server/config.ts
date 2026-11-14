import { dirname, resolve } from 'node:path';

const env = process.env;

/** All runtime configuration. Everything is overridable through environment variables. */
export const config = {
  /**
   * `API_PORT` wins. In production we also honour the conventional `PORT` (most hosts set it);
   * in development we do not, because dev tools often set `PORT` for the web dev server.
   */
  port: Number(env.API_PORT ?? (env.NODE_ENV === 'production' ? env.PORT : undefined) ?? 8787),
  /**
   * PostgreSQL connection string, e.g. postgres://user:password@db:5432/movietracker.
   * When it is not set, the app falls back to a JSON file (handy for local runs and tests).
   */
  databaseUrl: env.DATABASE_URL,
  /** Fallback storage, used only without DATABASE_URL. */
  dataFile: resolve(env.DATA_FILE ?? 'data/db.json'),
  staticDir: resolve('dist'),
  /** Fallback storage for ticket files, next to the JSON file. With PostgreSQL they live in the database. */
  ticketsDir: resolve(dirname(resolve(env.DATA_FILE ?? 'data/db.json')), 'tickets'),
  /** Fallback storage for uploaded posters. With PostgreSQL they live in the database. */
  coversDir: resolve(dirname(resolve(env.DATA_FILE ?? 'data/db.json')), 'covers'),

  /** Daily scrape, cron syntax. Default: every day at 04:00. */
  cron: env.SCRAPE_CRON ?? '0 4 * * *',
  timezone: env.SCRAPE_TIMEZONE ?? 'Europe/Paris',
  /** If the last successful sync is older than this at boot, sync right away. */
  staleAfterHours: Number(env.SCRAPE_STALE_HOURS ?? 24),

  allocine: {
    baseUrl: 'https://www.allocine.fr',
    userAgent: env.SCRAPER_USER_AGENT ?? 'movie-tracker/0.1 (personal project)',
    /** Pause between two requests, in milliseconds. Be nice to the site. */
    requestDelayMs: Number(env.SCRAPE_DELAY_MS ?? 1200),
    /**
     * Showtimes come from AlloCiné's internal `/_/showtimes/` endpoint, which their robots.txt disallows
     * for crawlers. Set ALLOCINE_FETCH_SHOWTIMES=false to only discover cities from the (allowed) film page.
     */
    fetchShowtimes: env.ALLOCINE_FETCH_SHOWTIMES !== 'false',
    /** Safety cap when no city is picked, so a blockbuster in 500 cities does not trigger thousands of requests. */
    maxCitiesPerMovie: Number(env.ALLOCINE_MAX_CITIES ?? 30),
  },
} as const;

export type AllocineConfig = typeof config.allocine;
