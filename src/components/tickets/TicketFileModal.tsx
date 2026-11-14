import { DialogLayout } from '@/components/ui/DialogLayout';
import { Modal } from '@/components/ui/Modal';
import type { Ticket } from '@/types/movie';
import { ticketImageUrl } from '@/lib/tickets';
import { TicketFileViewer } from './TicketFileViewer';

interface TicketFileModalProps {
  open: boolean;
  ticket: Ticket | null;
  onClose: () => void;
}

/** Full-size view of a ticket's QR code or PDF, for showing at the door. */
export function TicketFileModal({ open, ticket, onClose }: TicketFileModalProps) {
  const url = ticket ? ticketImageUrl(ticket) : null;

  return (
    <Modal open={open && Boolean(ticket?.image)} label="your ticket" onClose={onClose}>
      {ticket?.image && url && (
        <DialogLayout title={{ lead: 'your', accent: 'ticket' }} note={ticket.title} onClose={onClose}>
          <TicketFileViewer url={url} contentType={ticket.image.contentType} title={ticket.title} />
        </DialogLayout>
      )}
    </Modal>
  );
}
