import type { Cinema, City } from '../../shared/types';
import type { AllocineConfig } from '../config';
import { addDays, addMinutes, todayIso } from './dates';
import { HttpError, type HttpClient } from './httpClient';
import { parseCities, parseFilmPage, parseRuntime, parseShowtimesPage, type FilmMeta, type ParsedShowtime } from './parsers';
import { filmPage, filmShowtimesPage, showtimesApi } from './urls';

/** Ads and trailers before the film: a screening runs this much longer than the film itself. */
export const ADS_MINUTES = 15;

export interface ScrapedMovie {
  /** Every city this film plays in, whatever the selection. Feeds the global list behind the city picker. */
  cities: City[];
  cinemas: Cinema[];
  showtimes: ParsedShowtime[];
  /** Non-fatal problems (a city that failed, a cap that was hit…). */
  warnings: string[];
  /** Showtimes were not fetched, so existing screenings must be left untouched. */
  skipped?: boolean;
}

export class FilmNotFoundError extends Error {
  constructor(filmId: number) {
    super(`AlloCiné film ${filmId} not found`);
  }
}

type ScraperOptions = Pick<AllocineConfig, 'maxCitiesPerMovie' | 'fetchShowtimes'> & { timezone: string };

/**
 * Scrapes AlloCiné for one film:
 *   1. the film's showtimes page → the cities where it plays,
 *   2. for each wanted city and each day with showtimes → the showtimes JSON.
 */
export class AllocineScraper {
  constructor(
    private readonly http: HttpClient,
    private readonly options: ScraperOptions,
  ) {}

  async fetchFilmMeta(filmId: number): Promise<FilmMeta> {
    let html: string;
    try {
      html = await this.http.get(filmShowtimesPage(filmId));
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) throw new FilmNotFoundError(filmId);
      throw error;
    }
    const meta = parseFilmPage(html);
    if (!meta) throw new FilmNotFoundError(filmId);
    return meta;
  }

  /** @param cityIds the global city selection; empty means every city the film plays in. */
  async scrapeMovie(filmId: number, cityIds: number[] = []): Promise<ScrapedMovie> {
    const warnings: string[] = [];
    const allCities = parseCities(await this.http.get(filmShowtimesPage(filmId)));

    if (!this.options.fetchShowtimes) {
      warnings.push('showtimes are turned off for this installation');
      return { cities: allCities, cinemas: [], showtimes: [], warnings, skipped: true };
    }

    const runtime = await this.fetchRuntime(filmId, warnings);
    const cities = this.selectCities(allCities, cityIds, warnings);
    const cinemas = new Map<string, Cinema>();
    const showtimes = new Map<string, ParsedShowtime>(); // keyed by id: overlapping cities return the same showtimes
    const covered = new Set<number>();
    let attempted = 0;
    let failed = 0;

    for (const city of cities) {
      if (covered.has(city.id)) continue; // e.g. "Paris 5e" is already part of "Paris"
      attempted++;
      try {
        await this.scrapeCity(filmId, city, covered, cinemas, showtimes);
      } catch (error) {
        failed++;
        warnings.push(`${city.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // total failure (blocked, site changed…) must not wipe the previous data: let the caller keep it
    if (attempted > 0 && failed === attempted) throw new Error(`every city failed — ${warnings.at(-1)}`);

    // the end of a screening is the film's length plus the ads; without the length it stays unknown
    const withEnd = [...showtimes.values()].map((s) => (runtime ? { ...s, endsAt: addMinutes(s.startsAt, runtime + ADS_MINUTES) } : s));
    return { cities: allCities, cinemas: [...cinemas.values()], showtimes: withEnd, warnings };
  }

  /** The film's length, from its own page. A page that cannot be read only costs the end times. */
  private async fetchRuntime(filmId: number, warnings: string[]): Promise<number | undefined> {
    try {
      return parseRuntime(await this.http.get(filmPage(filmId)));
    } catch (error) {
      warnings.push(`film length: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  private selectCities(all: City[], cityIds: number[], warnings: string[]): City[] {
    // a chosen city is always asked for, even when this film's page does not list it: the film page only shows
    // a few cities, while the showtimes of any city can be asked for directly
    let selected = cityIds.length > 0 ? cityIds.map((id) => all.find((c) => c.id === id) ?? { id, name: `#${id}` }) : all;
    // ids ascend with the hierarchy, so parents ("Paris") come before children ("Paris 5e")
    selected = [...selected].sort((a, b) => a.id - b.id);

    if (selected.length > this.options.maxCitiesPerMovie) {
      warnings.push(`${selected.length} cities found, only the first ${this.options.maxCitiesPerMovie} were checked (choose your cities to narrow it down)`);
      selected = selected.slice(0, this.options.maxCitiesPerMovie);
    }
    return selected;
  }

  private async scrapeCity(
    filmId: number,
    city: City,
    covered: Set<number>,
    cinemas: Map<string, Cinema>,
    showtimes: Map<string, ParsedShowtime>,
  ): Promise<void> {
    const today = todayIso(this.options.timezone);
    // no end date: follow AlloCiné's "next day with showtimes" until there is none
    let date: string | null = today;

    while (date) {
      let hasResults = false;
      let nextDate: string | null = null;

      for (let page = 1, totalPages = 1; page <= totalPages; page++) {
        const result = parseShowtimesPage(await this.http.get(showtimesApi(filmId, city.id, date, page)));
        totalPages = result.totalPages;
        nextDate = result.nextDate;
        hasResults ||= result.showtimes.length > 0;

        // AlloCiné answers "near" a city with its neighbours' cinemas too: they are kept on purpose
        result.cinemas.forEach((c) => cinemas.set(c.id, c));
        result.showtimes.forEach((s) => showtimes.set(s.id, s));
        result.coveredLocalizations.forEach((id) => covered.add(id));
      }

      // no showtimes that day: jump straight to the next day that has some. The date must move forward, or we stop.
      const following: string | null = hasResults ? addDays(date, 1) : nextDate;
      date = following && following > date ? following : null;
    }
  }
}
