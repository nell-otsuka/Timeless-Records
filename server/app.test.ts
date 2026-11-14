import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Ticket } from '../shared/types';
import { createApp } from './app';
import type { Container } from './container';
import { CoverService } from './services/coverService';
import { MovieService } from './services/movieService';
import type { SyncService } from './services/syncService';
import { TicketService } from './services/ticketService';
import { FileCoverStore } from './store/coverStore';
import { FileTicketImageStore } from './store/ticketImageStore';
import { JsonTrackerRepository } from './store/trackerRepository';

let dir: string;
let repo: JsonTrackerRepository;
let app: ReturnType<typeof createApp>;
let start: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'app-'));
  repo = new JsonTrackerRepository(join(dir, 'db.json'), []);
  start = vi.fn(() => true);
  const container = {
    repo,
    movies: new MovieService(repo, { fetchFilmMeta: vi.fn() }),
    tickets: new TicketService(repo, new FileTicketImageStore(join(dir, 'tickets'))),
    covers: new CoverService(new FileCoverStore(join(dir, 'covers'))),
    sync: { getStatus: () => ({ state: 'idle' }), start } as unknown as SyncService,
    close: async () => {},
  } satisfies Container;
  app = createApp(container);
});
afterEach(() => rm(dir, { recursive: true, force: true }));

const json = (body: unknown, method = 'POST') => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const ticket = { title: 'Dune', cinemaName: 'Pathé Docks 76', startsAt: '2026-11-14T17:30', places: 2 };

const createTicket = async (overrides = {}): Promise<Ticket> =>
  (await app.request('/api/tickets', json({ ...ticket, ...overrides }))).json();

describe('health', () => {
  it('is ok while the database answers', async () => {
    const response = await app.request('/api/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('answers 503 when the database is unreachable', async () => {
    const down = createApp({
      repo: { ping: async () => Promise.reject(new Error('connection refused')) } as unknown as Container['repo'],
      movies: {} as Container['movies'],
      tickets: {} as Container['tickets'],
      covers: {} as Container['covers'],
      sync: {} as Container['sync'],
      close: async () => {},
    });
    const response = await down.request('/api/health');
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false });
  });
});

describe('covers API', () => {
  const upload = (file: File) => {
    const form = new FormData();
    form.set('file', file);
    return app.request('/api/covers', { method: 'POST', body: form });
  };
  const png = (bytes: number[] = [137, 80, 78, 71]) => new File([new Uint8Array(bytes)], 'poster.png', { type: 'image/png' });

  it('stores a poster, answers its url, and serves it with safe, cacheable headers', async () => {
    const response = await upload(png());
    expect(response.status).toBe(201);
    const { url } = (await response.json()) as { url: string };
    expect(url).toMatch(/^\/api\/covers\/[a-f0-9]{64}$/);

    const served = await app.request(url);
    expect(served.status).toBe(200);
    expect(served.headers.get('content-type')).toBe('image/png');
    expect(served.headers.get('cache-control')).toContain('immutable');
    expect(served.headers.get('x-content-type-options')).toBe('nosniff');
    expect(new Uint8Array(await served.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]));
  });

  it('gives the same url to the same image, and another one to a different image', async () => {
    const first = ((await (await upload(png())).json()) as { url: string }).url;
    const again = ((await (await upload(png())).json()) as { url: string }).url;
    const other = ((await (await upload(png([1, 2, 3]))).json()) as { url: string }).url;
    expect(again).toBe(first);
    expect(other).not.toBe(first);
  });

  it('rejects other file types, empty files, a missing file and oversized images', async () => {
    expect((await upload(new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' }))).status).toBe(400);
    expect((await upload(new File(['%PDF'], 'x.pdf', { type: 'application/pdf' }))).status).toBe(400);
    expect((await upload(new File([], 'empty.png', { type: 'image/png' }))).status).toBe(400);
    expect((await app.request('/api/covers', { method: 'POST', body: new FormData() })).status).toBe(400);
    expect((await upload(new File([new Uint8Array(6 * 1024 * 1024)], 'big.png', { type: 'image/png' }))).status).toBe(413);
  });

  it('answers 404 for a cover that does not exist or an id that is not a hash', async () => {
    expect((await app.request(`/api/covers/${'a'.repeat(64)}`)).status).toBe(404);
    expect((await app.request('/api/covers/not-a-hash')).status).toBe(404);
  });
});

describe('movies API', () => {
  beforeEach(() => repo.addMovie({ id: 'm1', title: 'Old title', coverUrl: 'https://img.example/old.jpg' }));

  it('renames a movie and changes its cover with an uploaded poster', async () => {
    const form = new FormData();
    form.set('file', new File([new Uint8Array([1, 2, 3])], 'p.png', { type: 'image/png' }));
    const { url } = (await (await app.request('/api/covers', { method: 'POST', body: form })).json()) as { url: string };

    const response = await app.request('/api/movies/m1', json({ title: '  New title ', coverUrl: url }, 'PUT'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 'm1', title: 'New title', coverUrl: url });
  });

  it('leaves what is not mentioned alone, and removes the cover with an empty string', async () => {
    expect(((await (await app.request('/api/movies/m1', json({ title: 'Only the title' }, 'PUT'))).json()) as { coverUrl: string }).coverUrl).toBe(
      'https://img.example/old.jpg',
    );
    const removed = (await (await app.request('/api/movies/m1', json({ coverUrl: '' }, 'PUT'))).json()) as { coverUrl?: string };
    expect(removed.coverUrl).toBeUndefined();
  });

  it('edits the other fields, re-links to another AlloCiné film and refreshes its screenings', async () => {
    const response = await app.request(
      '/api/movies/m1',
      json({ allocineRef: 'https://www.allocine.fr/film/fichefilm_gen_cfilm=27063.html', director: ' Jeunet ' }, 'PUT'),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ allocineId: 27063, director: 'Jeunet' });
    expect(start).toHaveBeenCalledWith({ trigger: 'edit', movieIds: ['m1'], queue: true });

    const unlinked = (await (await app.request('/api/movies/m1', json({ allocineRef: '' }, 'PUT'))).json()) as { allocineId?: number };
    expect(unlinked.allocineId).toBeUndefined();
    expect(start).toHaveBeenCalledTimes(1); // unlinking has nothing to refresh
  });

  it('refuses an AlloCiné film another movie already uses, and invalid values', async () => {
    await repo.addMovie({ id: 'm2', title: 'Other', allocineId: 99 });
    expect((await app.request('/api/movies/m1', json({ allocineRef: '99' }, 'PUT'))).status).toBe(409);
    expect((await app.request('/api/movies/m1', json({ allocineRef: 'https://example.com/x' }, 'PUT'))).status).toBe(400);
    expect((await app.request('/api/movies/m1', json({ director: 7 }, 'PUT'))).status).toBe(400);
  });

  it('answers 400 for an empty title or a cover that is not an image url, 404 for an unknown movie', async () => {
    expect((await app.request('/api/movies/m1', json({ title: '   ' }, 'PUT'))).status).toBe(400);
    expect((await app.request('/api/movies/m1', json({ coverUrl: 'javascript:alert(1)' }, 'PUT'))).status).toBe(400);
    expect((await app.request('/api/movies/m1', json({ coverUrl: 42 }, 'PUT'))).status).toBe(400);
    expect((await app.request('/api/movies/nope', json({ title: 'x' }, 'PUT'))).status).toBe(404);
  });
});

describe('tickets API', () => {
  it('creates, lists (sorted by start time), updates and deletes tickets', async () => {
    const late = await createTicket({ title: 'Late', startsAt: '2026-12-01T20:00' });
    const early = await createTicket({ title: 'Early', startsAt: '2026-11-01T20:00' });

    const listed: Ticket[] = await (await app.request('/api/tickets')).json();
    expect(listed.map((t) => t.title)).toEqual(['Early', 'Late']);

    const edited = await app.request(`/api/tickets/${early.id}`, json({ ...ticket, title: 'Edited' }, 'PUT'));
    expect(edited.status).toBe(200);
    expect(((await edited.json()) as Ticket).title).toBe('Edited');

    expect((await app.request(`/api/tickets/${late.id}`, { method: 'DELETE' })).status).toBe(204);
    expect(((await (await app.request('/api/tickets')).json()) as Ticket[]).map((t) => t.id)).toEqual([early.id]);
  });

  it('answers 400 with a readable message for an invalid ticket, 404 for an unknown one', async () => {
    const bad = await app.request('/api/tickets', json({ ...ticket, startsAt: 'tomorrow' }));
    expect(bad.status).toBe(400);
    expect(((await bad.json()) as { error: string }).error).toMatch(/startsAt/);

    expect((await app.request('/api/tickets/nope', json(ticket, 'PUT'))).status).toBe(404);
    expect((await app.request('/api/tickets/nope', { method: 'DELETE' })).status).toBe(404);
  });

  it('keeps a tentative ticket apart from a booked one, and books it by changing its status', async () => {
    const planned = await createTicket({ title: 'Alien', status: 'tentative' });
    expect(planned.status).toBe('tentative');
    expect((await createTicket({ title: 'Dune' })).status).toBe('booked');

    const booked = (await (await app.request(`/api/tickets/${planned.id}`, json({ ...ticket, title: 'Alien', status: 'booked' }, 'PUT'))).json()) as Ticket;
    expect(booked.status).toBe('booked');
    expect((await app.request('/api/tickets', json({ ...ticket, status: 'owned' }))).status).toBe(400);
  });

  describe('ticket file', () => {
    const upload = (id: string, file: File) => {
      const form = new FormData();
      form.set('file', file);
      return app.request(`/api/tickets/${id}/image`, { method: 'PUT', body: form });
    };

    it('uploads, serves with safe headers, bumps the version, and removes', async () => {
      const { id } = await createTicket();

      const first = await upload(id, new File([new Uint8Array([137, 80, 78, 71])], 'qr.png', { type: 'image/png' }));
      expect(first.status).toBe(200);
      expect(((await first.json()) as Ticket).image).toEqual({ contentType: 'image/png', version: 1 });

      const served = await app.request(`/api/tickets/${id}/image`);
      expect(served.status).toBe(200);
      expect(served.headers.get('content-type')).toBe('image/png');
      expect(served.headers.get('x-content-type-options')).toBe('nosniff');
      expect(served.headers.get('content-security-policy')).toContain('sandbox');
      expect(new Uint8Array(await served.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]));

      const second = await upload(id, new File([new Uint8Array([1, 2, 3])], 't.pdf', { type: 'application/pdf' }));
      expect(((await second.json()) as Ticket).image).toEqual({ contentType: 'application/pdf', version: 2 });

      const removed = await app.request(`/api/tickets/${id}/image`, { method: 'DELETE' });
      expect(((await removed.json()) as Ticket).image).toBeUndefined();
      expect((await app.request(`/api/tickets/${id}/image`)).status).toBe(404);
    });

    it('keeps the file when the ticket is edited, and deletes it with the ticket', async () => {
      const { id } = await createTicket();
      await upload(id, new File([new Uint8Array([1])], 'qr.png', { type: 'image/png' }));

      const edited = (await (await app.request(`/api/tickets/${id}`, json({ ...ticket, room: 'Salle 4' }, 'PUT'))).json()) as Ticket;
      expect(edited.image?.version).toBe(1);

      await app.request(`/api/tickets/${id}`, { method: 'DELETE' });
      expect((await app.request(`/api/tickets/${id}/image`)).status).toBe(404);
    });

    it('rejects other file types, empty files, missing files and oversized uploads', async () => {
      const { id } = await createTicket();
      expect((await upload(id, new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' }))).status).toBe(400);
      expect((await upload(id, new File([], 'empty.png', { type: 'image/png' }))).status).toBe(400);
      expect((await app.request(`/api/tickets/${id}/image`, { method: 'PUT', body: new FormData() })).status).toBe(400);

      const big = new File([new Uint8Array(9 * 1024 * 1024)], 'big.png', { type: 'image/png' });
      expect((await upload(id, big)).status).toBe(413);
    });

    it('answers 404 when uploading to an unknown ticket', async () => {
      const response = await upload('nope', new File([new Uint8Array([1])], 'qr.png', { type: 'image/png' }));
      expect(response.status).toBe(404);
    });
  });
});
