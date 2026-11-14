import { draftToMovieChange, draftToNewMovie, EMPTY_DRAFT, movieToDraft, validateDraft, validateMovieEdit } from '@/lib/movies';
import type { Movie, MovieChange, MovieDraft, NewMovie } from '@/types/movie';
import { useDraftForm } from './useDraftForm';

/** The "add movie" form. */
export function useMovieForm(onSubmit: (movie: NewMovie) => Promise<void>) {
  return useDraftForm<MovieDraft, NewMovie>({ initial: EMPTY_DRAFT, validate: validateDraft, toPayload: draftToNewMovie, onSubmit });
}

/** The "edit movie" form: every field of the movie. */
export function useMovieEditForm(movie: Movie, onSubmit: (change: MovieChange) => Promise<void>) {
  return useDraftForm<MovieDraft, MovieChange>({
    initial: movieToDraft(movie),
    validate: validateMovieEdit,
    toPayload: draftToMovieChange,
    onSubmit,
  });
}
