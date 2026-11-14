import type pg from 'pg';
import type { TicketImageStore } from '../ticketImageStore';

/** Ticket files (QR screenshots, PDFs) stored in the database, so one backup covers everything. */
export class PostgresTicketImageStore implements TicketImageStore {
  constructor(private readonly pool: pg.Pool) {}

  async save(id: string, data: Uint8Array, contentType: string) {
    await this.pool.query(
      `insert into ticket_files (ticket_id, content_type, data) values ($1, $2, $3)
       on conflict (ticket_id) do update set content_type = excluded.content_type, data = excluded.data`,
      [id, contentType, Buffer.from(data)],
    );
  }

  async read(id: string) {
    const { rows } = await this.pool.query<{ content_type: string; data: Buffer }>(
      'select content_type, data from ticket_files where ticket_id = $1',
      [id],
    );
    return rows[0] ? { data: rows[0].data, contentType: rows[0].content_type } : null;
  }

  async remove(id: string) {
    await this.pool.query('delete from ticket_files where ticket_id = $1', [id]);
  }
}
