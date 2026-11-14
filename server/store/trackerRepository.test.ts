import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describeRepositoryContract, SEED } from './repositoryContract';
import { JsonTrackerRepository } from './trackerRepository';

describeRepositoryContract('JsonTrackerRepository', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tracker-'));
  const file = join(dir, 'db.json');
  const open = async () => {
    const repo = new JsonTrackerRepository(file, SEED);
    await repo.init();
    return repo;
  };
  return { repo: await open(), reopen: open, cleanup: () => rm(dir, { recursive: true, force: true }) };
});
