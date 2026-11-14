import type { SyncStatus } from '@/types/movie';
import type { SyncLabel } from '@/types/view-models';

export const formatRelativeTime = (iso: string, now: Date): string => {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
};

/** Turns the server's sync status into the text shown next to the refresh button. */
export const describeSync = (sync: SyncStatus, now: Date): SyncLabel => {
  const issues = sync.lastResult?.errors ?? [];

  if (sync.state === 'running') {
    const { done = 0, total = 0, label } = sync.progress ?? {};
    const detail = total > 0 ? ` ${Math.min(done + 1, total)}/${total}${label ? ` · ${label}` : ''}` : '';
    return { running: true, text: `refreshing…${detail}`, issues };
  }
  if (!sync.finishedAt) return { running: false, text: 'not synced yet', issues };

  const when = `updated ${formatRelativeTime(sync.finishedAt, now)}`;
  const problems = sync.lastResult && !sync.lastResult.ok ? ' · last sync failed' : issues.length ? ` · ${issues.length} issue${issues.length > 1 ? 's' : ''}` : '';
  return { running: false, text: when + problems, issues };
};
