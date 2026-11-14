import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileTicketImageStore } from './ticketImageStore';

let dir: string;
let store: FileTicketImageStore;
const bytes = (text: string) => new TextEncoder().encode(text);

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'tickets-'));
  store = new FileTicketImageStore(join(dir, 'files'));
});
afterEach(() => rm(dir, { recursive: true, force: true }));

describe('FileTicketImageStore', () => {
  it('saves and reads a file with its content type', async () => {
    await store.save('abc', bytes('png-data'), 'image/png');
    const file = await store.read('abc');
    expect(file?.contentType).toBe('image/png');
    expect(file?.data.toString()).toBe('png-data');
  });

  it('keeps a single file per ticket when the type changes', async () => {
    await store.save('abc', bytes('one'), 'image/png');
    await store.save('abc', bytes('two'), 'application/pdf');
    expect(await readdir(join(dir, 'files'))).toEqual(['abc.pdf']);
    expect((await store.read('abc'))?.contentType).toBe('application/pdf');
  });

  it('returns null for an unknown ticket and removes files', async () => {
    expect(await store.read('nope')).toBeNull();
    await store.save('abc', bytes('x'), 'image/webp');
    await store.remove('abc');
    expect(await store.read('abc')).toBeNull();
  });

  it('refuses ids that could escape the folder, and unsupported types', async () => {
    await expect(store.save('../evil', bytes('x'), 'image/png')).rejects.toThrow(/invalid/);
    await expect(store.read('..\\evil')).rejects.toThrow(/invalid/);
    await expect(store.save('abc', bytes('x'), 'image/svg+xml')).rejects.toThrow(/unsupported/);
  });
});
