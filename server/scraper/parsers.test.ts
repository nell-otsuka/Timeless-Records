import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCities, parseFilmPage, parseRuntime, parseShowtimesPage, toFormats } from './parsers';

const fixture = (name: string) => readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8');

describe('parseFilmPage', () => {
  it('reads title, cover and director from Open Graph tags', () => {
    expect(parseFilmPage(fixture('film-seances.html'))).toEqual({
      title: 'Blade Runner',
      coverUrl: 'https://fr.web.img4.acsta.net/pictures/15/09/23/11/37/330370.jpg',
      director: 'Ridley Scott',
    });
  });

  it('returns null when the page has no title', () => {
    expect(parseFilmPage('<html><head></head></html>')).toBeNull();
  });
});

describe('parseRuntime', () => {
  it('reads the length from the film page', () => {
    expect(parseRuntime('<span class="spacer">|</span> 2h 02min <span>')).toBe(122);
    expect(parseRuntime('<div>1h 58min</div>')).toBe(118);
    expect(parseRuntime('<div>3h00min</div>')).toBe(180);
  });

  it('is undefined when the page does not say', () => {
    expect(parseRuntime('<html>nothing here</html>')).toBeUndefined();
  });
});

describe('parseCities', () => {
  const cities = parseCities(fixture('film-seances.html'));

  it('lists every city of the "Par ville" section with its AlloCiné id', () => {
    expect(cities).toHaveLength(8);
    expect(cities[0]).toEqual({ id: 102559, name: 'Angers' });
    expect(cities.map((c) => c.name)).toContain('Paris 5e arrondissement');
  });

  it('decodes accents from the JSON attribute', () => {
    expect(cities.find((c) => c.id === 115157)?.name).toBe('Chambéry');
  });
});

describe('parseShowtimesPage', () => {
  const page = parseShowtimesPage(fixture('showtimes-paris.json'));

  it('extracts the cinema', () => {
    expect(page.cinemas).toEqual([
      { id: 'C0071', name: 'Écoles Cinéma Club', area: 'Paris', address: '23, rue des Ecoles, 75005 Paris' },
    ]);
  });

  it('extracts showtimes with version, start time and booking link', () => {
    expect(page.showtimes).toHaveLength(1);
    expect(page.showtimes[0]).toMatchObject({
      id: '84345191203',
      cinemaId: 'C0071',
      startsAt: '2026-11-16T19:50:00',
      formats: ['vo'],
      bookingUrl: 'https://ecolescinemaclub.cotecine.fr/r/235944',
    });
  });

  it('reports which locations the theaters belong to', () => {
    expect(page.coveredLocalizations).toEqual(expect.arrayContaining([115755, 115760]));
  });

  it('handles an empty response with a next date', () => {
    const empty = parseShowtimesPage(JSON.stringify({ error: true, nextDate: '2026-11-24', results: [], pagination: { totalPages: 1 } }));
    expect(empty).toMatchObject({ showtimes: [], nextDate: '2026-11-24', totalPages: 1 });
  });
});

describe('toFormats', () => {
  it('labels versions from the group and diffusion version', () => {
    expect(toFormats('original_st', { diffusionVersion: 'ORIGINAL' })).toEqual(['vost']);
    expect(toFormats('multiple', { diffusionVersion: 'LOCAL' })).toEqual(['vf']);
  });

  it('adds experiences and non-digital projections, once', () => {
    expect(toFormats('original', { diffusionVersion: 'ORIGINAL', experience: ['IMAX'], projection: ['DIGITAL', 'IMAX_3D'] })).toEqual([
      'vo',
      'imax',
      'imax 3d',
    ]);
  });
});
