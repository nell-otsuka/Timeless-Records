import { describe, expect, it } from 'vitest';
import type { Cinema, Movie, Screening, Ticket } from '@/types/movie';
import {
  conflictsByTicket,
  conflictsForSlot,
  describeConflict,
  draftSlot,
  draftToNewTicket,
  endsAtOf,
  EMPTY_TICKET_DRAFT,
  isScreeningBooked,
  screeningToDraft,
  slotInterval,
  ticketImageUrl,
  ticketToDraft,
  validateTicketDraft,
  validateTicketFile,
} from './tickets';

let counter = 0;
const ticket = (startsAt: string, overrides: Partial<Ticket> = {}): Ticket => ({
  id: `t${++counter}`,
  title: `Film ${counter}`,
  cinemaName: 'Pathé Docks 76',
  cinemaId: 'docks',
  startsAt,
  status: 'booked',
  createdAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
});

describe('slotInterval', () => {
  it('ends when the ticket says it ends, and assumes a typical length when it does not', () => {
    const { start, end } = slotInterval({ startsAt: '2026-11-14T17:30:00', endsAt: '2026-11-14T19:25:00' });
    expect((end - start) / 60_000).toBe(115);
    const unknown = slotInterval({ startsAt: '2026-11-14T17:30:00' });
    expect((unknown.end - unknown.start) / 60_000).toBe(135);
  });
});

describe('conflicts', () => {
  it('detects overlapping screenings, whichever cinema', () => {
    const a = ticket('2026-11-20T19:45:00');
    const b = ticket('2026-11-20T21:00:00', { cinemaId: 'mercure', cinemaName: 'Grand Mercure' });
    expect(conflictsForSlot(a, [b])[0]).toMatchObject({ position: 'after' });
    expect(conflictsForSlot(b, [a])[0]).toMatchObject({ position: 'before' });
  });

  it('lets back-to-back screenings in the same cinema be (Dune 17:30 then 21:00)', () => {
    const dune1 = ticket('2026-11-14T17:30:00', { endsAt: '2026-11-14T20:20:00' });
    const dune2 = ticket('2026-11-14T21:00:00', { endsAt: '2026-11-14T23:46:00' });
    expect(conflictsForSlot(dune1, [dune2])).toEqual([]);
  });

  it('does not warn about a short gap, in the same cinema or another one', () => {
    const first = ticket('2026-11-14T17:30:00', { endsAt: '2026-11-14T20:20:00' });
    const elsewhere = ticket('2026-11-14T20:40:00', { cinemaId: 'mercure', cinemaName: 'Grand Mercure' });
    const sameCinema = ticket('2026-11-14T20:25:00');
    expect(conflictsForSlot(elsewhere, [first])).toEqual([]);
    expect(conflictsForSlot(first, [elsewhere])).toEqual([]);
    expect(conflictsForSlot(sameCinema, [first])).toEqual([]);
  });

  it('handles screenings across midnight (the 19-20 December night)', () => {
    const blade = ticket('2026-12-19T23:30:00', { endsAt: '2026-12-20T01:42:00' });
    const bladeTwo = ticket('2026-12-20T02:00:00', { endsAt: '2026-12-20T04:44:00' });
    expect(conflictsForSlot(blade, [bladeTwo])).toEqual([]); // same cinema, 18 min gap
    const elsewhere = { ...bladeTwo, cinemaId: 'other', cinemaName: 'Elsewhere' };
    expect(conflictsForSlot(blade, [elsewhere])).toEqual([]); // an 18 min gap is not a clash, wherever it is
  });

  it('ignores a ticket when asked (editing it)', () => {
    const a = ticket('2026-11-20T19:45:00');
    expect(conflictsForSlot(a, [a], a.id)).toEqual([]);
  });

  it('reports clashes in both directions', () => {
    const a = ticket('2026-11-20T19:45:00');
    const b = ticket('2026-11-20T20:30:00', { cinemaId: 'mercure', cinemaName: 'Grand Mercure' });
    const c = ticket('2026-12-01T20:00:00');

    const byTicket = conflictsByTicket([a, b, c]);
    expect([...byTicket.keys()].sort()).toEqual([a.id, b.id].sort());
    expect(byTicket.get(a.id)?.[0]?.other.id).toBe(b.id);
    expect(byTicket.get(b.id)?.[0]?.other.id).toBe(a.id);
  });

  it('describes a clash in plain words', () => {
    const other = ticket('2026-11-20T21:00:00', { title: 'Blade Runner', cinemaName: 'Grand Mercure' });
    expect(describeConflict({ other, position: 'after', minutes: 30 })).toBe('overlaps Blade Runner (21:00)');
  });
});

describe('isScreeningBooked', () => {
  const screening: Screening = { id: 's1', movieId: 'm1', cinemaId: 'docks', startsAt: '2026-11-14T17:30:00', formats: [] };

  it('matches by screening id, or by movie + cinema + time', () => {
    expect(isScreeningBooked(screening, [ticket('2026-01-01T10:00:00', { screeningId: 's1' })])).toBe(true);
    expect(isScreeningBooked(screening, [ticket('2026-11-14T17:30:00', { movieId: 'm1' })])).toBe(true);
    expect(isScreeningBooked(screening, [ticket('2026-11-14T17:30:00', { movieId: 'other' })])).toBe(false);
    expect(isScreeningBooked(screening, [ticket('2026-11-14T18:30:00', { movieId: 'm1' })])).toBe(false);
  });
});

describe('ticket drafts', () => {
  const movies: Movie[] = [{ id: 'm1', title: 'Blade Runner', coverUrl: '/c.png' }];
  const cinemas: Cinema[] = [{ id: 'docks', name: 'Pathé Docks 76', area: 'Rouen' }];
  const filled = { ...EMPTY_TICKET_DRAFT, title: 'Blade Runner', cinemaName: 'Pathé Docks 76', startsAt: '2026-12-19T23:30' };

  it('requires title, cinema and a valid date', () => {
    expect(validateTicketDraft(filled)).toEqual({});
    expect(Object.keys(validateTicketDraft(EMPTY_TICKET_DRAFT)).sort()).toEqual(['cinemaName', 'startsAt', 'title']);
  });

  it('validates the places and the end time', () => {
    const errors = validateTicketDraft({ ...filled, endsTime: 'abc', places: '0' });
    expect(Object.keys(errors).sort()).toEqual(['endsTime', 'places']);
    expect(validateTicketDraft({ ...filled, places: '2', endsTime: '01:42' })).toEqual({});
  });

  it('puts the end after midnight when the end time is earlier than the start', () => {
    expect(endsAtOf({ startsAt: '2026-12-19T23:30', endsTime: '01:42' })).toBe('2026-12-20T01:42:00');
    expect(endsAtOf({ startsAt: '2026-11-14T17:30', endsTime: '20:20' })).toBe('2026-11-14T20:20:00');
    expect(endsAtOf({ startsAt: '2026-12-31T23:30', endsTime: '01:00' })).toBe('2027-01-01T01:00:00');
    expect(endsAtOf({ startsAt: '2026-11-14T17:30', endsTime: '' })).toBeUndefined();
    expect(endsAtOf({ startsAt: '2026-11-14T17:30', endsTime: '17:30' })).toBeUndefined(); // 24 h is not a film
  });

  it('links to the watch-list movie and the known cinema by name, inheriting the cover', () => {
    const ticketPayload = draftToNewTicket({ ...filled, title: ' blade runner ', cinemaName: 'PATHÉ DOCKS 76' }, { movies, cinemas });
    expect(ticketPayload).toMatchObject({
      movieId: 'm1',
      cinemaId: 'docks',
      coverUrl: '/c.png',
      startsAt: '2026-12-19T23:30:00',
    });
  });

  it('does not link a movie that is not on the watch list, and parses the extras', () => {
    const payload = draftToNewTicket(
      { ...filled, title: 'Joyeux Noël', cinemaName: 'Grand Mercure', places: '2', seats: 'A9, A10' },
      { movies, cinemas },
    );
    expect(payload).toMatchObject({ movieId: undefined, cinemaId: undefined, places: 2, seats: 'A9, A10' });
  });

  it('drops a carried-over link once the title no longer matches it', () => {
    const payload = draftToNewTicket({ ...filled, title: 'Something else', movieId: 'm1' }, { movies, cinemas });
    expect(payload.movieId).toBeUndefined();
  });

  it('round-trips an existing ticket through the form', () => {
    const original = ticket('2026-12-19T23:30:00', { room: 'Salle 6', seats: 'A19, A18', places: 2 });
    const payload = draftToNewTicket(ticketToDraft(original), { movies: [], cinemas: [] });
    expect(payload).toMatchObject({ title: original.title, startsAt: original.startsAt, room: 'Salle 6', seats: 'A19, A18', places: 2 });
  });

  it('pre-fills a draft from a finder screening', () => {
    const screening: Screening = { id: 's9', movieId: 'm1', cinemaId: 'docks', startsAt: '2026-12-19T23:30:00', formats: ['vost', 'imax'], room: 'salle 6' };
    expect(screeningToDraft({ screening, movie: movies[0]!, cinema: cinemas[0] })).toMatchObject({
      title: 'Blade Runner',
      cinemaName: 'Pathé Docks 76',
      startsAt: '2026-12-19T23:30',
      room: 'salle 6',
      screeningId: 's9',
      movieId: 'm1',
    });
  });

  it('builds a slot for live clash warnings only once the date is valid', () => {
    expect(draftSlot(EMPTY_TICKET_DRAFT, { movies, cinemas })).toBeNull();
    expect(draftSlot(filled, { movies, cinemas })).toMatchObject({ startsAt: '2026-12-19T23:30:00', cinemaId: 'docks' });
  });
});

describe('validateTicketFile', () => {
  it('accepts images and pdfs within the size limit, and explains refusals', () => {
    expect(validateTicketFile({ type: 'image/png', size: 1000 })).toBeNull();
    expect(validateTicketFile({ type: 'application/pdf', size: 1000 })).toBeNull();
    expect(validateTicketFile({ type: 'image/svg+xml', size: 1000 })).toMatch(/png, jpeg/);
    expect(validateTicketFile({ type: 'image/png', size: 0 })).toMatch(/empty/);
    expect(validateTicketFile({ type: 'image/png', size: 9 * 1024 * 1024 })).toMatch(/too large/);
  });
});

describe('ticketImageUrl', () => {
  it('is null without a file and versioned with one', () => {
    expect(ticketImageUrl(ticket('2026-11-14T17:30:00'))).toBeNull();
    const withFile = ticket('2026-11-14T17:30:00', { image: { contentType: 'image/png', version: 3 } });
    expect(ticketImageUrl(withFile)).toBe(`/api/tickets/${withFile.id}/image?v=3`);
  });
});
