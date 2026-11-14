const BASE = 'https://www.allocine.fr';

/** Page listing the cities where a film is showing ("Par ville"). */
export const filmShowtimesPage = (filmId: number) => `${BASE}/seance/film-${filmId}/`;

/** The film's own page, where its length is listed. */
export const filmPage = (filmId: number) => `${BASE}/film/fichefilm_gen_cfilm=${filmId}.html`;

/** JSON endpoint behind a city's showtimes page, for one day. */
export const showtimesApi = (filmId: number, localizationId: number, date: string, page = 1) =>
  `${BASE}/_/showtimes/movie-${filmId}/near-${localizationId}/d-${date}/${page > 1 ? `p-${page}/` : ''}`;
