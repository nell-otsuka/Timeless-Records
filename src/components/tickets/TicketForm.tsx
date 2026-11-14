import { Button } from '@/components/ui/Button';
import { ConflictBadge } from '@/components/ui/ConflictBadge';
import { CoverPicker } from '@/components/ui/CoverPicker';
import { DialogLayout } from '@/components/ui/DialogLayout';
import { Field } from '@/components/ui/Field';
import { FileField } from '@/components/ui/FileField';
import { FORM_GRID, spanClass } from '@/components/ui/formGrid';
import { FormActions } from '@/components/ui/FormActions';
import { useTicketForm } from '@/hooks/useTicketForm';
import type { FileChange } from '@/hooks/useTicketEditor';
import { TICKET_FILE_TYPES } from '@/lib/tickets';
import type { Cinema, Movie, NewTicket, Ticket, TicketDraft } from '@/types/movie';
import { TICKET_FORM_FIELDS } from './ticketFormFields';

interface TicketFormProps {
  initial: TicketDraft;
  editing: Ticket | null;
  movies: Movie[];
  cinemas: Cinema[];
  /** Existing tickets, to warn about clashes while you type. */
  tickets: Ticket[];
  onSubmit: (input: NewTicket, change: FileChange) => Promise<void>;
  onClose: () => void;
}

export function TicketForm({ initial, editing, movies, cinemas, tickets, onSubmit, onClose }: TicketFormProps) {
  const form = useTicketForm({ initial, editing, movies, cinemas, tickets, onSubmit });

  return (
    <DialogLayout
      title={{ lead: editing ? 'edit' : 'add a', accent: 'ticket' }}
      note="what is printed on your booking"
      onClose={onClose}
      aside={
        <CoverPicker
          src={form.cover}
          title={form.draft.title}
          onChange={(url) => form.setField('coverUrl', url)}
          onClear={form.draft.coverUrl ? () => form.setField('coverUrl', '') : undefined}
          disabled={form.submitting}
        />
      }
    >
      <form onSubmit={form.submit} noValidate className={FORM_GRID}>
        <datalist id="ticket-movies">
          {movies.map((movie) => (
            <option key={movie.id} value={movie.title} />
          ))}
        </datalist>
        <datalist id="ticket-cinemas">
          {cinemas.map((cinema) => (
            <option key={cinema.id} value={cinema.name} />
          ))}
        </datalist>

        {TICKET_FORM_FIELDS.map(({ name, span, suggestions, ...field }) => (
          <Field
            key={name}
            className={spanClass(span)}
            value={form.draft[name]}
            error={form.errors[name]}
            onChange={(event) => form.setField(name, event.target.value)}
            list={suggestions && `ticket-${suggestions}`}
            autoFocus={name === 'title' && !editing}
            disabled={form.submitting}
            {...field}
          />
        ))}

        <FileField
          className={spanClass(4)}
          label="ticket file (qr code or pdf)"
          accept={TICKET_FILE_TYPES.join(',')}
          file={form.file}
          error={form.fileError}
          disabled={form.submitting || form.removeFile}
          onChange={form.chooseFile}
          hint={
            form.hasExistingFile ? (
              <>
                this ticket already has a file; choosing another replaces it.{' '}
                <button type="button" onClick={form.toggleRemoveFile} className="font-bold text-pink underline underline-offset-4">
                  {form.removeFile ? 'keep it' : 'remove it'}
                </button>
                {form.removeFile && ' (removed when you save)'}
              </>
            ) : (
              'a screenshot or pdf, to show at the door.'
            )
          }
        />

        {form.conflicts.length > 0 && (
          <div className="col-span-full space-y-1.5" role="status">
            {form.conflicts.map((conflict) => (
              <ConflictBadge key={conflict.text} {...conflict} />
            ))}
          </div>
        )}

        {form.submitError && (
          <p role="alert" className="col-span-full text-[10px] font-semibold tracking-[0.14em] text-pink-deep">
            {form.submitError}
          </p>
        )}

        <FormActions>
          <Button variant="ghost" onClick={onClose} disabled={form.submitting}>
            cancel
          </Button>
          <Button type="submit" disabled={form.submitting} className="disabled:opacity-60">
            {form.submitting ? 'saving…' : editing ? 'save changes' : 'add ticket'}
          </Button>
        </FormActions>
      </form>
    </DialogLayout>
  );
}
