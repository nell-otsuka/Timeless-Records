import type { Movie } from '../../shared/types';

/** Initial watch list for a brand-new database. */
export const seedMovies: Movie[] = [
  {
    id: 'seed-blade-runner',
    title: 'Blade Runner',
    allocineId: 1975,
    director: 'Ridley Scott',
    coverUrl: 'https://fr.web.img4.acsta.net/pictures/15/09/23/11/37/330370.jpg',
  },
];
