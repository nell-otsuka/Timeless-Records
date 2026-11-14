import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * A tiny JSON-file database: whole document in memory, atomic writes (tmp file + rename),
 * and writes serialized so concurrent updates never interleave.
 */
export class JsonStore<T> {
  private data: T | null = null;
  private writing: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly file: string,
    private readonly initial: () => T,
  ) {}

  async read(): Promise<T> {
    if (this.data) return this.data;
    try {
      this.data = JSON.parse(await readFile(this.file, 'utf8')) as T;
    } catch {
      this.data = this.initial();
      await this.persist();
    }
    return this.data;
  }

  /** Applies `mutate` to the document and saves it. */
  async update(mutate: (data: T) => void): Promise<void> {
    const task = this.writing.then(async () => {
      const data = await this.read();
      mutate(data);
      await this.persist();
    });
    this.writing = task.catch(() => undefined);
    return task;
  }

  private async persist(): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    await writeFile(tmp, JSON.stringify(this.data, null, 2));
    await rename(tmp, this.file);
  }
}
