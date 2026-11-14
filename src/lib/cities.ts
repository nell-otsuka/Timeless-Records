import type { City } from '@/types/movie';

/** Strips accents and case so "chambery" finds "Chambéry". */
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

export const filterCities = (cities: City[], query: string): City[] => {
  const needle = normalize(query);
  return needle ? cities.filter((city) => normalize(city.name).includes(needle)) : cities;
};

export const toggleCity = (selectedIds: number[], id: number): number[] =>
  selectedIds.includes(id) ? selectedIds.filter((selected) => selected !== id) : [...selectedIds, id];

/** Short label for the toolbar button: "all cities", "Rouen", "Rouen, Paris", "3 cities". */
export const summarizeCities = (selectedIds: number[], cities: City[]): string => {
  if (selectedIds.length === 0) return 'all cities';
  const names = selectedIds.map((id) => cities.find((city) => city.id === id)?.name).filter((name): name is string => Boolean(name));
  return names.length === selectedIds.length && names.length <= 2 ? names.join(', ') : `${selectedIds.length} cities`;
};
