import type { FieldSpan } from '@/components/ui/formGrid';
import type { MovieDraft } from '@/types/movie';

export interface FormFieldConfig {
  name: keyof MovieDraft;
  label: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  inputMode?: 'url';
  span?: FieldSpan;
}

/** The fields of a movie, the same when adding and editing. These are the things AlloCiné gives us, so what is left empty is filled in from it. */
export const MOVIE_FORM_FIELDS: FormFieldConfig[] = [
  { name: 'title', label: 'title', placeholder: 'from allociné if left empty' },
  {
    name: 'allocineRef',
    label: 'allociné link or id',
    placeholder: 'https://www.allocine.fr/seance/film-1975/',
    inputMode: 'url',
  },
  { name: 'director', label: 'director', placeholder: 'from allociné if left empty' },
];
