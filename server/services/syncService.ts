import type { Screening, SyncResult, SyncStatus, SyncTrigger } from '../../shared/types';
import type { ScrapedMovie } from '../scraper/allocineScraper';
import type { TrackerRepository } from '../store/trackerRepository';

interface Scraper {
  scrapeMovie(filmId: number, cityIds: number[]): Promise<ScrapedMovie>;
}

export interface SyncOptions {
  trigger: SyncTrigger;
  /** Limit the sync to these movies (ids from our database). Default: every movie with an AlloCiné id. */
  movieIds?: string[];
  /** If a sync is already running, run this one right after it instead of dropping it. */
  queue?: boolean;
}

/**
 * Combines a request queued earlier with a new one. A full sync (no `movieIds`) covers everything, so it
 * wins; two partial syncs are united, so that adding movies back to back never drops one of them.
 */
const mergeQueued = (queued: SyncOptions | undefined, next: SyncOptions): SyncOptions => {
  if (!queued) return next;
  const movieIds = queued.movieIds && next.movieIds ? [...new Set([...queued.movieIds, ...next.movieIds])] : undefined;
  return { ...next, movieIds };
};

/**
 * Runs scrapes and tracks their progress. Only one sync runs at a time:
 * a cron tick, a manual refresh, a "movie added" refresh and a "cities changed" refresh all go through `run`.
 */
export class SyncService {
  private status: SyncStatus = { state: 'idle' };
  private queued?: SyncOptions;

  constructor(
    private readonly repo: TrackerRepository,
    private readonly scraper: Scraper,
    private readonly log: (message: string) => void = console.log,
  ) {}

  async init(): Promise<void> {
    const last = await this.repo.getLastSync();
    if (last) this.status = { state: 'idle', finishedAt: last.finishedAt, lastResult: last.result };
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  /** True when there is no successful sync, or the last one is older than `hours`. */
  isStale(hours: number, now = Date.now()): boolean {
    const { finishedAt, lastResult } = this.status;
    return !finishedAt || !lastResult?.ok || now - new Date(finishedAt).getTime() > hours * 3_600_000;
  }

  /** Starts a sync in the background. Returns false if one is already running (and `queue` was not set). */
  start(options: SyncOptions): boolean {
    if (this.status.state === 'running') {
      if (!options.queue) return false;
      this.queued = mergeQueued(this.queued, options);
      return true;
    }
    void this.run(options);
    return true;
  }

  /** Runs a sync and resolves when done. Resolves to null if one is already running. */
  async run({ trigger, movieIds }: SyncOptions): Promise<SyncResult | null> {
    if (this.status.state === 'running') return null;

    // running from the very first instant, so a status read right after starting already says so
    this.status = { ...this.status, state: 'running', trigger, startedAt: new Date().toISOString(), progress: { done: 0, total: 0 } };

    const movies = (await this.repo.listMovies()).filter(
      (m) => m.allocineId !== undefined && (!movieIds || movieIds.includes(m.id)),
    );
    const { cityIds } = await this.repo.getSettings();
    const result: SyncResult = { ok: true, movies: 0, screenings: 0, errors: [] };
    this.status = { ...this.status, progress: { done: 0, total: movies.length } };
    this.log(`[sync] ${trigger}: ${movies.length} movie(s), ${cityIds.length || 'all'} city(ies)`);

    for (const [index, movie] of movies.entries()) {
      this.status = { ...this.status, progress: { done: index, total: movies.length, label: movie.title } };
      try {
        const scraped = await this.scraper.scrapeMovie(movie.allocineId!, cityIds);
        await this.repo.addKnownCities(scraped.cities);
        if (!scraped.skipped) {
          const screenings: Screening[] = scraped.showtimes.map((s) => ({
            id: s.id,
            movieId: movie.id,
            cinemaId: s.cinemaId,
            startsAt: s.startsAt,
            endsAt: s.endsAt,
            formats: s.formats,
            bookingUrl: s.bookingUrl,
          }));
          await this.repo.replaceScreenings(movie.id, scraped.cinemas, screenings);
          result.screenings += screenings.length;
        }
        result.movies++;
        scraped.warnings.forEach((w) => result.errors.push(`${movie.title}: ${w}`));
      } catch (error) {
        // keep this movie's previous screenings; carry on with the others
        result.errors.push(`${movie.title}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    result.ok = movies.length === 0 || result.movies > 0;
    const finishedAt = new Date().toISOString();
    await this.repo.saveLastSync(finishedAt, result);
    this.status = { state: 'idle', trigger, startedAt: this.status.startedAt, finishedAt, lastResult: result };
    this.log(`[sync] done: ${result.movies} movie(s), ${result.screenings} screening(s), ${result.errors.length} issue(s)`);

    const next = this.queued;
    this.queued = undefined;
    if (next) void this.run(next);

    return result;
  }
}
