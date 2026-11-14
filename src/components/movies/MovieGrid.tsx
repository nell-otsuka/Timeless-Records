import { CardGrid } from '@/components/ui/CardGrid';
import type { MovieEntry } from '@/types/movie';
import { EmptyState } from './EmptyState';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  movies: MovieEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MovieGrid({ movies, selectedId, onSelect }: MovieGridProps) {
  if (movies.length === 0) {
    return <EmptyState title="no movies found" hint="try another title, or add one with the + button." />;
  }

  return (
    <CardGrid>
      {movies.map((movie) => (
        <li key={movie.id}>
          <MovieCard movie={movie} selected={movie.id === selectedId} onSelect={onSelect} />
        </li>
      ))}
    </CardGrid>
  );
}
