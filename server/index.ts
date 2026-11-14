import { serve } from '@hono/node-server';
import { createApp } from './app';
import { config } from './config';
import { createContainer } from './container';
import { startScheduler } from './scheduler';

const container = await createContainer();
const app = createApp(container);

const stopScheduler = startScheduler(container.sync, {
  expression: config.cron,
  timezone: config.timezone,
  staleAfterHours: config.staleAfterHours,
});

const server = serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  console.log(`[api] listening on :${port}  (daily sync: "${config.cron}" ${config.timezone})`);
});

/** Docker/hosts send SIGTERM on stop or redeploy: stop taking requests and exit cleanly. */
const shutdown = (signal: string) => {
  console.log(`[api] ${signal} received, shutting down`);
  stopScheduler();
  server.close(() => void container.close().finally(() => process.exit(0)));
  setTimeout(() => process.exit(0), 5_000).unref(); // do not hang on open keep-alive connections
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
