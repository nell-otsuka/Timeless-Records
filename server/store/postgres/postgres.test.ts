import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { describeRepositoryContract, SEED } from '../repositoryContract';
import { MIGRATIONS } from './migrations';
import { PostgresCoverStore } from './postgresCoverStore';
import { PostgresTicketImageStore } from './postgresTicketImageStore';
import { PostgresTrackerRepository } from './postgresTrackerRepository';

/**
 * Integration tests against a real PostgreSQL. They run only when TEST_DATABASE_URL is set, e.g.
 *   docker run -d --rm -p 55432:5432 -e POSTGRES_PASSWORD=test postgres:17-alpine
 *   TEST_DATABASE_URL=postgres://postgres:test@localhost:55432/postgres npm test
 * Every test works in its own schema, which is dropped afterwards.
 */
const url = process.env.TEST_DATABASE_URL;

/** A pool whose connections all use the given schema. */
const poolFor = (schema: string) => new pg.Pool({ connectionString: url, options: `-c search_path=${schema}` });

describe.skipIf(!url)('PostgreSQL', () => {
  const admin = new pg.Pool({ connectionString: url });
  afterAll(() => admin.end());

  const newSchema = async () => {
    const schema = `test_${randomUUID().replace(/-/g, '')}`;
    await admin.query(`create schema ${schema}`);
    return schema;
  };

  describeRepositoryContract('PostgresTrackerRepository', async () => {
    const schema = await newSchema();
    const pools: pg.Pool[] = [];
    const open = async () => {
      const pool = poolFor(schema);
      pools.push(pool);
      const repo = new PostgresTrackerRepository(pool, SEED);
      await repo.init();
      return repo;
    };
    return {
      repo: await open(),
      reopen: open,
      cleanup: async () => {
        await Promise.all(pools.map((pool) => pool.end()));
        await admin.query(`drop schema ${schema} cascade`);
      },
    };
  });

  describe('PostgresTicketImageStore', () => {
    let schema: string;
    let pool: pg.Pool;
    let repo: PostgresTrackerRepository;
    let store: PostgresTicketImageStore;

    beforeAll(async () => {
      schema = await newSchema();
      pool = poolFor(schema);
      repo = new PostgresTrackerRepository(pool, []);
      await repo.init();
      store = new PostgresTicketImageStore(pool);
      await repo.saveTicket({ id: 't1', title: 'x', cinemaName: 'c', startsAt: '2030-01-01T20:00:00', status: 'booked', createdAt: '2026-11-11T10:00:00.000Z' });
    });
    afterAll(async () => {
      await pool.end();
      await admin.query(`drop schema ${schema} cascade`);
    });

    it('stores, replaces and reads back binary data', async () => {
      await store.save('t1', new Uint8Array([137, 80, 78, 71, 0, 255]), 'image/png');
      await store.save('t1', new Uint8Array([1, 2, 3]), 'application/pdf');
      const file = await store.read('t1');
      expect(file?.contentType).toBe('application/pdf');
      expect([...(file?.data ?? [])]).toEqual([1, 2, 3]);
      expect(await store.read('nope')).toBeNull();
    });

    it('is deleted with its ticket', async () => {
      await store.save('t1', new Uint8Array([1]), 'image/png');
      await repo.deleteTicket('t1');
      expect(await store.read('t1')).toBeNull();
    });
  });

  describe('PostgresCoverStore', () => {
    let schema: string;
    let pool: pg.Pool;
    let store: PostgresCoverStore;

    beforeAll(async () => {
      schema = await newSchema();
      pool = poolFor(schema);
      await new PostgresTrackerRepository(pool, []).init();
      store = new PostgresCoverStore(pool);
    });
    afterAll(async () => {
      await pool.end();
      await admin.query(`drop schema ${schema} cascade`);
    });

    it('stores an image under the hash of its content, once, and reads it back', async () => {
      const data = new Uint8Array([137, 80, 78, 71, 0, 255]);
      const id = await store.save(data, 'image/png');
      expect(await store.save(data, 'image/png')).toBe(id);
      expect((await pool.query('select count(*)::int as n from covers')).rows[0].n).toBe(1);

      const cover = await store.read(id);
      expect(cover?.contentType).toBe('image/png');
      expect([...(cover?.data ?? [])]).toEqual([...data]);
      expect(await store.read('a'.repeat(64))).toBeNull();
    });
  });

  it('applies migrations once, even when run twice', async () => {
    const schema = await newSchema();
    const pool = poolFor(schema);
    try {
      const repo = new PostgresTrackerRepository(pool, SEED);
      await repo.init();
      await new PostgresTrackerRepository(pool, SEED).init();
      const { rows } = await pool.query('select count(*)::int as n from schema_migrations');
      expect(rows[0].n).toBe(MIGRATIONS.length);
    } finally {
      await pool.end();
      await admin.query(`drop schema ${schema} cascade`);
    }
  });
});
