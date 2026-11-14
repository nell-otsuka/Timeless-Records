import cron from 'node-cron';
import type { SyncService } from './services/syncService';

interface SchedulerOptions {
  expression: string;
  timezone: string;
  staleAfterHours: number;
}

/** Daily sync via cron, plus a catch-up sync at boot if the machine missed the last run. */
export function startScheduler(sync: SyncService, { expression, timezone, staleAfterHours }: SchedulerOptions) {
  const task = cron.schedule(expression, () => void sync.run({ trigger: 'cron' }), { timezone });

  if (sync.isStale(staleAfterHours)) {
    console.log('[sync] data is stale or missing, syncing now');
    sync.start({ trigger: 'startup' });
  }

  return () => void task.stop();
}
