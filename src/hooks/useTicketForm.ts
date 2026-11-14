import { useCallback, useMemo, useState, type FormEvent } from 'react';
import {
  conflictsForSlot,
  describeConflict,
  draftCover,
  draftSlot,
  draftToNewTicket,
  validateTicketDraft,
  validateTicketFile,
} from '@/lib/tickets';
import type { Cinema, Movie, NewTicket, Ticket, TicketDraft, TicketDraftErrors } from '@/types/movie';
import { useAsyncAction } from './useAsyncAction';
import type { FileChange } from './useTicketEditor';

interface Options {
  initial: TicketDraft;
  /** The ticket being edited, if any: it must not clash with itself. */
  editing: Ticket | null;
  movies: Movie[];
  cinemas: Cinema[];
  tickets: Ticket[];
  onSubmit: (input: NewTicket, change: FileChange) => Promise<void>;
}

/** State, validation, live clash warnings and submission for the ticket form. */
export function useTicketForm({ initial, editing, movies, cinemas, tickets, onSubmit }: Options) {
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<TicketDraftErrors>({});
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const action = useAsyncAction(onSubmit);
  const { run, clearError } = action;

  const setField = useCallback(
    (field: keyof TicketDraft, value: string) => {
      setDraft((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      clearError();
    },
    [clearError],
  );

  const chooseFile = useCallback(
    (chosen: File | null) => {
      const problem = chosen ? validateTicketFile(chosen) : null;
      setFileError(problem);
      setFile(problem ? null : chosen);
      setRemoveFile(false);
      clearError();
    },
    [clearError],
  );

  const toggleRemoveFile = useCallback(() => {
    setRemoveFile((current) => !current);
    setFile(null);
    setFileError(null);
  }, []);

  // as soon as the date is valid, tell the user if this slot clashes with another ticket
  const conflicts = useMemo(() => {
    const slot = draftSlot(draft, { movies, cinemas });
    return slot ? conflictsForSlot(slot, tickets, editing?.id).map((conflict) => ({ text: describeConflict(conflict) })) : [];
  }, [draft, movies, cinemas, tickets, editing?.id]);

  const cover = useMemo(() => draftCover(draft, { movies, cinemas }), [draft, movies, cinemas]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateTicketDraft(draft);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    await run(draftToNewTicket(draft, { movies, cinemas }), { file, removeFile });
  };

  return {
    draft,
    errors,
    conflicts,
    cover,
    file,
    fileError,
    removeFile,
    hasExistingFile: Boolean(editing?.image),
    submitting: action.pending,
    submitError: action.error,
    setField,
    chooseFile,
    toggleRemoveFile,
    submit,
  };
}
