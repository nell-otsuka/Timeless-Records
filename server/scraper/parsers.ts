import * as cheerio from 'cheerio';
import type { Cinema, City } from '../../shared/types';

export type { City };

/* ------------------------------------------------------------------ film page (HTML) */

export interface FilmMeta {
  title: string;
  coverUrl?: string;
  director?: string;
}

/** Title, poster and director from the film's showtimes page (Open Graph tags). */
export const parseFilmPage = (html: string): FilmMeta | null => {
  const $ = cheerio.load(html);
  const og = (property: string) => $(`meta[property="og:${property}"]`).attr('content')?.trim();

  const title = og('title')?.replace(/^S[ée]ances\s+/i, '').trim();
  if (!title) return null;

  return {
    title,
    coverUrl: og('image'),
    director: og('description')?.match(/r[ée]alis[ée] par (.+?)\.?$/i)?.[1]?.trim(),
  };
};

/** The film's length in minutes, from its page ("2h 02min"). Undefined when the page does not say. */
export const parseRuntime = (html: string): number | undefined => {
  const match = /\b(\d{1,2})\s?h\s?(\d{2})\s?min\b/i.exec(html);
  if (!match) return undefined;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes > 0 && minutes <= 600 ? minutes : undefined;
};

/** The cities listed under "Par ville", in page order, without duplicates. */
export const parseCities = (html: string): City[] => {
  const $ = cheerio.load(html);
  const seen = new Set<number>();
  const cities: City[] = [];

  $('.js-set-localization[data-localization]').each((_, element) => {
    try {
      const data = JSON.parse($(element).attr('data-localization') ?? '') as { id?: number; value?: string; type?: string };
      if (data.type === 'localization' && typeof data.id === 'number' && data.value && !seen.has(data.id)) {
        seen.add(data.id);
        cities.push({ id: data.id, name: data.value });
      }
    } catch {
      /* malformed attribute: skip this entry */
    }
  });
  return cities;
};

/* ------------------------------------------------------------------ showtimes (JSON) */

export interface ParsedShowtime {
  id: string;
  cinemaId: string;
  startsAt: string;
  formats: string[];
  endsAt?: string;
  bookingUrl?: string;
}

export interface ShowtimesPage {
  cinemas: Cinema[];
  showtimes: ParsedShowtime[];
  nextDate: string | null;
  totalPages: number;
  /** Every location id the returned theaters belong to (city, district, department…). */
  coveredLocalizations: number[];
}

type Json = Record<string, unknown>;
const asObject = (value: unknown): Json => (value && typeof value === 'object' ? (value as Json) : {});
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const asStrings = (value: unknown): string[] => asArray(value).filter((v): v is string => typeof v === 'string');

const prettify = (value: string) => value.toLowerCase().replace(/_/g, ' ');

/** Maps an AlloCiné showtime group + its flags to short lowercase labels (vf, vost, imax, 3d…). */
export const toFormats = (group: string, showtime: Json): string[] => {
  const subtitled = group.endsWith('_st');
  const original = showtime.diffusionVersion === 'ORIGINAL' || group.startsWith('original');
  const version = original ? (subtitled ? 'vost' : 'vo') : 'vf';

  const extras = [
    ...asStrings(showtime.experience),
    ...asStrings(showtime.projection).filter((p) => p !== 'DIGITAL'),
    ...asStrings(showtime.comfort),
  ].map(prettify);

  return [...new Set([version, ...extras])];
};

const pickBookingUrl = (showtime: Json): string | undefined => {
  const ticketing = asArray(asObject(showtime.data).ticketing).map(asObject);
  const preferred = ticketing.find((t) => t.provider === 'default') ?? ticketing[0];
  return asStrings(preferred?.urls)[0];
};

/** Parses one page of `/_/showtimes/movie-X/near-Y/d-DATE/`. Tolerant of missing fields. */
export const parseShowtimesPage = (raw: string): ShowtimesPage => {
  const json = asObject(JSON.parse(raw));
  const cinemas = new Map<string, Cinema>();
  const showtimes: ParsedShowtime[] = [];
  const covered = new Set<number>();

  for (const result of asArray(json.results).map(asObject)) {
    const theater = asObject(result.theater);
    const location = asObject(theater.location);
    const cinemaId = String(theater.internalId ?? '');
    if (!cinemaId) continue;

    const city = String(location.city ?? '');
    const address = [location.address, [location.zip, city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    cinemas.set(cinemaId, { id: cinemaId, name: String(theater.name ?? cinemaId), area: city, address: address || undefined });

    for (const loc of asArray(location.localizations).map(asObject)) {
      for (const id of asArray(loc.path)) if (typeof id === 'number') covered.add(id);
    }

    for (const [group, items] of Object.entries(asObject(result.showtimes))) {
      for (const item of asArray(items).map(asObject)) {
        if (typeof item.startsAt !== 'string' || item.internalId == null) continue;
        showtimes.push({
          id: String(item.internalId),
          cinemaId,
          startsAt: item.startsAt,
          formats: toFormats(group, item),
          bookingUrl: pickBookingUrl(item),
        });
      }
    }
  }

  const pagination = asObject(json.pagination);
  return {
    cinemas: [...cinemas.values()],
    showtimes,
    nextDate: typeof json.nextDate === 'string' ? json.nextDate : null,
    totalPages: Number(pagination.totalPages) || 1,
    coveredLocalizations: [...covered],
  };
};
