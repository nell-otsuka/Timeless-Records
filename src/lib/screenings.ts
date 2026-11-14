import type { Cinema, Screening } from '@/types/movie';
import type { CinemaGroupModel, CityGroupModel, ConflictModel, DayBadge, FormatTag, ScreeningRowModel } from '@/types/view-models';

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
const PREMIUM_FORMATS = new Set(['imax', '4dx', '70mm', 'dolby']);
const MS_PER_DAY = 86_400_000;

const pad = (n: number) => String(n).padStart(2, '0');
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const byName = (a: string, b: string) => a.localeCompare(b, 'fr');

export const daysBetween = (from: Date, to: Date): number =>
  Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);

export const isUpcoming = (screening: Screening, now: Date): boolean =>
  new Date(screening.startsAt).getTime() >= now.getTime();

export const byStartTime = (a: Screening, b: Screening): number =>
  new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();

export const formatTime = (startsAt: string): string => {
  const d = new Date(startsAt);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** The calendar parts of a date-time, never relative to today: "sat", "14", "nov". */
export const dayParts = (startsAt: string): { weekday: string; day: string; month: string } => {
  const date = new Date(startsAt);
  return { weekday: WEEKDAYS[date.getDay()] ?? '', day: pad(date.getDate()), month: MONTHS[date.getMonth()] ?? '' };
};

export const getDayBadge = (startsAt: string, now: Date): DayBadge => {
  const date = new Date(startsAt);
  const offset = daysBetween(now, date);
  const caption = offset === 0 ? 'today' : offset === 1 ? 'tmrw' : (WEEKDAYS[date.getDay()] ?? '');
  return { caption, day: pad(date.getDate()), month: MONTHS[date.getMonth()] ?? '' };
};

export const toFormatTag = (format: string): FormatTag => ({
  label: format,
  premium: PREMIUM_FORMATS.has(format.toLowerCase()),
});

export const screeningCountLabel = (count: number): string =>
  count === 0 ? 'no screenings' : count === 1 ? '1 screening' : `${count} screenings`;

/** What the caller knows about a screening beyond the screening itself (your tickets). */
export interface ScreeningAnnotation {
  conflict?: ConflictModel;
}

export const toScreeningRow = (screening: Screening, now: Date, annotation: ScreeningAnnotation = {}): ScreeningRowModel => ({
  id: screening.id,
  badge: getDayBadge(screening.startsAt, now),
  time: formatTime(screening.startsAt),
  formats: screening.formats.map(toFormatTag),
  bookingUrl: screening.bookingUrl,
  conflict: annotation.conflict,
});

/** Groups one movie's screenings by city, then by cinema; screenings stay in chronological order. */
export const groupScreeningsByCity = (
  screenings: Screening[],
  cinemasById: Record<string, Cinema>,
  now: Date,
  annotate: (screening: Screening) => ScreeningAnnotation = () => ({}),
): CityGroupModel[] => {
  const cities = new Map<string, Map<string, CinemaGroupModel>>();

  for (const screening of [...screenings].sort(byStartTime)) {
    const cinema = cinemasById[screening.cinemaId];
    const city = cinema?.area || 'other';
    const cinemas = cities.get(city) ?? new Map<string, CinemaGroupModel>();
    const group = cinemas.get(screening.cinemaId) ?? {
      id: screening.cinemaId,
      name: cinema?.name ?? 'unknown cinema',
      address: cinema?.address,
      screenings: [],
    };
    group.screenings.push(toScreeningRow(screening, now, annotate(screening)));
    cinemas.set(screening.cinemaId, group);
    cities.set(city, cinemas);
  }

  return [...cities]
    .map(([city, cinemas]) => {
      const list = [...cinemas.values()].sort((a, b) => byName(a.name, b.name));
      return { city, count: list.reduce((sum, c) => sum + c.screenings.length, 0), cinemas: list };
    })
    .sort((a, b) => byName(a.city, b.city));
};
