import { describe, expect, it } from 'vitest';
import type { Movie, MovieDraft, Screening } from '@/types/movie';
import { attachScreenings, draftToNewMovie, EMPTY_DRAFT, getInitials, matchesQuery, validateDraft } from './movies';

const now = new Date(2026, 10, 11, 12, 0);
const draft = (overrides: Partial<MovieDraft> = {}): MovieDraft => ({ ...EMPTY_DRAFT, title: 'starfall', ...overrides });

describe('attachScreenings', () => {
  const movies: Movie[] = [
    { id: 'a', title: 'a' },
    { id: 'b', title: 'b' },
  ];
  const mk = (id: string, movieId: string, startsAt: string): Screening => ({
    id,
    movieId,
    cinemaId: 'c',
    startsAt,
    room: '1',
    formats: [],
  });

  it('joins by movie, drops past screenings and sorts by start time', () => {
    const entries = attachScreenings(
      movies,
      [mk('late', 'a', '2026-11-13T20:00:00'), mk('past', 'a', '2026-11-10T20:00:00'), mk('soon', 'a', '2026-11-12T20:00:00')],
      now,
    );
    expect(entries[0]?.screenings.map((s) => s.id)).toEqual(['soon', 'late']);
    expect(entries[1]?.screenings).toEqual([]);
  });
});

describe('matchesQuery', () => {
  it('is case-insensitive and trims whitespace', () => {
    expect(matchesQuery({ id: '1', title: 'Starfall' }, '  star ')).toBe(true);
    expect(matchesQuery({ id: '1', title: 'Starfall' }, 'moon')).toBe(false);
    expect(matchesQuery({ id: '1', title: 'Starfall' }, '')).toBe(true);
  });
});

describe('getInitials', () => {
  it('takes two letters and skips stray punctuation', () => {
    expect(getInitials('Blade Runner 2049')).toBe('BR');
    expect(getInitials('Dune : première partie')).toBe('DP');
    expect(getInitials('starfall')).toBe('S');
    expect(getInitials('  ')).toBe('');
  });
});

describe('validateDraft', () => {
  it('requires a title or an AlloCiné link', () => {
    expect(validateDraft(draft())).toEqual({});
    expect(validateDraft(draft({ title: '  ' })).title).toBeDefined();
    expect(validateDraft(draft({ title: '', allocineRef: 'https://www.allocine.fr/seance/film-1975/' }))).toEqual({});
  });

  it('rejects an invalid AlloCiné link', () => {
    expect(validateDraft(draft({ allocineRef: 'https://example.com/film-1' })).allocineRef).toBeDefined();
  });

});

describe('draftToNewMovie', () => {
  it('trims and omits empty optionals', () => {
    expect(draftToNewMovie(draft({ title: ' starfall ' }))).toEqual({
      allocineRef: undefined,
      title: 'starfall',
      coverUrl: undefined,
    });
  });
});
