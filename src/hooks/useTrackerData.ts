import { useCallback, useEffect, useMemo, useState } from 'react';
import { trackerApi } from '@/services/trackerApi';
import type { Movie, MovieChange, NewMovie, TrackerSnapshot } from '@/types/movie';

type Status = 'loading' | 'ready' | 'error';
const POLL_MS = 1500;
const NONE: never[] = [];

/** Loads the watch list, cinemas, screenings, cities and sync status from the API, and keeps them fresh during a sync. */
export function useTrackerData() {
  const [snapshot, setSnapshot] = useState<TrackerSnapshot | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const load = useCallback(async () => {
    try {
      setSnapshot(await trackerApi.getTracker());
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error')); // keep showing data if a later poll fails
    }
  }, []);

  useEffect(() => void load(), [load]);

  // while a sync runs, poll its progress; when it finishes, reload the data it produced
  const syncing = snapshot?.sync.state === 'running';
  useEffect(() => {
    if (!syncing) return;
    const id = setInterval(async () => {
      const sync = await trackerApi.getSync().catch(() => null);
      if (!sync) return;
      if (sync.state === 'running') setSnapshot((current) => current && { ...current, sync });
      else void load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [syncing, load]);

  const refresh = useCallback(async () => {
    const sync = await trackerApi.startRefresh();
    setSnapshot((current) => current && { ...current, sync });
  }, []);

  const addMovie = useCallback(
    async (input: NewMovie): Promise<Movie> => {
      const movie = await trackerApi.addMovie(input);
      await load(); // picks up the new movie and the sync the server started for it
      return movie;
    },
    [load],
  );

  const updateMovie = useCallback(
    async (id: string, change: MovieChange) => {
      await trackerApi.updateMovie(id, change);
      await load();
    },
    [load],
  );

  const deleteMovie = useCallback(
    async (id: string) => {
      await trackerApi.deleteMovie(id);
      await load();
    },
    [load],
  );

  const saveCities = useCallback(
    async (cityIds: number[]) => {
      await trackerApi.saveCities(cityIds);
      await load(); // the server re-syncs every movie for the new selection
    },
    [load],
  );

  const cinemasById = useMemo(() => Object.fromEntries((snapshot?.cinemas ?? []).map((c) => [c.id, c])), [snapshot?.cinemas]);

  return {
    status,
    movies: snapshot?.movies ?? NONE,
    cinemas: snapshot?.cinemas ?? NONE,
    screenings: snapshot?.screenings ?? NONE,
    cities: snapshot?.cities ?? NONE,
    selectedCityIds: snapshot?.settings.cityIds ?? NONE,
    sync: snapshot?.sync ?? { state: 'idle' as const },
    cinemasById,
    reload: load,
    refresh,
    addMovie,
    updateMovie,
    deleteMovie,
    saveCities,
  };
}
