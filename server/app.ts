import { existsSync } from 'node:fs';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { NewMovie, TrackerSnapshot } from '../shared/types';
import { config } from './config';
import type { Container } from './container';
import { ConflictError, NotFoundError, UpstreamError, ValidationError } from './services/errors';
import { MAX_COVER_BYTES } from './store/coverStore';
import { MAX_IMAGE_BYTES } from './store/ticketImageStore';

const optionalString = (value: unknown) => (typeof value === 'string' ? value : undefined);

const toNewMovie = (body: unknown): NewMovie => {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  return {
    title: optionalString(b.title),
    allocineRef: optionalString(b.allocineRef),
    director: optionalString(b.director),
    coverUrl: optionalString(b.coverUrl),
  };
};

/** Accepts `{ cityIds: [1, 2] }`; returns de-duplicated integer ids. */
const toCityIds = (body: unknown): number[] => {
  const ids = (body as { cityIds?: unknown } | null)?.cityIds;
  if (!Array.isArray(ids) || !ids.every((id) => Number.isInteger(id) && id > 0)) {
    throw new ValidationError('cityIds must be a list of city ids');
  }
  return [...new Set(ids as number[])];
};

/** Uploaded files are untrusted: never sniffed, never allowed to run anything. Their URLs never change content. */
const FILE_HEADERS = {
  'Cache-Control': 'private, max-age=31536000, immutable',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
} as const;

export function createApp({ repo, movies, tickets, covers, sync }: Container) {
  const app = new Hono();

  /** For load balancers and Docker health checks. 503 while the database is unreachable. Never calls AlloCiné. */
  app.get('/api/health', async (c) => {
    try {
      await repo.ping();
      return c.json({ ok: true });
    } catch {
      return c.json({ ok: false }, 503);
    }
  });

  app.get('/api/tracker', async (c) => {
    const snapshot: TrackerSnapshot = { ...(await repo.snapshot()), sync: sync.getStatus() };
    return c.json(snapshot);
  });

  app.get('/api/sync', (c) => c.json(sync.getStatus()));

  /** Manual refresh. 202 = started, 409 = one is already running. */
  app.post('/api/refresh', (c) => {
    const started = sync.start({ trigger: 'manual' });
    return c.json(sync.getStatus(), started ? 202 : 409);
  });

  app.post('/api/movies', async (c) => {
    const movie = await movies.add(toNewMovie(await c.req.json().catch(() => ({}))));
    if (movie.allocineId !== undefined) sync.start({ trigger: 'add', movieIds: [movie.id], queue: true });
    return c.json(movie, 201);
  });

  app.put('/api/movies/:id', async (c) => {
    const { movie, relinked } = await movies.update(c.req.param('id'), await c.req.json().catch(() => null));
    if (relinked) sync.start({ trigger: 'edit', movieIds: [movie.id], queue: true });
    return c.json(movie);
  });

  app.delete('/api/movies/:id', async (c) => {
    await movies.remove(c.req.param('id'));
    return c.body(null, 204);
  });

  /** Global city selection. Saving re-syncs every movie so the screenings match the new cities. */
  app.put('/api/settings', async (c) => {
    const settings = { cityIds: toCityIds(await c.req.json().catch(() => null)) };
    await repo.saveSettings(settings);
    sync.start({ trigger: 'settings', queue: true });
    return c.json(settings);
  });

  app.get('/api/tickets', async (c) => c.json(await tickets.list()));

  app.post('/api/tickets', async (c) => c.json(await tickets.create(await c.req.json().catch(() => null)), 201));

  app.put('/api/tickets/:id', async (c) =>
    c.json(await tickets.update(c.req.param('id'), await c.req.json().catch(() => null))),
  );

  app.delete('/api/tickets/:id', async (c) => {
    await tickets.remove(c.req.param('id'));
    return c.body(null, 204);
  });

  /** Attach (or replace) the ticket's QR screenshot / PDF. Multipart form with a `file` field. */
  app.put(
    '/api/tickets/:id/image',
    bodyLimit({
      maxSize: MAX_IMAGE_BYTES + 512 * 1024, // the file plus multipart overhead
      onError: (c) => c.json({ error: 'that file is too large (8 MB max)' }, 413),
    }),
    async (c) => {
      const body = await c.req.parseBody().catch(() => ({}) as Record<string, unknown>);
      const file = body.file;
      if (!(file instanceof File)) throw new ValidationError('choose a file to upload');
      const bytes = new Uint8Array(await file.arrayBuffer());
      return c.json(await tickets.setImage(c.req.param('id'), { bytes, contentType: file.type }));
    },
  );

  app.delete('/api/tickets/:id/image', async (c) => c.json(await tickets.removeImage(c.req.param('id'))));

  app.get('/api/tickets/:id/image', async (c) => {
    const { data, contentType } = await tickets.getImage(c.req.param('id'));
    return new Response(new Uint8Array(data), { headers: { 'Content-Type': contentType, ...FILE_HEADERS } });
  });

  /** Upload a poster (multipart form, field `file`). Answers the URL to use as a `coverUrl`. */
  app.post(
    '/api/covers',
    bodyLimit({
      maxSize: MAX_COVER_BYTES + 512 * 1024, // the image plus multipart overhead
      onError: (c) => c.json({ error: 'that image is too large (5 MB max)' }, 413),
    }),
    async (c) => {
      const body = await c.req.parseBody().catch(() => ({}) as Record<string, unknown>);
      const file = body.file;
      if (!(file instanceof File)) throw new ValidationError('choose an image to upload');
      const bytes = new Uint8Array(await file.arrayBuffer());
      return c.json(await covers.upload({ bytes, contentType: file.type }), 201);
    },
  );

  /** The content hash is in the URL, so a poster can be cached forever. */
  app.get('/api/covers/:id', async (c) => {
    const { data, contentType } = await covers.get(c.req.param('id'));
    return new Response(new Uint8Array(data), { headers: { 'Content-Type': contentType, ...FILE_HEADERS } });
  });

  app.onError((error, c) => {
    if (error instanceof ValidationError) return c.json({ error: error.message }, 400);
    if (error instanceof NotFoundError) return c.json({ error: error.message }, 404);
    if (error instanceof ConflictError) return c.json({ error: error.message }, 409);
    if (error instanceof UpstreamError) return c.json({ error: error.message }, 502);
    console.error(error);
    return c.json({ error: 'something went wrong' }, 500);
  });

  // production: serve the built web app from the same process
  if (existsSync(config.staticDir)) {
    app.use('/*', serveStatic({ root: './dist' }));
    app.get('*', serveStatic({ path: './dist/index.html' }));
  }

  return app;
}
