import { useCallback, useState, type FormEvent } from 'react';
import { useAsyncAction } from './useAsyncAction';

interface Options<Draft, Payload> {
  initial: Draft;
  /** Returns a message per invalid field; an empty object means the draft is fine. */
  validate: (draft: Draft) => Partial<Record<keyof Draft, string>>;
  toPayload: (draft: Draft) => Payload;
  onSubmit: (payload: Payload) => Promise<void>;
}

/** Form state, validation and (async) submission for a form of text fields. */
export function useDraftForm<Draft, Payload>({ initial, validate, toPayload, onSubmit }: Options<Draft, Payload>) {
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const action = useAsyncAction(onSubmit);
  const { run, clearError } = action;

  const setField = useCallback(
    (field: keyof Draft, value: string) => {
      setDraft((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      clearError();
    },
    [clearError],
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validate(draft);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    await run(toPayload(draft));
    // on success the dialog closes and the form unmounts, so there is nothing to reset
  };

  return { draft, errors, submitting: action.pending, submitError: action.error, setField, submit };
}
