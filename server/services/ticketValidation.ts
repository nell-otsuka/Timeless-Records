import type { Ticket } from '../../shared/types';
import { ValidationError } from './errors';
import { isImageUrl } from './imageUrl';

type Raw = Record<string, unknown>;

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

const text = (raw: Raw, key: string, max: number, required = false): string | undefined => {
  const value = raw[key];
  if (value === undefined || value === null || value === '') {
    if (required) throw new ValidationError(`${key} is required`);
    return undefined;
  }
  if (typeof value !== 'string') throw new ValidationError(`${key} must be text`);
  const trimmed = value.trim();
  if (!trimmed) {
    if (required) throw new ValidationError(`${key} is required`);
    return undefined;
  }
  if (trimmed.length > max) throw new ValidationError(`${key} is too long`);
  return trimmed;
};

const number = (raw: Raw, key: string, { min, max, integer }: { min: number; max: number; integer: boolean }) => {
  const value = raw[key];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new ValidationError(`${key} must be a number between ${min} and ${max}`);
  }
  return value;
};

const localDateTime = (raw: Raw, key: string): string => {
  const value = text(raw, key, 25, true)!;
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match) throw new ValidationError(`${key} must look like 2026-11-14T17:30`);
  const [, y, mo, d, h, mi, s = '00'] = match;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  if (date.getMonth() !== Number(mo) - 1 || date.getDate() !== Number(d) || date.getHours() !== Number(h)) {
    throw new ValidationError(`${key} is not a real date`);
  }
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`;
};

const url = (raw: Raw, key: string): string | undefined => {
  const value = text(raw, key, 500);
  if (value && !isImageUrl(value)) throw new ValidationError(`${key} must be an http(s) url`);
  return value;
};

const MAX_FILM_HOURS = 12;

/** The optional end time: after the start, and not absurdly long. */
const endsAt = (raw: Raw, startsAt: string): string | undefined => {
  if (raw.endsAt === undefined || raw.endsAt === null || raw.endsAt === '') return undefined;
  const value = localDateTime(raw, 'endsAt');
  const minutes = (new Date(value).getTime() - new Date(startsAt).getTime()) / 60_000;
  if (minutes <= 0) throw new ValidationError('endsAt must be after the start');
  if (minutes > MAX_FILM_HOURS * 60) throw new ValidationError('endsAt is too long after the start');
  return value;
};

/** Validates and normalizes an untrusted ticket payload. Throws `ValidationError` with a readable message. */
/** The editable part of a ticket, validated. */
export type ParsedTicket = Omit<Ticket, 'id' | 'image' | 'createdAt'>;

const status = (raw: Raw): ParsedTicket['status'] => {
  if (raw.status === undefined || raw.status === null || raw.status === 'booked') return 'booked';
  if (raw.status === 'tentative') return 'tentative';
  throw new ValidationError('status must be booked or tentative');
};

export const parseNewTicket = (input: unknown): ParsedTicket => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ValidationError('invalid ticket');
  const raw = input as Raw;
  const startsAt = localDateTime(raw, 'startsAt');

  return {
    title: text(raw, 'title', 200, true)!,
    cinemaName: text(raw, 'cinemaName', 200, true)!,
    startsAt,
    movieId: text(raw, 'movieId', 100),
    cinemaId: text(raw, 'cinemaId', 100),
    screeningId: text(raw, 'screeningId', 100),
    coverUrl: url(raw, 'coverUrl'),
    endsAt: endsAt(raw, startsAt),
    places: number(raw, 'places', { min: 1, max: 50, integer: true }),
    room: text(raw, 'room', 100),
    seats: text(raw, 'seats', 100),
    status: status(raw),
  };
};
