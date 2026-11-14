import { describe, expect, it } from 'vitest';
import type { SyncStatus } from '@/types/movie';
import { describeSync, formatRelativeTime } from './sync';

const now = new Date('2026-11-16T12:00:00Z');
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

describe('formatRelativeTime', () => {
  it('picks a sensible unit', () => {
    expect(formatRelativeTime(ago(20_000), now)).toBe('just now');
    expect(formatRelativeTime(ago(5 * 60_000), now)).toBe('5 min ago');
    expect(formatRelativeTime(ago(3 * 3_600_000), now)).toBe('3 h ago');
    expect(formatRelativeTime(ago(24 * 3_600_000), now)).toBe('yesterday');
    expect(formatRelativeTime(ago(72 * 3_600_000), now)).toBe('3 days ago');
  });
});

describe('describeSync', () => {
  it('describes a sync that never ran', () => {
    expect(describeSync({ state: 'idle' }, now)).toMatchObject({ running: false, text: 'not synced yet' });
  });

  it('shows progress while running', () => {
    const sync: SyncStatus = { state: 'running', progress: { done: 1, total: 3, label: 'Blade Runner' } };
    expect(describeSync(sync, now)).toMatchObject({ running: true, text: 'refreshing… 2/3 · Blade Runner' });
  });

  it('shows the last update time and counts issues', () => {
    const sync: SyncStatus = { state: 'idle', finishedAt: ago(2 * 3_600_000), lastResult: { ok: true, movies: 1, screenings: 4, errors: ['a', 'b'] } };
    const label = describeSync(sync, now);
    expect(label.text).toBe('updated 2 h ago · 2 issues');
    expect(label.issues).toEqual(['a', 'b']);
  });

  it('flags a failed sync', () => {
    const sync: SyncStatus = { state: 'idle', finishedAt: ago(60_000), lastResult: { ok: false, movies: 0, screenings: 0, errors: ['x'] } };
    expect(describeSync(sync, now).text).toBe('updated 1 min ago · last sync failed');
  });
});
