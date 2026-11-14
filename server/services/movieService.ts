import { randomUUID } from 'node:crypto';
import { parseAllocineId } from '../../shared/allocine';
import type { Movie, MovieChange, MovieUpdate, NewMovie } from '../../shared/types';
import { FilmNotFoundError, type AllocineScraper } from '../scraper/allocineScraper';
import type { TrackerRepository } from '../store/trackerRepository';
import { ConflictError, NotFoundError, UpstreamError, ValidationError } from './errors';
import { isImageUrl } from './imageUrl';

export { ConflictError, NotFoundError, UpstreamError, ValidationError } from './errors';

const clean = (value: string | undefined) => value?.trim() || undefined;

/** Validates an untrusted "edit movie" payload. */
const parseMovieChange = (input: unknown): MovieChange => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ValidationError('invalid movie');
  const raw = input as Record<string, unknown>;
  const change: MovieChange = {};

  if (raw.title !== undefined) {
    const title = typeof raw.title === 'string' ? raw.title.trim() : '';
    if (!title || title.length > 200) throw new ValidationError('a movie needs a title');
    change.title = title;
  }
  if (raw.coverUrl !== undefined) {
    const cover = typeof raw.coverUrl === 'string' ? raw.coverUrl.trim() : null;
    if (cover === null || (cover !== '' && !isImageUrl(cover))) throw new ValidationError('coverUrl must be an image url');
    change.coverUrl = cover;
  }
  if (raw.allocineRef !== undefined) {
    if (typeof raw.allocineRef !== 'string') throw new ValidationError('not a valid AlloCiné link or id');
    change.allocineRef = raw.allocineRef.trim();
  }
  if (raw.director !== undefined) {
    if (typeof raw.director !== 'string' || raw.director.length > 200) throw new ValidationError('director must be text');
    change.director = raw.director.trim();
  }
  return change;
};

export class MovieService {
  constructor(
    private readonly repo: TrackerRepository,
    private readonly scraper: Pick<AllocineScraper, 'fetchFilmMeta'>,
  ) {}

  /** Adds a movie. With an AlloCiné reference, title/cover/director are fetched from AlloCiné. */
  async add(input: NewMovie): Promise<Movie> {
    const title = clean(input.title);
    const ref = clean(input.allocineRef);

    let allocineId: number | undefined;
    if (ref) {
      const parsed = parseAllocineId(ref);
      if (parsed === null) throw new ValidationError('not a valid AlloCiné link or id');
      allocineId = parsed;
    }
    if (!title && allocineId === undefined) throw new ValidationError('a title or an AlloCiné link is required');

    if (allocineId !== undefined) {
      const existing = (await this.repo.listMovies()).find((m) => m.allocineId === allocineId);
      if (existing) throw new ConflictError(`"${existing.title}" is already on your list`);
    }

    const meta = allocineId !== undefined ? await this.resolveMeta(allocineId) : undefined;
    const movie: Movie = {
      id: randomUUID(),
      title: title ?? meta?.title ?? '',
      allocineId,
      director: clean(input.director) ?? meta?.director,
      coverUrl: clean(input.coverUrl) ?? meta?.coverUrl,
    };
    await this.repo.addMovie(movie);
    return movie;
  }

  /**
   * Edits any field of a movie; anything not mentioned stays as it is. `relinked` tells the caller the movie now
   * points at another AlloCiné film, so its screenings should be refreshed.
   */
  async update(id: string, input: unknown): Promise<{ movie: Movie; relinked: boolean }> {
    const { allocineRef, ...change } = parseMovieChange(input);
    const update: MovieUpdate = change;

    if (allocineRef !== undefined) {
      if (allocineRef === '') update.allocineId = null;
      else {
        const parsed = parseAllocineId(allocineRef);
        if (parsed === null) throw new ValidationError('not a valid AlloCiné link or id');
        const other = (await this.repo.listMovies()).find((m) => m.allocineId === parsed && m.id !== id);
        if (other) throw new ConflictError(`"${other.title}" already uses that AlloCiné film`);
        update.allocineId = parsed;
      }
    }

    const before = update.allocineId === undefined ? undefined : (await this.repo.listMovies()).find((m) => m.id === id)?.allocineId;
    const movie = await this.repo.updateMovie(id, update);
    if (!movie) throw new NotFoundError('movie not found');
    return { movie, relinked: update.allocineId !== undefined && update.allocineId !== null && update.allocineId !== before };
  }

  async remove(id: string): Promise<void> {
    if (!(await this.repo.deleteMovie(id))) throw new NotFoundError('movie not found');
  }

  private async resolveMeta(allocineId: number) {
    try {
      return await this.scraper.fetchFilmMeta(allocineId);
    } catch (error) {
      if (error instanceof FilmNotFoundError) throw new ValidationError('that film was not found on AlloCiné');
      throw new UpstreamError('could not reach AlloCiné, try again later');
    }
  }
}
