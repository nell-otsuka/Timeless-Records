import { describe, expect, it, vi } from 'vitest';
import { AllocineScraper } from './allocineScraper';
import type { HttpClient } from './httpClient';

const filmPage = `<html><body>
  <span class="js-set-localization" data-localization='{"id":10,"value":"Paris","type":"localization"}'></span>
  <span class="js-set-localization" data-localization='{"id":11,"value":"Paris 5e","type":"localization"}'></span>
  <span class="js-set-localization" data-localization='{"id":20,"value":"Rouen","type":"localization"}'></span>
</body></html>`;

const showtime = (id: number, startsAt: string) => ({ internalId: id, startsAt, diffusionVersion: 'LOCAL' });
const day = (cinemaId: string, path: number[], showtimes: ReturnType<typeof showtime>[], nextDate: string | null = null) =>
  JSON.stringify({
    nextDate,
    pagination: { totalPages: 1 },
    results: showtimes.length
      ? [{ theater: { internalId: cinemaId, name: cinemaId, location: { city: 'x', localizations: [{ path }] } }, showtimes: { multiple: showtimes } }]
      : [],
  });

const options = { maxCitiesPerMovie: 30, fetchShowtimes: true, timezone: 'UTC' };
const today = new Date().toISOString().slice(0, 10);

/** A fake site: showtimes only on `today` for Paris (id 10, covering 11) and nothing for Rouen. */
const fakeSite = (): HttpClient => ({
  get: vi.fn(async (url: string) => {
    if (url.includes('/seance/film-1/')) return filmPage;
    if (url.includes('near-10/') && url.includes(`d-${today}`)) return day('C1', [10, 11], [showtime(1, `${today}T20:00:00`)]);
    if (url.includes('near-20/')) return day('C2', [20], []);
    return day('C1', [10, 11], []);
  }),
});

describe('AllocineScraper.scrapeMovie', () => {
  it('collects showtimes and skips cities already covered by a parent city', async () => {
    const http = fakeSite();
    const result = await new AllocineScraper(http, options).scrapeMovie(1);

    expect(result.showtimes.map((s) => s.id)).toEqual(['1']);
    expect(result.cinemas.map((c) => c.id)).toEqual(['C1']);
    const urls = vi.mocked(http.get).mock.calls.map(([u]) => u);
    expect(urls.some((u) => u.includes('near-11/'))).toBe(false); // "Paris 5e" was covered by "Paris"
  });

  it('only scrapes the selected cities, but still reports every city it found', async () => {
    const http = fakeSite();
    const result = await new AllocineScraper(http, options).scrapeMovie(1, [20]);
    expect(result.cities.map((c) => c.name)).toEqual(['Paris', 'Paris 5e', 'Rouen']);
    const urls = vi.mocked(http.get).mock.calls.map(([u]) => u);
    expect(urls.some((u) => u.includes('near-10/'))).toBe(false);
    expect(urls.some((u) => u.includes('near-20/'))).toBe(true);
  });

  it("asks for a chosen city even when the film's page does not list it", async () => {
    const http: HttpClient = {
      get: vi.fn(async (url: string) =>
        url.includes('/seance/') ? filmPage : url.includes('near-77/') && url.includes(`d-${today}`) ? day('R1', [77], [showtime(5, `${today}T19:00:00`)]) : day('R1', [77], []),
      ),
    };
    const result = await new AllocineScraper(http, options).scrapeMovie(1, [77]);
    expect(result.showtimes.map((s) => s.id)).toEqual(['5']);
  });

  it('ends a screening when the film does, plus the ads, once the film page gives its length', async () => {
    const http: HttpClient = {
      get: vi.fn(async (url: string) =>
        url.includes('/seance/') ? filmPage
        : url.includes('/film/fichefilm') ? '<span>2h 02min</span>'
        : url.includes('near-10/') && url.includes(`d-${today}`) ? day('C1', [10], [showtime(1, `${today}T23:30:00`)])
        : day('C1', [10], []),
      ),
    };
    const result = await new AllocineScraper(http, options).scrapeMovie(1, [10]);
    const next = new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, Number(today.slice(8, 10)) + 1)).toISOString().slice(0, 10);
    expect(result.showtimes[0]?.endsAt).toBe(`${next}T01:47:00`); // 23:30 + 122 min + 15 min of ads
  });

  it('leaves the end unknown when the film page cannot be read', async () => {
    const http: HttpClient = {
      get: vi.fn(async (url: string) => {
        if (url.includes('/film/fichefilm')) throw new Error('boom');
        return url.includes('/seance/') ? filmPage : url.includes('near-10/') && url.includes(`d-${today}`) ? day('C1', [10], [showtime(1, `${today}T20:00:00`)]) : day('C1', [10], []);
      }),
    };
    const result = await new AllocineScraper(http, options).scrapeMovie(1, [10]);
    expect(result.showtimes[0]?.endsAt).toBeUndefined();
    expect(result.warnings.join()).toMatch(/film length/);
  });

  it('caps the number of cities and says so', async () => {
    const result = await new AllocineScraper(fakeSite(), { ...options, maxCitiesPerMovie: 1 }).scrapeMovie(1);
    expect(result.warnings.join()).toMatch(/only the first 1/);
  });

  it('makes no showtime request when showtime scraping is disabled', async () => {
    const http = fakeSite();
    const result = await new AllocineScraper(http, { ...options, fetchShowtimes: false }).scrapeMovie(1);
    expect(result).toMatchObject({ showtimes: [], skipped: true });
    expect(result.cities).toHaveLength(3);
    expect(vi.mocked(http.get)).toHaveBeenCalledTimes(1);
  });

  it('throws when every city fails, so previous data is kept', async () => {
    const http: HttpClient = {
      get: async (url) => {
        if (url.includes('/seance/')) return filmPage;
        throw new Error('blocked');
      },
    };
    await expect(new AllocineScraper(http, options).scrapeMovie(1)).rejects.toThrow(/every city failed/);
  });
});
