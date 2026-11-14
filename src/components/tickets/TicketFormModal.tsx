import { Modal } from '@/components/ui/Modal';
import type { FileChange } from '@/hooks/useTicketEditor';
import type { Cinema, Movie, NewTicket, Ticket, TicketDraft } from '@/types/movie';
import { TicketForm } from './TicketForm';

interface TicketFormModalProps {
  open: boolean;
  editing: Ticket | null;
  initial: TicketDraft;
  movies: Movie[];
  cinemas: Cinema[];
  tickets: Ticket[];
  onSubmit: (input: NewTicket, change: FileChange) => Promise<void>;
  onClose: () => void;
}

/** Add or edit a ticket. Used by both tabs. */
export function TicketFormModal({ open, editing, initial, movies, cinemas, tickets, onSubmit, onClose }: TicketFormModalProps) {
  return (
    <Modal open={open} label={editing ? 'edit ticket' : 'add a ticket'} onClose={onClose}>
      <TicketForm
        initial={initial}
        editing={editing}
        movies={movies}
        cinemas={cinemas}
        tickets={tickets}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </Modal>
  );
}
