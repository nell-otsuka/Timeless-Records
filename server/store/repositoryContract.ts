import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import type { Cinema, Movie, Screening, Ticket } from '../../shared/types';
import type { TrackerRepository } from './trackerRepository';

export interface RepositoryFixture {
  repo: TrackerRepository;
  /** A second instance on the same storage, like a restart of the server. */
  reopen: () => Promise<TrackerRepository>;
  cleanup: () => Promise<void>;
}

/** Creates a fresh, empty storage seeded with movies "a" and "b". */
export type CreateFixture = () => Promise<RepositoryFixture>;

const movie = (id: string): Movie => ({ id, title: id, allocineId: 1 });
const cinema = (id: string): Cinema => ({ id, name: id, area: 'Paris' });
const screening = (id: string, movieId: string, cinemaId: string): Screening => ({
  id,
  movieId,
  cinemaId,
  startsAt: '2030-01-01T20:00:00',
  formats: [],
});
const ticket = (id: string, overrides: Partial<Ticket> = {}): Ticket => ({
  id,
  title: `Film ${id}`,
  cinemaName: 'Pathé Docks 76',
  startsAt: '2030-01-01T20:00:00',
  status: 'booked',
  createdAt: '2026-11-11T10:00:00.000Z',
  ...overrides,
});

export const SEED = [movie('a'), movie('b')];

/** The behaviour every repository implementation (JSON file, PostgreSQL) must have. */
export function describeRepositoryContract(name: string, create: CreateFixture) {
  describe(`${name} (repository contract)`, () => {
    let fixture: RepositoryFixture;
    let repo: TrackerRepository;

    beforeEach(async () => {
      fixture = await create();
      repo = fixture.repo;
    });
    afterEach(() => fixture.cleanup());

    it('seeds a new database, once', async () => {
      expect((await repo.listMovies()).map((m) => m.id)).toEqual(['a', 'b']);
      expect((await repo.snapshot()).settings).toEqual({ cityIds: [] });

      await repo.init(); // a second init must not seed again
      expect((await repo.listMovies()).map((m) => m.id)).toEqual(['a', 'b']);
    });

    it('does not bring the seed back after everything was deleted', async () => {
      await repo.deleteMovie('a');
      await repo.deleteMovie('b');
      const reopened = await fixture.reopen();
      expect(await reopened.listMovies()).toEqual([]);
    });

    it('answers ping', async () => {
      await expect(repo.ping()).resolves.toBeUndefined();
    });

    describe('movies', () => {
      it('lists the newest movie first and keeps every field', async () => {
        await repo.addMovie({ id: 'c', title: 'C', allocineId: 42, director: 'D', coverUrl: '/c.png' });
        const movies = await repo.listMovies();
        expect(movies.map((m) => m.id)).toEqual(['c', 'a', 'b']);
        expect(movies[0]).toEqual({ id: 'c', title: 'C', allocineId: 42, director: 'D', coverUrl: '/c.png' });
      });

      it('changes the title and the cover, and removes the cover with an empty string', async () => {
        expect(await repo.updateMovie('a', { title: 'Renamed' })).toMatchObject({ id: 'a', title: 'Renamed' });
        expect(await repo.updateMovie('a', { coverUrl: '/api/covers/x' })).toMatchObject({ title: 'Renamed', coverUrl: '/api/covers/x' });
        expect((await repo.updateMovie('a', {}))?.coverUrl).toBe('/api/covers/x'); // nothing to change: nothing changes
        expect((await repo.updateMovie('a', { coverUrl: '' }))?.coverUrl).toBeUndefined();

        const stored = (await (await fixture.reopen()).listMovies()).find((m) => m.id === 'a');
        expect(stored).toMatchObject({ title: 'Renamed' });
        expect(stored?.coverUrl).toBeUndefined();
        expect((await repo.listMovies()).find((m) => m.id === 'b')?.title).toBe('b'); // other movies are untouched
      });

      it('edits every field, and clears them with "" or null', async () => {
        const edited = await repo.updateMovie('a', { director: 'Ridley', allocineId: 42 });
        expect(edited).toMatchObject({ director: 'Ridley', allocineId: 42 });

        const cleared = await repo.updateMovie('a', { director: '', allocineId: null });
        expect(cleared?.director).toBeUndefined();
        expect(cleared?.allocineId).toBeUndefined();
      });

      it('answers undefined when the movie to change does not exist', async () => {
        expect(await repo.updateMovie('nope', { title: 'x' })).toBeUndefined();
      });

      it('deletes a movie with its screenings and the cinemas only it used', async () => {
        await repo.replaceScreenings('a', [cinema('only-a'), cinema('shared')], [screening('s1', 'a', 'only-a'), screening('s2', 'a', 'shared')]);
        await repo.replaceScreenings('b', [cinema('shared')], [screening('s3', 'b', 'shared')]);

        expect(await repo.deleteMovie('a')).toBe(true);

        const snapshot = await repo.snapshot();
        expect(snapshot.movies.map((m) => m.id)).toEqual(['b']);
        expect(snapshot.screenings.map((s) => s.id)).toEqual(['s3']);
        expect(snapshot.cinemas.map((c) => c.id)).toEqual(['shared']);
        expect(await repo.deleteMovie('a')).toBe(false);
      });
    });

    describe('screenings', () => {
      it("replaces only one movie's screenings", async () => {
        await repo.replaceScreenings('a', [cinema('c1')], [screening('s1', 'a', 'c1')]);
        await repo.replaceScreenings('b', [cinema('c2')], [screening('s2', 'b', 'c2')]);
        await repo.replaceScreenings('a', [cinema('c1')], [screening('s3', 'a', 'c1')]);
        expect((await repo.snapshot()).screenings.map((s) => s.id).sort()).toEqual(['s2', 's3']);
      });

      it('forgets cinemas that no screening uses any more', async () => {
        await repo.replaceScreenings('a', [cinema('old'), cinema('kept')], [screening('s1', 'a', 'old'), screening('s2', 'a', 'kept')]);
        await repo.replaceScreenings('a', [cinema('kept')], [screening('s3', 'a', 'kept')]);
        expect((await repo.snapshot()).cinemas.map((c) => c.id)).toEqual(['kept']);
      });

      it('round-trips every field and updates a cinema that changed', async () => {
        const full: Screening = { ...screening('s1', 'a', 'c1'), room: 'salle 4', formats: ['vost', 'imax'], bookingUrl: 'https://book/1' };
        await repo.replaceScreenings('a', [{ ...cinema('c1'), address: '1 rue X' }], [full]);
        await repo.replaceScreenings('a', [{ id: 'c1', name: 'renamed', area: 'Rouen' }], [full]);

        const snapshot = await repo.snapshot();
        expect(snapshot.screenings).toEqual([full]);
        expect(snapshot.cinemas).toEqual([{ id: 'c1', name: 'renamed', area: 'Rouen' }]);
      });
    });

    describe('settings, cities and sync', () => {
      it('persists the global city selection', async () => {
        await repo.saveSettings({ cityIds: [3, 9] });
        expect(await (await fixture.reopen()).getSettings()).toEqual({ cityIds: [3, 9] });
        await repo.saveSettings({ cityIds: [] });
        expect(await repo.getSettings()).toEqual({ cityIds: [] });
      });

      it('merges known cities without duplicates, sorted by name', async () => {
        await repo.addKnownCities([
          { id: 2, name: 'Rouen' },
          { id: 1, name: 'Angers' },
        ]);
        await repo.addKnownCities([
          { id: 2, name: 'Rouen' },
          { id: 3, name: 'Paris' },
        ]);
        await repo.addKnownCities([]);
        expect((await repo.snapshot()).cities.map((c) => c.name)).toEqual(['Angers', 'Paris', 'Rouen']);
      });

      it('remembers the last sync across restarts', async () => {
        expect(await repo.getLastSync()).toBeUndefined();
        const result = { ok: true, movies: 2, screenings: 7, errors: ['x'] };
        await repo.saveLastSync('2026-11-11T17:00:00.000Z', result);
        await repo.saveLastSync('2026-11-12T04:00:00.000Z', result);
        expect(await (await fixture.reopen()).getLastSync()).toEqual({ finishedAt: '2026-11-12T04:00:00.000Z', result });
      });
    });

    describe('tickets', () => {
      it('saves, reads, updates and deletes a ticket, keeping every field', async () => {
        const full = ticket('t1', {
          movieId: 'a',
          coverUrl: '/c.png',
          cinemaId: 'docks',
          endsAt: '2026-11-14T20:15:00',
          room: 'Salle 5',
          seats: 'H30, H29',
          places: 2,
          screeningId: 's9',
          image: { contentType: 'image/png', version: 2 },
        });
        await repo.saveTicket(full);
        expect(await repo.getTicket('t1')).toEqual(full);
        expect(await repo.listTickets()).toEqual([full]);

        await repo.saveTicket({ ...full, title: 'Edited', seats: undefined, coverUrl: undefined });
        expect(await repo.getTicket('t1')).toMatchObject({ title: 'Edited', seats: undefined, coverUrl: undefined, room: 'Salle 5' });
        expect(await repo.listTickets()).toHaveLength(1);

        expect(await repo.deleteTicket('t1')).toBe(true);
        expect(await repo.getTicket('t1')).toBeUndefined();
        expect(await repo.deleteTicket('t1')).toBe(false);
      });

      it('lists tickets in the order they were created', async () => {
        await repo.saveTicket(ticket('t1'));
        await repo.saveTicket(ticket('t2'));
        expect((await repo.listTickets()).map((t) => t.id)).toEqual(['t1', 't2']);
      });

      it('accepts a ticket linked to a movie that is not on the list', async () => {
        await expect(repo.saveTicket(ticket('t1', { movieId: 'not-on-the-list' }))).resolves.toBeUndefined();
        expect(await repo.getTicket('t1')).toBeDefined();
      });

      it('keeps a ticket when its movie is removed from the watch list', async () => {
        await repo.saveTicket(ticket('t1', { movieId: 'a' }));
        await repo.deleteMovie('a');
        expect(await repo.getTicket('t1')).toMatchObject({ title: 'Film t1' });
      });

      it('survives a restart', async () => {
        await repo.saveTicket(ticket('t1', { endsAt: '2030-01-01T21:39:00' }));
        expect(await (await fixture.reopen()).getTicket('t1')).toMatchObject({ endsAt: '2030-01-01T21:39:00' });
      });
    });
  });
}
