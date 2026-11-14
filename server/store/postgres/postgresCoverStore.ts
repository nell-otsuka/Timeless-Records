import type pg from 'pg';
import { hashCover, type CoverStore } from '../coverStore';

/** Posters uploaded from the app, stored in the database. */
export class PostgresCoverStore implements CoverStore {
  constructor(private readonly pool: pg.Pool) {}

  async save(data: Uint8Array, contentType: string) {
    const id = hashCover(data);
    await this.pool.query(
      'insert into covers (id, content_type, data) values ($1, $2, $3) on conflict (id) do nothing',
      [id, contentType, Buffer.from(data)],
    );
    return id;
  }

  async read(id: string) {
    const { rows } = await this.pool.query<{ content_type: string; data: Buffer }>(
      'select content_type, data from covers where id = $1',
      [id],
    );
    return rows[0] ? { data: rows[0].data, contentType: rows[0].content_type } : null;
  }
}
