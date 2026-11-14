import { describe, expect, it } from 'vitest';
import { addMinutes } from './dates';

describe('addMinutes', () => {
  it('adds to a local date-time and carries over midnight, month and year', () => {
    expect(addMinutes('2026-11-14T17:30:00', 135)).toBe('2026-11-14T19:45:00');
    expect(addMinutes('2026-12-19T23:30:00', 132)).toBe('2026-12-20T01:42:00');
    expect(addMinutes('2026-12-31T23:30:00', 60)).toBe('2027-01-01T00:30:00');
  });

  it('is plain wall-clock arithmetic, unaffected by daylight saving', () => {
    expect(addMinutes('2026-10-25T01:30:00', 120)).toBe('2026-10-25T03:30:00');
  });
});
