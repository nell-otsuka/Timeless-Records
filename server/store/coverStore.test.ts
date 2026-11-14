import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileCoverStore, hashCover } from './coverStore';

let dir: string;
let store: FileCoverStore;
const bytes = (text: string) => new TextEncoder().encode(text);

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'covers-'));
  store = new FileCoverStore(join(dir, 'files'));
});
afterEach(() => rm(dir, { recursive: true, force: true }));

describe('FileCoverStore', () => {
  it('names a cover after the hash of its content and reads it back', async () => {
    const id = await store.save(bytes('poster'), 'image/png');
    expect(id).toBe(hashCover(bytes('poster')));
    const cover = await store.read(id);
    expect(cover?.contentType).toBe('image/png');
    expect(cover?.data.toString()).toBe('poster');
  });

  it('stores the same image once', async () => {
    await store.save(bytes('poster'), 'image/png');
    await store.save(bytes('poster'), 'image/png');
    expect(await readdir(join(dir, 'files'))).toHaveLength(1);
  });

  it('returns null for an unknown cover, and for ids that could escape the folder', async () => {
    expect(await store.read('a'.repeat(64))).toBeNull();
    expect(await store.read('../secret')).toBeNull();
    expect(await store.read('x')).toBeNull();
  });

  it('refuses types it does not serve', async () => {
    await expect(store.save(bytes('x'), 'image/svg+xml')).rejects.toThrow(/unsupported/);
  });
});
