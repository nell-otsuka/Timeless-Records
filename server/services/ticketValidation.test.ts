import { describe, expect, it } from 'vitest';
import { ValidationError } from './errors';
import { parseNewTicket } from './ticketValidation';

const valid = { title: ' Dune ', cinemaName: 'Pathé Docks 76', startsAt: '2026-11-14T17:30' };

describe('parseNewTicket', () => {
  it('trims and normalizes the date', () => {
    expect(parseNewTicket(valid)).toEqual({
      title: 'Dune',
      cinemaName: 'Pathé Docks 76',
      startsAt: '2026-11-14T17:30:00',
      movieId: undefined,
      cinemaId: undefined,
      screeningId: undefined,
      coverUrl: undefined,
      endsAt: undefined,
      status: 'booked',
      places: undefined,
      room: undefined,
      seats: undefined,
    });
  });

  it('takes a status: booked by default, tentative for the planner, nothing else', () => {
    expect(parseNewTicket(valid).status).toBe('booked');
    expect(parseNewTicket({ ...valid, status: 'tentative' }).status).toBe('tentative');
    expect(() => parseNewTicket({ ...valid, status: 'owned' })).toThrow(ValidationError);
  });

  it('keeps the optional details', () => {
    const ticket = parseNewTicket({ ...valid, room: 'Salle 4', seats: 'A9, A10', places: 2, endsAt: '2026-11-14T20:15' });
    expect(ticket).toMatchObject({ room: 'Salle 4', seats: 'A9, A10', places: 2, endsAt: '2026-11-14T20:15:00' });
  });

  it('ignores fields that are no longer part of a ticket', () => {
    const ticket = parseNewTicket({ ...valid, price: 11.5, notes: 'x', formats: ['vost'] });
    expect(ticket).not.toHaveProperty('price');
    expect(ticket).not.toHaveProperty('notes');
    expect(ticket).not.toHaveProperty('formats');
  });

  it('accepts an http(s) cover and a cover uploaded to this server', () => {
    expect(parseNewTicket({ ...valid, coverUrl: 'https://img.example/p.jpg' }).coverUrl).toBe('https://img.example/p.jpg');
    const uploaded = `/api/covers/${'a'.repeat(64)}`;
    expect(parseNewTicket({ ...valid, coverUrl: uploaded }).coverUrl).toBe(uploaded);
  });

  it.each([
    ['null body', null],
    ['an array', []],
    ['no title', { ...valid, title: '  ' }],
    ['no cinema', { ...valid, cinemaName: undefined }],
    ['no date', { ...valid, startsAt: undefined }],
    ['a malformed date', { ...valid, startsAt: '14/11/2026 17:30' }],
    ['an impossible date', { ...valid, startsAt: '2026-02-31T17:30' }],
    ['0 places', { ...valid, places: 0 }],
    ['fractional places', { ...valid, places: 1.5 }],
    ['places as text', { ...valid, places: '2' }],
    ['an end before the start', { ...valid, endsAt: '2026-11-14T17:00' }],
    ['an end that is not a date', { ...valid, endsAt: 'late' }],
    ['an end more than 12 hours later', { ...valid, endsAt: '2026-11-15T09:00' }],
    ['a script cover', { ...valid, coverUrl: 'javascript:alert(1)' }],
    ['a cover path that is not an upload', { ...valid, coverUrl: '/etc/passwd' }],
  ])('rejects %s', (_name, input) => {
    expect(() => parseNewTicket(input)).toThrow(ValidationError);
  });
});
