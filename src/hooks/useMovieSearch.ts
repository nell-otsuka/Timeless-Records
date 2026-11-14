import { useMemo, useState } from 'react';
import { matchesQuery } from '@/lib/movies';
import type { MovieEntry } from '@/types/movie';

export function useMovieSearch(entries: MovieEntry[]) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => entries.filter((entry) => matchesQuery(entry, query)), [entries, query]);
  return { query, setQuery, results };
}
