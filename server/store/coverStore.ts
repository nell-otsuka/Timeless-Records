import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Stores uploaded poster images. Implemented by PostgreSQL (production) and a folder (local, tests). */
export interface CoverStore {
  /** Stores an image and returns its id: the SHA-256 of its content, so the same image is stored once. */
  save(data: Uint8Array, contentType: string): Promise<string>;
  read(id: string): Promise<{ data: Buffer; contentType: string } | null>;
}

export const COVER_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
export const MAX_COVER_BYTES = 5 * 1024 * 1024;

export const COVER_ID = /^[a-f0-9]{64}$/;
export const hashCover = (data: Uint8Array): string => createHash('sha256').update(data).digest('hex');

const TYPE_BY_EXTENSION = Object.fromEntries(Object.entries(COVER_TYPES).map(([type, ext]) => [ext, type]));

/** One file per cover, named `<sha256>.<extension>`. */
export class FileCoverStore implements CoverStore {
  constructor(private readonly dir: string) {}

  async save(data: Uint8Array, contentType: string) {
    const extension = COVER_TYPES[contentType];
    if (!extension) throw new Error(`unsupported content type ${contentType}`);
    const id = hashCover(data);
    const file = join(this.dir, `${id}.${extension}`);
    await mkdir(this.dir, { recursive: true });
    if (!(await stat(file).catch(() => null))) await writeFile(file, data);
    return id;
  }

  async read(id: string) {
    if (!COVER_ID.test(id)) return null; // ids end up in file names: never trust them
    for (const [extension, contentType] of Object.entries(TYPE_BY_EXTENSION)) {
      try {
        return { data: await readFile(join(this.dir, `${id}.${extension}`)), contentType };
      } catch {
        /* not this extension */
      }
    }
    return null;
  }
}
