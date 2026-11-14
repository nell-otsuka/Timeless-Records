import { config } from './config';
import { AllocineScraper } from './scraper/allocineScraper';
import { createHttpClient } from './scraper/httpClient';
import { CoverService } from './services/coverService';
import { MovieService } from './services/movieService';
import { SyncService } from './services/syncService';
import { TicketService } from './services/ticketService';
import { FileCoverStore, type CoverStore } from './store/coverStore';
import { connectPostgres } from './store/postgres/connection';
import { PostgresCoverStore } from './store/postgres/postgresCoverStore';
import { PostgresTicketImageStore } from './store/postgres/postgresTicketImageStore';
import { PostgresTrackerRepository } from './store/postgres/postgresTrackerRepository';
import { seedMovies } from './store/seed';
import { FileTicketImageStore, type TicketImageStore } from './store/ticketImageStore';
import { JsonTrackerRepository, type TrackerRepository } from './store/trackerRepository';

/** Composition root: builds the object graph once. PostgreSQL when DATABASE_URL is set, a JSON file otherwise. */
export async function createContainer() {
  let repo: TrackerRepository;
  let images: TicketImageStore;
  let covers: CoverStore;
  let close = async () => {};

  if (config.databaseUrl) {
    const pool = await connectPostgres(config.databaseUrl);
    repo = new PostgresTrackerRepository(pool, seedMovies);
    images = new PostgresTicketImageStore(pool);
    covers = new PostgresCoverStore(pool);
    close = () => pool.end();
    console.log('[db] using PostgreSQL');
  } else {
    repo = new JsonTrackerRepository(config.dataFile, seedMovies);
    images = new FileTicketImageStore(config.ticketsDir);
    covers = new FileCoverStore(config.coversDir);
    console.log(`[db] DATABASE_URL is not set: using a JSON file (${config.dataFile})`);
  }
  await repo.init();

  const http = createHttpClient({ userAgent: config.allocine.userAgent, delayMs: config.allocine.requestDelayMs });
  const scraper = new AllocineScraper(http, { ...config.allocine, timezone: config.timezone });
  const movies = new MovieService(repo, scraper);
  const sync = new SyncService(repo, scraper);
  const tickets = new TicketService(repo, images);
  const coverService = new CoverService(covers);
  await sync.init();
  return { repo, movies, tickets, covers: coverService, sync, close };
}

export type Container = Awaited<ReturnType<typeof createContainer>>;
