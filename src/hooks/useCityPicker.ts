import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { filterCities, toggleCity } from '@/lib/cities';
import type { City } from '@/types/movie';
import { useAsyncAction } from './useAsyncAction';

/** Local state of the city picker form: a draft selection that is only saved on submit. */
export function useCityPicker(cities: City[], initialIds: number[], onSave: (cityIds: number[]) => Promise<void>) {
  const [ids, setIds] = useState(initialIds);
  const [query, setQuery] = useState('');
  const action = useAsyncAction(onSave);

  const visible = useMemo(() => filterCities(cities, query), [cities, query]);
  const toggle = useCallback((id: number) => setIds((current) => toggleCity(current, id)), []);
  const clear = useCallback(() => setIds([]), []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    await action.run(ids);
  };

  return { ids, query, setQuery, visible, toggle, clear, save, saving: action.pending, error: action.error };
}
