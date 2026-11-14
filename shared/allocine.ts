/**
 * Extracts an AlloCiné film id from whatever the user pasted:
 * a bare number, or any allocine.fr URL for the film.
 *
 *   1975
 *   https://www.allocine.fr/seance/film-1975/
 *   https://www.allocine.fr/film/fichefilm_gen_cfilm=1975.html
 *   https://www.allocine.fr/film/fichefilm-1975/actu/
 */
export const parseAllocineId = (ref: string): number | null => {
  const value = ref.trim();
  if (/^\d+$/.test(value)) return Number(value);

  let host = '';
  try {
    host = new URL(value).hostname;
  } catch {
    return null;
  }
  if (host !== 'allocine.fr' && !host.endsWith('.allocine.fr')) return null;

  const match = value.match(/(?:film-|fichefilm-|cfilm=)(\d+)/);
  return match?.[1] ? Number(match[1]) : null;
};
