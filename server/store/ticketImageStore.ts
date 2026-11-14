import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/** What the ticket service needs from file storage. Swap the implementation (S3, …) without touching the service. */
export interface TicketImageStore {
  save(id: string, data: Uint8Array, contentType: string): Promise<void>;
  read(id: string): Promise<{ data: Buffer; contentType: string } | null>;
  remove(id: string): Promise<void>;
}

export const IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const SAFE_ID = /^[\w-]+$/;
const TYPE_BY_EXTENSION = Object.fromEntries(Object.entries(IMAGE_TYPES).map(([type, ext]) => [ext, type]));

/** Stores one file per ticket, named `<ticket id>.<extension>`. */
export class FileTicketImageStore implements TicketImageStore {
  constructor(private readonly dir: string) {}

  /** Ids end up in file names: never trust them. */
  private assertSafe(id: string) {
    if (!SAFE_ID.test(id)) throw new Error('invalid ticket id');
  }

  private path(id: string, extension: string) {
    return join(this.dir, `${id}.${extension}`);
  }

  async save(id: string, data: Uint8Array, contentType: string) {
    this.assertSafe(id);
    const extension = IMAGE_TYPES[contentType];
    if (!extension) throw new Error(`unsupported content type ${contentType}`);
    await mkdir(this.dir, { recursive: true });
    await this.remove(id); // a ticket has at most one file, whatever its type
    await writeFile(this.path(id, extension), data);
  }

  async read(id: string) {
    this.assertSafe(id);
    for (const [extension, contentType] of Object.entries(TYPE_BY_EXTENSION)) {
      try {
        return { data: await readFile(this.path(id, extension)), contentType };
      } catch {
        /* not this extension */
      }
    }
    return null;
  }

  async remove(id: string) {
    this.assertSafe(id);
    await Promise.all(Object.keys(TYPE_BY_EXTENSION).map((extension) => rm(this.path(id, extension), { force: true })));
  }
}
