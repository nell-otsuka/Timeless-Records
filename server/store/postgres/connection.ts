import pg from 'pg';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Opens a connection pool and waits until the database accepts queries.
 * A database container takes a few seconds to start, so we retry instead of crashing.
 */
export async function connectPostgres(connectionString: string, { attempts = 30, delayMs = 1000 } = {}): Promise<pg.Pool> {
  const pool = new pg.Pool({ connectionString, max: 10 });
  // an idle connection dropped by the server must not crash the process
  pool.on('error', (error) => console.error(`[db] connection error: ${error.message}`));

  for (let attempt = 1; ; attempt++) {
    try {
      await pool.query('select 1');
      return pool;
    } catch (error) {
      if (attempt >= attempts) {
        await pool.end().catch(() => undefined);
        throw error;
      }
      console.log(`[db] waiting for the database (${attempt}/${attempts})…`);
      await sleep(delayMs);
    }
  }
}
