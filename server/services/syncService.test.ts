import { describe, expect, it, vi } from 'vitest';
import type { Movie } from '../../shared/types';
import type { ScrapedMovie } from '../scraper/allocineScraper';
import type { TrackerRepository } from '../store/trackerRepository';
import { SyncService } from './syncService';

const movies: Movie[] = [
  { id: 'a', title: 'A', allocineId: 1 },
  { id: 'b', title: 'B', allocineId: 2 },
  { id: 'manual', title: 'No AlloCiné id' },
];

const makeRepo = () => {
  const replaceScreenings = vi.fn(async () => undefined);
  const saveLastSync = vi.fn(async () => undefined);
  const addKnownCities = vi.fn(async () => undefined);
  const repo = {
    listMovies: async () => movies,
    replaceScreenings,
    saveLastSync,
    addKnownCities,
    getLastSync: async () => undefined,
    getSettings: async () => ({ cityIds: [7] }),
  } as unknown as TrackerRepository;
  return { repo, replaceScreenings, saveLastSync, addKnownCities };
};

const scraped: ScrapedMovie = {
  cities: [{ id: 7, name: 'Paris' }],
  cinemas: [{ id: 'C1', name: 'c', area: 'Paris' }],
  showtimes: [{ id: 's1', cinemaId: 'C1', startsAt: '2030-01-01T20:00:00', formats: ['vf'] }],
  warnings: [],
};

const quiet = () => undefined;

describe('SyncService', () => {
  it('scrapes every movie that has an AlloCiné id and saves the result', async () => {
    const { repo, replaceScreenings, saveLastSync } = makeRepo();
    const scrapeMovie = vi.fn(async () => scraped);
    const sync = new SyncService(repo, { scrapeMovie }, quiet);

    const result = await sync.run({ trigger: 'manual' });

    expect(scrapeMovie).toHaveBeenCalledTimes(2);
    expect(replaceScreenings).toHaveBeenCalledWith('a', scraped.cinemas, [expect.objectContaining({ id: 's1', movieId: 'a' })]);
    expect(result).toMatchObject({ ok: true, movies: 2, screenings: 2 });
    expect(saveLastSync).toHaveBeenCalledOnce();
    expect(sync.getStatus().state).toBe('idle');
  });

  it('applies the global city selection to every movie and records the cities it finds', async () => {
    const { repo, addKnownCities } = makeRepo();
    const scrapeMovie = vi.fn(async () => scraped);
    await new SyncService(repo, { scrapeMovie }, quiet).run({ trigger: 'manual' });

    expect(scrapeMovie).toHaveBeenNthCalledWith(1, 1, [7]);
    expect(scrapeMovie).toHaveBeenNthCalledWith(2, 2, [7]);
    expect(addKnownCities).toHaveBeenCalledWith(scraped.cities);
  });

  it('can be limited to specific movies', async () => {
    const { repo } = makeRepo();
    const scrapeMovie = vi.fn(async () => scraped);
    await new SyncService(repo, { scrapeMovie }, quiet).run({ trigger: 'add', movieIds: ['b'] });
    expect(scrapeMovie).toHaveBeenCalledExactlyOnceWith(2, [7]);
  });

  it('keeps going when one movie fails and records the error', async () => {
    const { repo, replaceScreenings } = makeRepo();
    const scrapeMovie = vi.fn(async (id: number) => {
      if (id === 1) throw new Error('boom');
      return scraped;
    });
    const result = await new SyncService(repo, { scrapeMovie }, quiet).run({ trigger: 'cron' });

    expect(replaceScreenings).toHaveBeenCalledOnce(); // the failed movie keeps its old screenings
    expect(result).toMatchObject({ ok: true, movies: 1 });
    expect(result?.errors).toEqual(['A: boom']);
  });

  it('leaves existing screenings alone when the scraper skipped showtimes, but still records cities', async () => {
    const { repo, replaceScreenings, addKnownCities } = makeRepo();
    const skipped: ScrapedMovie = { ...scraped, cinemas: [], showtimes: [], warnings: ['disabled'], skipped: true };
    await new SyncService(repo, { scrapeMovie: async () => skipped }, quiet).run({ trigger: 'cron' });

    expect(replaceScreenings).not.toHaveBeenCalled();
    expect(addKnownCities).toHaveBeenCalled();
  });

  it('is not ok when every movie fails', async () => {
    const { repo } = makeRepo();
    const result = await new SyncService(repo, { scrapeMovie: async () => Promise.reject(new Error('x')) }, quiet).run({
      trigger: 'cron',
    });
    expect(result?.ok).toBe(false);
  });

  it('refuses to run twice at the same time', async () => {
    const { repo } = makeRepo();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const sync = new SyncService(repo, { scrapeMovie: async () => (await gate, scraped) }, quiet);

    const first = sync.run({ trigger: 'manual' });
    await vi.waitFor(() => expect(sync.getStatus().state).toBe('running'));

    expect(sync.start({ trigger: 'manual' })).toBe(false);
    expect(await sync.run({ trigger: 'cron' })).toBeNull();

    release();
    await first;
    expect(sync.getStatus().state).toBe('idle');
  });

  it('queues a request made while busy and runs it afterwards', async () => {
    const { repo } = makeRepo();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const scrapeMovie = vi.fn(async () => (await gate, scraped));
    const sync = new SyncService(repo, { scrapeMovie }, quiet);

    const first = sync.run({ trigger: 'manual', movieIds: ['a'] });
    await vi.waitFor(() => expect(sync.getStatus().state).toBe('running'));
    expect(sync.start({ trigger: 'settings', queue: true })).toBe(true);

    release();
    await first;
    await vi.waitFor(() => expect(scrapeMovie).toHaveBeenCalledTimes(3)); // movie a, then every movie
    await vi.waitFor(() => expect(sync.getStatus().trigger).toBe('settings'));
  });

  it('reports running the moment a sync is started, before anything has loaded', async () => {
    const { repo } = makeRepo();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const sync = new SyncService(repo, { scrapeMovie: async () => (await gate, scraped) }, quiet);

    sync.start({ trigger: 'manual' });
    expect(sync.getStatus().state).toBe('running'); // a refresh button must see this at once
    release();
    await vi.waitFor(() => expect(sync.getStatus().state).toBe('idle'));
  });

  it('keeps every movie when several are added while a sync is running', async () => {
    const { repo } = makeRepo();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const scrapeMovie = vi.fn(async () => (await gate, scraped));
    const sync = new SyncService(repo, { scrapeMovie }, quiet);

    const first = sync.run({ trigger: 'manual', movieIds: ['a'] });
    await vi.waitFor(() => expect(sync.getStatus().state).toBe('running'));
    sync.start({ trigger: 'add', movieIds: ['b'], queue: true });
    sync.start({ trigger: 'add', movieIds: ['a'], queue: true }); // must not replace the queued "b"

    release();
    await first;
    await vi.waitFor(() => expect(scrapeMovie).toHaveBeenCalledTimes(3));
    expect(scrapeMovie.mock.calls.map((call: unknown[]) => call[0]).sort()).toEqual([1, 1, 2]);
  });

  it('lets a queued full sync absorb queued partial ones', async () => {
    const { repo } = makeRepo();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const scrapeMovie = vi.fn(async () => (await gate, scraped));
    const sync = new SyncService(repo, { scrapeMovie }, quiet);

    const first = sync.run({ trigger: 'manual', movieIds: ['a'] });
    await vi.waitFor(() => expect(sync.getStatus().state).toBe('running'));
    sync.start({ trigger: 'add', movieIds: ['b'], queue: true });
    sync.start({ trigger: 'settings', queue: true }); // full

    release();
    await first;
    await vi.waitFor(() => expect(scrapeMovie).toHaveBeenCalledTimes(3)); // a, then every movie once
  });

  it('reports staleness', async () => {
    const { repo } = makeRepo();
    const sync = new SyncService(repo, { scrapeMovie: async () => scraped }, quiet);
    expect(sync.isStale(24)).toBe(true); // never synced
    await sync.run({ trigger: 'manual' });
    expect(sync.isStale(24)).toBe(false);
    expect(sync.isStale(24, Date.now() + 25 * 3_600_000)).toBe(true);
  });
});
