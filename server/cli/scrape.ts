import { createContainer } from '../container';

/** One-off sync from the terminal: `npm run scrape`. Handy for debugging or an OS-level scheduler. */
const { sync } = await createContainer();
const result = await sync.run({ trigger: 'manual' });

if (!result) console.log('a sync is already running');
else {
  result.errors.forEach((error) => console.warn(`  ! ${error}`));
  process.exitCode = result.ok ? 0 : 1;
}
