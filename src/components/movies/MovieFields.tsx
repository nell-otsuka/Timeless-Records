import { Field } from '@/components/ui/Field';
import { spanClass } from '@/components/ui/formGrid';
import type { MovieDraft, MovieDraftErrors } from '@/types/movie';
import { MOVIE_FORM_FIELDS } from './movieFormFields';

interface MovieFieldsProps {
  draft: MovieDraft;
  errors: MovieDraftErrors;
  disabled: boolean;
  autoFocus: keyof MovieDraft;
  onChange: (field: keyof MovieDraft, value: string) => void;
}

/** The movie's fields, identical in the add and edit dialogs. */
export function MovieFields({ draft, errors, disabled, autoFocus, onChange }: MovieFieldsProps) {
  return MOVIE_FORM_FIELDS.map(({ name, span, ...field }) => (
    <Field
      key={name}
      className={spanClass(span)}
      value={draft[name]}
      error={errors[name]}
      onChange={(event) => onChange(name, event.target.value)}
      autoFocus={name === autoFocus}
      disabled={disabled}
      {...field}
    />
  ));
}
