import { describe, expect, it } from 'vitest';
import { parseAllocineId } from './allocine';

describe('parseAllocineId', () => {
  it.each([
    ['1975', 1975],
    ['  1975 ', 1975],
    ['https://www.allocine.fr/seance/film-1975/', 1975],
    ['https://www.allocine.fr/seance/film-1975/pres-de-115755/', 1975],
    ['https://www.allocine.fr/film/fichefilm_gen_cfilm=1975.html', 1975],
    ['https://www.allocine.fr/film/fichefilm-1975/actu/', 1975],
  ])('extracts the id from %s', (input, expected) => {
    expect(parseAllocineId(input)).toBe(expected);
  });

  it.each(['', 'blade runner', 'https://example.com/film-1975/', 'https://www.allocine.fr/', 'https://evil.com/?allocine.fr/film-1'])(
    'rejects %j',
    (input) => {
      expect(parseAllocineId(input)).toBeNull();
    },
  );
});
