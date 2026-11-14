import { describe, expect, it } from 'vitest';
import type { Cinema, Movie, Screening, Ticket } from '@/types/movie';
import { buildPlannerEntries, filterPlanner, groupPlannerByDay, summarizePlanner } from './planner';
import { screeningToNewTicket, ticketToNewTicket } from './tickets';

const now = new Date(2026, 10, 12, 12, 0);

const movies: Movie[] = [
  { id: 'alien', title: 'Alien', coverUrl: '/alien.png' },
  { id: 'dune', title: 'Dune' },
];
const cinemas: Cinema[] = [
  { id: 'docks', name: 'Pathé Docks 76', area: 'Rouen' },
  { id: 'mercure', name: 'Grand Mercure', area: 'Elbeuf' },
];

let counter = 0;
const ticket = (startsAt: string, endsAt: string, overrides: Partial<Ticket> = {}): Ticket => ({
  id: `t${++counter}`,
  title: `Film ${counter}`,
  cinemaName: 'Pathé Docks 76',
  cinemaId: 'docks',
  startsAt,
  endsAt,
  status: 'booked',
  createdAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
});
const screening = (id: string, startsAt: string, endsAt: string, overrides: Partial<Screening> = {}): Screening => ({
  id,
  movieId: 'alien',
  cinemaId: 'docks',
  startsAt,
  endsAt,
  formats: [],
  ...overrides,
});

describe('buildPlannerEntries', () => {
  it('puts tickets and free screenings on one timeline, in order, with what each is', () => {
    const held = ticket('2026-12-19T23:30:00', '2026-12-20T01:42:00', { title: 'Blade Runner' });
    const maybe = ticket('2026-11-14T10:30:00', '2026-11-14T13:29:00', { title: 'La Bataille', status: 'tentative' });
    const free = screening('s1', '2026-11-20T20:00:00', '2026-11-20T22:16:00');
    const entries = buildPlannerEntries({ tickets: [held, maybe], screenings: [free], movies, cinemas }, now);

    expect(entries.map((e) => [e.title, e.state])).toEqual([
      ['La Bataille', 'tentative'],
      ['Alien', 'free'],
      ['Blade Runner', 'booked'],
    ]);
    expect(entries[1]).toMatchObject({ coverUrl: '/alien.png', cinemaName: 'Pathé Docks 76', span: '20:00 - 22:16' });
  });

  it('leaves out what is over, and screenings you already hold or planned a ticket for', () => {
    const past = ticket('2026-11-01T20:00:00', '2026-11-01T22:00:00');
    const linked = ticket('2026-12-01T20:00:00', '2026-12-01T22:00:00', { screeningId: 's-linked', movieId: 'alien' });
    const entries = buildPlannerEntries(
      {
        tickets: [past, linked],
        screenings: [
          screening('s-linked', '2026-12-01T20:00:00', '2026-12-01T22:16:00'),
          screening('s-old', '2026-11-10T20:00:00', '2026-11-10T22:16:00'),
          screening('s-ok', '2026-12-02T20:00:00', '2026-12-02T22:16:00'),
        ],
        movies,
        cinemas,
      },
      now,
    );
    expect(entries.map((e) => e.key)).toEqual([`ticket-${linked.id}`, 'screening-s-ok']);
  });

  it('marks a clash with a ticket you hold as hard, and one with a tentative ticket only as soft', () => {
    const held = ticket('2026-12-19T00:15:00', '2026-12-19T02:56:00', { title: 'The Shining' });
    const maybe = ticket('2026-12-19T03:00:00', '2026-12-19T05:11:00', { title: 'Back to the Future', status: 'tentative' });
    const entries = buildPlannerEntries(
      {
        tickets: [held, maybe],
        screenings: [
          screening('a', '2026-12-19T00:15:00', '2026-12-19T02:31:00'),
          screening('b', '2026-12-19T04:00:00', '2026-12-19T06:00:00', { movieId: 'dune' }),
          screening('c', '2026-12-19T15:00:00', '2026-12-19T17:00:00'),
        ],
        movies,
        cinemas,
      },
      now,
    );
    const byKey = Object.fromEntries(entries.map((e) => [e.key, e]));
    expect(byKey['screening-a']?.clashes).toEqual([{ title: 'The Shining', hard: true }]);
    expect(byKey['screening-b']?.clashes).toEqual([{ title: 'Back to the Future', hard: false }]);
    expect(byKey['screening-c']?.clashes).toEqual([]);
    expect(byKey[`ticket-${held.id}`]?.clashes).toEqual([]); // what you hold is settled
  });

  it('warns about a tentative ticket that collides with another one', () => {
    const held = ticket('2026-12-19T00:15:00', '2026-12-19T02:56:00', { title: 'The Shining' });
    const maybe = ticket('2026-12-19T00:15:00', '2026-12-19T02:26:00', { title: 'Back to the Future', status: 'tentative' });
    const entries = buildPlannerEntries({ tickets: [held, maybe], screenings: [], movies, cinemas }, now);
    expect(Object.fromEntries(entries.map((e) => [e.state, e.clashes.length]))).toEqual({ booked: 0, tentative: 1 });
  });

  it('does not count a short gap, even between two cinemas, as a clash', () => {
    const held = ticket('2026-12-19T18:00:00', '2026-12-19T20:00:00');
    const [entry] = buildPlannerEntries(
      { tickets: [held], screenings: [screening('x', '2026-12-19T20:10:00', '2026-12-19T22:00:00', { cinemaId: 'mercure' })], movies, cinemas },
      now,
    ).filter((e) => e.state === 'free');
    expect(entry?.clashes).toEqual([]);
  });
});

describe('filterPlanner and groupPlannerByDay', () => {
  const held = ticket('2026-12-19T00:15:00', '2026-12-19T02:56:00', { title: 'The Shining' });
  const entries = buildPlannerEntries(
    {
      tickets: [held],
      screenings: [
        screening('a', '2026-12-19T00:30:00', '2026-12-19T02:46:00'),
        screening('b', '2026-12-20T20:00:00', '2026-12-20T22:16:00', { movieId: 'dune' }),
      ],
      movies,
      cinemas,
    },
    now,
  );

  it('searches title and cinema, and can hide the screenings that clash', () => {
    expect(filterPlanner(entries, { query: 'dune', hideClashes: false }).map((e) => e.title)).toEqual(['Dune']);
    expect(filterPlanner(entries, { query: 'mercure', hideClashes: false })).toEqual([]);
    expect(filterPlanner(entries, { query: '', hideClashes: true }).map((e) => e.title)).toEqual(['The Shining', 'Dune']);
  });

  it('groups by calendar day', () => {
    const days = groupPlannerByDay(entries, now);
    expect(days.map((d) => [d.key, d.entries.length])).toEqual([
      ['2026-12-19', 2],
      ['2026-12-20', 1],
    ]);
    expect(days[0]).toMatchObject({ weekday: 'sat', day: '19', month: 'dec' });
  });

  it('counts each kind', () => {
    expect(summarizePlanner(entries)).toEqual({ booked: 1, tentative: 0, free: 2 });
  });
});

describe('turning things into tickets', () => {
  it('plans a screening as a tentative ticket carrying its times, movie and cover', () => {
    const s = screening('s9', '2026-12-19T05:15:00', '2026-12-19T07:37:00', { room: 'Salle 4' });
    expect(screeningToNewTicket({ screening: s, movie: movies[0]!, cinema: cinemas[0] }, 'tentative')).toEqual({
      title: 'Alien',
      cinemaName: 'Pathé Docks 76',
      cinemaId: 'docks',
      startsAt: '2026-12-19T05:15:00',
      endsAt: '2026-12-19T07:37:00',
      room: 'Salle 4',
      movieId: 'alien',
      coverUrl: '/alien.png',
      screeningId: 's9',
      status: 'tentative',
    });
  });

  it('books a tentative ticket by changing only its status', () => {
    const maybe = ticket('2026-12-19T03:00:00', '2026-12-19T05:11:00', { status: 'tentative', seats: 'A1' });
    expect(ticketToNewTicket(maybe, { status: 'booked' })).toMatchObject({ status: 'booked', seats: 'A1', startsAt: maybe.startsAt, endsAt: maybe.endsAt });
  });
});
