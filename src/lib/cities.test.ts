import { describe, expect, it } from 'vitest';
import { filterCities, summarizeCities, toggleCity } from './cities';

const cities = [
  { id: 1, name: 'Chambéry' },
  { id: 2, name: 'Paris' },
  { id: 3, name: 'Paris 5e arrondissement' },
  { id: 4, name: 'Rouen' },
];

describe('filterCities', () => {
  it('ignores accents and case', () => {
    expect(filterCities(cities, 'CHAMBERY')).toEqual([cities[0]]);
    expect(filterCities(cities, 'paris').map((c) => c.id)).toEqual([2, 3]);
  });

  it('returns everything for an empty query and nothing for no match', () => {
    expect(filterCities(cities, '  ')).toEqual(cities);
    expect(filterCities(cities, 'lyon')).toEqual([]);
  });
});

describe('toggleCity', () => {
  it('adds a missing id and removes a present one', () => {
    expect(toggleCity([1], 2)).toEqual([1, 2]);
    expect(toggleCity([1, 2], 1)).toEqual([2]);
  });
});

describe('summarizeCities', () => {
  it('summarizes the selection', () => {
    expect(summarizeCities([], cities)).toBe('all cities');
    expect(summarizeCities([4], cities)).toBe('Rouen');
    expect(summarizeCities([4, 2], cities)).toBe('Rouen, Paris');
    expect(summarizeCities([1, 2, 4], cities)).toBe('3 cities');
  });

  it('falls back to a count when a selected city is unknown', () => {
    expect(summarizeCities([99], cities)).toBe('1 cities');
  });
});
