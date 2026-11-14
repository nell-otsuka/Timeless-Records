import { describe, expect, it } from 'vitest';
import type { Cinema, Screening } from '@/types/movie';
import {
  getDayBadge,
  groupScreeningsByCity,
  isUpcoming,
  screeningCountLabel,
  toFormatTag,
  toScreeningRow,
} from './screenings';

const now = new Date(2026, 10, 11, 12, 0); // 11 Nov 2026, 12:00

const screening = (startsAt: string, overrides: Partial<Screening> = {}): Screening => ({
  id: startsAt,
  movieId: 'm1',
  cinemaId: 'c1',
  startsAt,
  formats: ['vost'],
  ...overrides,
});

describe('screeningCountLabel', () => {
  it('handles zero, one and many', () => {
    expect(screeningCountLabel(0)).toBe('no screenings');
    expect(screeningCountLabel(1)).toBe('1 screening');
    expect(screeningCountLabel(4)).toBe('4 screenings');
  });
});

describe('isUpcoming', () => {
  it('keeps future screenings and drops past ones', () => {
    expect(isUpcoming(screening('2026-11-11T20:00:00'), now)).toBe(true);
    expect(isUpcoming(screening('2026-11-11T09:00:00'), now)).toBe(false);
  });
});

describe('getDayBadge', () => {
  it('uses relative captions for today and tomorrow, weekdays after', () => {
    expect(getDayBadge('2026-11-11T20:00:00', now)).toEqual({ caption: 'today', day: '11', month: 'nov' });
    expect(getDayBadge('2026-11-12T20:00:00', now).caption).toBe('tmrw');
    expect(getDayBadge('2026-11-14T20:00:00', now)).toEqual({ caption: 'sat', day: '14', month: 'nov' });
  });
});

describe('toFormatTag', () => {
  it('flags premium formats', () => {
    expect(toFormatTag('IMAX').premium).toBe(true);
    expect(toFormatTag('vost').premium).toBe(false);
  });
});

describe('toScreeningRow', () => {
  it('builds a presentation model', () => {
    const row = toScreeningRow(screening('2026-11-12T20:45:00', { bookingUrl: 'https://x' }), now);
    expect(row).toMatchObject({ time: '20:45', bookingUrl: 'https://x', formats: [{ label: 'vost', premium: false }] });
  });
});

describe('groupScreeningsByCity', () => {
  const cinemas: Record<string, Cinema> = {
    louxor: { id: 'louxor', name: 'Louxor', area: 'Paris', address: '170 bd Magenta' },
    ecoles: { id: 'ecoles', name: 'Écoles Cinéma Club', area: 'Paris' },
    omnia: { id: 'omnia', name: 'Omnia', area: 'Rouen' },
  };

  const groups = groupScreeningsByCity(
    [
      screening('2026-11-14T21:00:00', { cinemaId: 'omnia' }),
      screening('2026-11-13T20:00:00', { cinemaId: 'louxor' }),
      screening('2026-11-12T18:00:00', { cinemaId: 'louxor' }),
      screening('2026-11-12T19:00:00', { cinemaId: 'ecoles' }),
    ],
    cinemas,
    now,
  );

  it('groups by city (alphabetical) and counts screenings', () => {
    expect(groups.map((g) => [g.city, g.count])).toEqual([
      ['Paris', 3],
      ['Rouen', 1],
    ]);
  });

  it('groups by cinema inside a city and keeps chronological order', () => {
    const paris = groups[0]!;
    // cinemas are sorted by name, accent-insensitively ("É" sorts as "E")
    expect(paris.cinemas.map((c) => c.name)).toEqual(['Écoles Cinéma Club', 'Louxor']);
    const louxor = paris.cinemas[1];
    expect(louxor?.screenings.map((s) => s.time)).toEqual(['18:00', '20:00']);
    expect(louxor?.address).toBe('170 bd Magenta');
  });

  it('copes with a cinema it knows nothing about', () => {
    const [group] = groupScreeningsByCity([screening('2026-11-12T18:00:00', { cinemaId: 'ghost' })], {}, now);
    expect(group).toMatchObject({ city: 'other', cinemas: [{ name: 'unknown cinema' }] });
  });

  it('marks screenings using the annotation callback', () => {
    const [group] = groupScreeningsByCity(
      [screening('2026-11-12T18:00:00', { cinemaId: 'louxor' })],
      cinemas,
      now,
      () => ({ conflict: { text: 'overlaps Dune (17:30)' } }),
    );
    expect(group?.cinemas[0]?.screenings[0]).toMatchObject({
      conflict: { text: 'overlaps Dune (17:30)' },
    });
  });

  it('returns nothing for no screenings', () => {
    expect(groupScreeningsByCity([], cinemas, now)).toEqual([]);
  });
});
