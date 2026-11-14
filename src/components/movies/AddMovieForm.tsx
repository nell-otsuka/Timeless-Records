import { Button } from '@/components/ui/Button';
import { CoverPicker } from '@/components/ui/CoverPicker';
import { DialogLayout } from '@/components/ui/DialogLayout';
import { FORM_GRID } from '@/components/ui/formGrid';
import { FormActions } from '@/components/ui/FormActions';
import { useMovieForm } from '@/hooks/useMovieForm';
import type { NewMovie } from '@/types/movie';
import { MovieFields } from './MovieFields';

interface AddMovieFormProps {
  onSubmit: (movie: NewMovie) => Promise<void>;
  onClose: () => void;
}

export function AddMovieForm({ onSubmit, onClose }: AddMovieFormProps) {
  const { draft, errors, submitting, submitError, setField, submit } = useMovieForm(onSubmit);

  return (
    <DialogLayout
      title={{ lead: 'add a', accent: 'movie' }}
      note="paste a link, or fill it in yourself"
      onClose={onClose}
      aside={
        <CoverPicker
          src={draft.coverUrl || undefined}
          title={draft.title}
          onChange={(url) => setField('coverUrl', url)}
          onClear={draft.coverUrl ? () => setField('coverUrl', '') : undefined}
          disabled={submitting}
        />
      }
    >
      <form onSubmit={submit} noValidate className={FORM_GRID}>
        <MovieFields draft={draft} errors={errors} disabled={submitting} autoFocus="allocineRef" onChange={setField} />

        {submitError && (
          <p role="alert" className="col-span-full text-[13px] font-semibold text-pink-deep italic">
            {submitError}
          </p>
        )}

        <FormActions>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            cancel
          </Button>
          <Button type="submit" disabled={submitting} className="disabled:opacity-60">
            {submitting ? 'adding…' : 'add movie'}
          </Button>
        </FormActions>
      </form>
    </DialogLayout>
  );
}
