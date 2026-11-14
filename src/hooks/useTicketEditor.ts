import { useCallback, useState } from 'react';
import { EMPTY_TICKET_DRAFT, ticketToDraft } from '@/lib/tickets';
import type { NewTicket, Ticket, TicketDraft } from '@/types/movie';
import { useDisclosure } from './useDisclosure';
import { FileUploadError, type SaveTicketOptions } from './useTicketData';

export type FileChange = Pick<SaveTicketOptions, 'file' | 'removeFile'>;

/**
 * Drives the add/edit ticket dialog. Shared by the finder ("I booked this") and the tickets tab
 * (add, edit), so there is one place that knows how a ticket gets created or changed.
 */
export function useTicketEditor(
  saveTicket: (input: NewTicket, options: SaveTicketOptions) => Promise<Ticket>,
  onSaved?: (ticket: Ticket) => void,
) {
  const modal = useDisclosure();
  const { open, close } = modal;
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [initial, setInitial] = useState<TicketDraft>(EMPTY_TICKET_DRAFT);

  const openNew = useCallback(
    (prefill: TicketDraft = EMPTY_TICKET_DRAFT) => {
      setEditing(null);
      setInitial(prefill);
      open();
    },
    [open],
  );

  const openEdit = useCallback(
    (ticket: Ticket) => {
      setEditing(ticket);
      setInitial(ticketToDraft(ticket));
      open();
    },
    [open],
  );

  const submit = useCallback(
    async (input: NewTicket, change: FileChange) => {
      try {
        // editing a tentative ticket must not quietly book it
        const saved = await saveTicket({ ...input, status: editing?.status ?? 'booked' }, { id: editing?.id, ...change });
        close();
        onSaved?.(saved);
      } catch (error) {
        // the ticket exists now: a retry must update it, not create a duplicate
        if (error instanceof FileUploadError) setEditing(error.ticket);
        throw error;
      }
    },
    [saveTicket, editing?.id, close, onSaved],
  );

  return { modal, editing, initial, openNew, openEdit, submit };
}
