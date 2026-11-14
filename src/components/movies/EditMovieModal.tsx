import { Button } from '@/components/ui/Button';
import { CoverPicker } from '@/components/ui/CoverPicker';
import { DialogLayout } from '@/components/ui/DialogLayout';
import { FORM_GRID } from '@/components/ui/formGrid';
import { FormActions } from '@/components/ui/FormActions';
import { Modal } from '@/components/ui/Modal';
import { useMovieEditForm } from '@/hooks/useMovieForm';
import type { Movie, MovieChange } from '@/types/movie';
import { MovieFields } from './MovieFields';

interface EditMovieModalProps {
  open: boolean;
  movie: Movie | null;
  onSubmit: (change: MovieChange) => Promise<void>;
  onClose: () => void;
}

export function EditMovieModal({ open, movie, onSubmit, onClose }: EditMovieModalProps) {
  return (
    <Modal open={open && Boolean(movie)} label="edit movie" onClose={onClose}>
      {movie && <EditMovieDialog movie={movie} onSubmit={onSubmit} onClose={onClose} />}
    </Modal>
  );
}

function EditMovieDialog({ movie, onSubmit, onClose }: { movie: Movie; onSubmit: (change: MovieChange) => Promise<void>; onClose: () => void }) {
  const { draft, errors, submitting, submitError, setField, submit } = useMovieEditForm(movie, onSubmit);

  return (
    <DialogLayout
      title={{ lead: 'edit', accent: 'movie' }}
      note="same fields as when you add it"
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
        <MovieFields draft={draft} errors={errors} disabled={submitting} autoFocus="title" onChange={setField} />

        {submitError && (
          <p role="alert" className="col-span-full text-[10px] font-semibold tracking-[0.14em] text-pink-deep">
            {submitError}
          </p>
        )}

        <FormActions>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            cancel
          </Button>
          <Button type="submit" disabled={submitting} className="disabled:opacity-60">
            {submitting ? 'saving…' : 'save changes'}
          </Button>
        </FormActions>
      </form>
    </DialogLayout>
  );
}
