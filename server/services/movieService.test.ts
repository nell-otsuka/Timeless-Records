import { describe, expect, it, vi } from 'vitest';
import type { Movie } from '../../shared/types';
import type { TrackerRepository } from '../store/trackerRepository';
import { FilmNotFoundError } from '../scraper/allocineScraper';
import { ConflictError, MovieService, NotFoundError, UpstreamError, ValidationError } from './movieService';

const setup = (existing: Movie[] = []) => {
  const added: Movie[] = [];
  const repo = {
    listMovies: async () => existing,
    addMovie: async (m: Movie) => void added.push(m),
  } as unknown as TrackerRepository;
  const fetchFilmMeta = vi.fn(async () => ({ title: 'Blade Runner', coverUrl: 'https://img/x.jpg', director: 'Ridley Scott' }));
  return { service: new MovieService(repo, { fetchFilmMeta }), added, fetchFilmMeta };
};

describe('MovieService.add', () => {
  it('fills title, cover and director from AlloCiné', async () => {
    const { service, added } = setup();
    const movie = await service.add({ allocineRef: 'https://www.allocine.fr/seance/film-1975/' });
    expect(movie).toMatchObject({ title: 'Blade Runner', allocineId: 1975, director: 'Ridley Scott', coverUrl: 'https://img/x.jpg' });
    expect(added).toEqual([movie]);
  });

  it('lets the user override the title', async () => {
    const { service } = setup();
    expect((await service.add({ allocineRef: '1975', title: 'BR' })).title).toBe('BR');
  });

  it('adds a manual movie without calling AlloCiné', async () => {
    const { service, fetchFilmMeta } = setup();
    const movie = await service.add({ title: '  Starfall  ' });
    expect(movie).toMatchObject({ title: 'Starfall', allocineId: undefined });
    expect(fetchFilmMeta).not.toHaveBeenCalled();
  });

  it('rejects empty input and invalid links', async () => {
    const { service } = setup();
    await expect(service.add({})).rejects.toBeInstanceOf(ValidationError);
    await expect(service.add({ allocineRef: 'nope' })).rejects.toBeInstanceOf(ValidationError);
  });

  it('explains when the film does not exist on AlloCiné, and when AlloCiné is down', async () => {
    const repo = { listMovies: async () => [], addMovie: async () => undefined } as unknown as TrackerRepository;
    const notFound = new MovieService(repo, { fetchFilmMeta: async () => Promise.reject(new FilmNotFoundError(1)) });
    await expect(notFound.add({ allocineRef: '1' })).rejects.toThrow(/not found on AlloCiné/);

    const down = new MovieService(repo, { fetchFilmMeta: async () => Promise.reject(new Error('ECONNRESET')) });
    await expect(down.add({ allocineRef: '1' })).rejects.toBeInstanceOf(UpstreamError);
  });

  it('rejects a film that is already on the list', async () => {
    const { service } = setup([{ id: 'x', title: 'Blade Runner', allocineId: 1975 }]);
    await expect(service.add({ allocineRef: '1975' })).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('MovieService.remove', () => {
  it('deletes an existing movie and reports an unknown one', async () => {
    const deleteMovie = vi.fn(async (id: string) => id === 'known');
    const service = new MovieService({ deleteMovie } as unknown as TrackerRepository, { fetchFilmMeta: vi.fn() });
    await expect(service.remove('known')).resolves.toBeUndefined();
    await expect(service.remove('nope')).rejects.toBeInstanceOf(NotFoundError);
  });
});
