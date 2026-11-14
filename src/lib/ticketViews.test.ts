import { describe, expect, it } from 'vitest';
import type { Ticket } from '@/types/movie';
import { conflictsByTicket } from './tickets';
import {
  describeCountdown,
  describeDayDistance,
  formatDayLabel,
  groupTicketsByDay,
  matchesTicketQuery,
  nextGalleryColumns,
  splitTickets,
  ticketFacts,
  toGalleryTiles,
  toNextUp,
  toTicketRow,
} from './ticketViews';

const now = new Date(2026, 10, 11, 12, 0); // Wed 11 Nov 2026, 12:00

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

describe('splitTickets', () => {
  it('splits upcoming from past, keeping a film that is playing right now as upcoming', () => {
    const past = ticket('2026-11-01T20:00:00');
    const playing = ticket('2026-11-11T11:00:00'); // started an hour ago, 2h15 long
    const later = ticket('2026-11-20T20:00:00');
    const sooner = ticket('2026-11-13T20:00:00');

    const { upcoming, past: done } = splitTickets([later, past, playing, sooner], now);
    expect(upcoming.map((t) => t.id)).toEqual([playing.id, sooner.id, later.id]);
    expect(done.map((t) => t.id)).toEqual([past.id]);
  });
});

describe('matchesTicketQuery', () => {
  it('searches title and cinema, ignoring case', () => {
    const t = ticket('2026-11-14T17:30:00', { title: 'Dune', cinemaName: 'Grand Mercure' });
    expect(matchesTicketQuery(t, 'DUN')).toBe(true);
    expect(matchesTicketQuery(t, 'mercure')).toBe(true);
    expect(matchesTicketQuery(t, 'blade')).toBe(false);
    expect(matchesTicketQuery(t, '')).toBe(true);
  });
});

describe('day labels', () => {
  it('labels days relative to today', () => {
    expect(formatDayLabel('2026-11-11T20:00:00', now)).toBe('today · 11 nov');
    expect(formatDayLabel('2026-11-12T20:00:00', now)).toBe('tomorrow · 12 nov');
    expect(formatDayLabel('2026-11-14T17:30:00', now)).toBe('sat 14 nov');
  });

  it('counts down in the most useful unit', () => {
    expect(describeCountdown('2026-11-11T11:00:00', now)).toBe('now playing');
    expect(describeCountdown('2026-11-11T12:20:00', now)).toBe('in 20 min');
    expect(describeCountdown('2026-11-11T20:00:00', now)).toBe('today at 20:00');
    expect(describeCountdown('2026-11-12T20:00:00', now)).toBe('tomorrow');
    expect(describeCountdown('2026-11-14T17:30:00', now)).toBe('in 3 days');
  });

  it('measures how far a day is, in both directions', () => {
    expect(describeDayDistance('2026-11-11T20:00:00', now)).toBe('today');
    expect(describeDayDistance('2026-11-12T20:00:00', now)).toBe('tomorrow');
    expect(describeDayDistance('2026-11-14T17:30:00', now)).toBe('in 3 days');
    expect(describeDayDistance('2026-11-10T17:30:00', now)).toBe('yesterday');
    expect(describeDayDistance('2026-11-01T17:30:00', now)).toBe('10 days ago');
  });
});

describe('toTicketRow', () => {
  it('summarizes the room and seats, without repeating the number of places', () => {
    const row = toTicketRow(
      ticket('2026-11-20T19:45:00', { room: 'Salle 5', seats: 'H30, H29', places: 2, image: { contentType: 'image/png', version: 1 } }),
    );
    expect(row).toMatchObject({ time: '19:45', details: 'Salle 5 · seats H30, H29', hasImage: true, past: false });
  });

  it('falls back to the number of places when there are no seats', () => {
    expect(toTicketRow(ticket('2026-12-03T20:30:00', { room: 'Salle 4', places: 2 })).details).toBe('Salle 4 · 2 places');
    expect(toTicketRow(ticket('2026-12-03T20:30:00', { places: 1 })).details).toBe('1 place');
  });

  it('copes with a ticket that has no details and flags past ones', () => {
    expect(toTicketRow(ticket('2026-11-20T19:45:00'))).toMatchObject({ details: '', conflicts: [], hasImage: false });
    expect(toTicketRow(ticket('2026-11-01T19:45:00'), { past: true }).past).toBe(true);
  });

  it('puts the clashes on the ticket', () => {
    const a = ticket('2026-11-20T19:45:00');
    const b = ticket('2026-11-20T20:30:00', { title: 'Other' });
    expect(toTicketRow(a, { conflicts: conflictsByTicket([a, b]).get(a.id) }).conflicts).toEqual([
      { text: 'overlaps Other (20:30)' },
    ]);
  });
});

describe('groupTicketsByDay', () => {
  it('groups by calendar day, keeping the given order and describing each day', () => {
    const tickets = [ticket('2026-11-14T17:30:00'), ticket('2026-11-14T21:00:00'), ticket('2026-11-20T19:45:00')];
    const groups = groupTicketsByDay(tickets, new Map(), now);
    expect(groups.map((g) => [g.weekday, g.day, g.month, g.relative, g.rows.map((r) => r.time)])).toEqual([
      ['sat', '14', 'nov', 'in 3 days', ['17:30', '21:00']],
      ['fri', '20', 'nov', 'in 9 days', ['19:45']],
    ]);
  });

  it('attaches each ticket\'s clashes and marks past groups', () => {
    const a = ticket('2026-11-02T19:45:00');
    const b = ticket('2026-11-02T20:30:00', { title: 'Other' });
    const [group] = groupTicketsByDay([a, b], conflictsByTicket([a, b]), now, { past: true });
    expect(group?.rows.every((row) => row.past)).toBe(true);
    expect(group?.rows[0]?.conflicts).toHaveLength(1);
    expect(group?.relative).toBe('9 days ago');
  });
});

describe('toNextUp', () => {
  it('describes the next ticket with a countdown and its day', () => {
    const next = toNextUp(ticket('2026-11-14T17:30:00', { title: 'Dune' }), undefined, now);
    expect(next).toMatchObject({ countdown: 'in 3 days', when: 'sat 14 nov', row: { title: 'Dune', time: '17:30' } });
  });
});

describe('nextGalleryColumns', () => {
  it('adds one column at a time and wraps from the most back to the fewest', () => {
    expect(nextGalleryColumns(2)).toBe(3);
    expect(nextGalleryColumns(5)).toBe(6);
    expect(nextGalleryColumns(6)).toBe(2);
  });
});

describe('toGalleryTiles', () => {
  it('lists what is coming up in order, then what has passed, dimmed, with nothing but the cover', () => {
    const tiles = toGalleryTiles(
      [ticket('2026-11-20T19:45:00', { coverUrl: '/b.png' }), ticket('2026-11-01T19:45:00', { coverUrl: '/old.png' }), ticket('2026-11-13T21:00:00', { coverUrl: '/a.png' })],
      now,
    );
    expect(tiles.map((t) => [t.coverUrl, t.past])).toEqual([
      ['/a.png', false],
      ['/b.png', false],
      ['/old.png', true],
    ]);
    expect(Object.keys(tiles[0]!).sort()).toEqual(['coverUrl', 'id', 'past', 'title']);
  });
});

describe('ticketFacts', () => {
  it('lists only what the ticket has: seats, but never the format or a repeated number of places', () => {
    const facts = ticketFacts(
      ticket('2026-11-14T21:00:00', { room: 'Salle DOLBY CINEMA', seats: 'B9, B10', places: 2, endsAt: '2026-11-14T23:46:00' }),
      now,
    );
    expect(facts.map((f) => f.label)).toEqual(['when:', 'cinema:', 'room:', 'seats:', 'ends:']);
    expect(facts[0]?.value).toBe('sat 14 nov · 21:00');
  });

  it('shows the places when there are no seats', () => {
    const facts = ticketFacts(ticket('2026-12-03T20:30:00', { room: 'Salle 4', places: 2 }), now);
    expect(facts.map((f) => f.label)).toEqual(['when:', 'cinema:', 'room:', 'places:']);
  });
});
