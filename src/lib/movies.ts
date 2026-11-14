import { parseAllocineId } from '@shared/allocine';
import type { Movie, MovieChange, MovieDraft, MovieDraftErrors, MovieEntry, NewMovie, Screening } from '@/types/movie';
import type { Fact } from '@/types/view-models';
import { byStartTime, isUpcoming } from './screenings';

export const EMPTY_DRAFT: MovieDraft = {
  allocineRef: '',
  title: '',
  coverUrl: '',
  director: '',
};

/** Fills the edit form with what the movie has today. */
export const movieToDraft = (movie: Movie): MovieDraft => ({
  allocineRef: movie.allocineId?.toString() ?? '',
  title: movie.title,
  coverUrl: movie.coverUrl ?? '',
  director: movie.director ?? '',
});

/** Joins each movie with its upcoming screenings, sorted chronologically. */
export const attachScreenings = (movies: Movie[], screenings: Screening[], now: Date): MovieEntry[] =>
  movies.map((movie) => ({
    ...movie,
    screenings: screenings
      .filter((s) => s.movieId === movie.id && isUpcoming(s, now))
      .sort(byStartTime),
  }));

export const matchesQuery = (movie: Movie, query: string): boolean =>
  movie.title.toLowerCase().includes(query.trim().toLowerCase());

export const movieFacts = (movie: MovieEntry): Fact[] => {
  const facts: Fact[] = [];
  if (movie.director) facts.push({ label: 'director:', value: movie.director });
  facts.push({ label: 'screenings:', value: String(movie.screenings.length || 'none') });
  return facts;
};

/** Up to two capital letters from the first words of a title, skipping punctuation like the ":" in "Dune : Part One". */
export const getInitials = (title: string): string =>
  title
    .split(/\s+/)
    .filter((word) => /^[\p{L}\p{N}]/u.test(word))
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

const optional = (value: string): string | undefined => value.trim() || undefined;

/** The checks adding and editing share: the link, when filled in. */
const validateFields = (draft: MovieDraft): MovieDraftErrors => {
  const errors: MovieDraftErrors = {};
  const ref = draft.allocineRef.trim();
  if (ref && parseAllocineId(ref) === null) errors.allocineRef = 'not a valid allociné link or id';
  return errors;
};

/** Adding: a title or an AlloCiné link is enough, the rest is filled in from AlloCiné. */
export const validateDraft = (draft: MovieDraft): MovieDraftErrors => {
  const errors = validateFields(draft);
  if (!draft.title.trim() && !draft.allocineRef.trim()) errors.title = 'enter a title or an allociné link';
  return errors;
};

/** Editing: the movie must keep a title. */
export const validateMovieEdit = (draft: MovieDraft): MovieDraftErrors => {
  const errors = validateFields(draft);
  if (!draft.title.trim()) errors.title = 'a movie needs a title';
  return errors;
};

/** Everything is sent: an emptied text is "", so the server clears it. */
export const draftToMovieChange = (draft: MovieDraft): MovieChange => ({
  title: draft.title.trim(),
  coverUrl: draft.coverUrl.trim(),
  allocineRef: draft.allocineRef.trim(),
  director: draft.director.trim(),
});

export const draftToNewMovie = (draft: MovieDraft): NewMovie => ({
  allocineRef: optional(draft.allocineRef),
  title: optional(draft.title),
  coverUrl: optional(draft.coverUrl),
  director: optional(draft.director),
});
