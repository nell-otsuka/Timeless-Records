import { CoverCase } from '@/components/detail/CoverCase';
import { MovieFacts } from '@/components/detail/MovieFacts';
import { Button } from '@/components/ui/Button';
import { ConflictBadge } from '@/components/ui/ConflictBadge';
import { CloseIcon, PencilIcon, TicketIcon, TrashIcon } from '@/components/ui/icons';
import { IconButton } from '@/components/ui/IconButton';
import type { Ticket } from '@/types/movie';
import type { ConflictModel, Fact } from '@/types/view-models';

interface TicketPanelProps {
  ticket: Ticket;
  facts: Fact[];
  conflicts: ConflictModel[];
  /** "in 3 days", "now playing"… empty for a past ticket. */
  countdown: string;
  onClose: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onShowFile: () => void;
}

export function TicketPanel({ ticket, facts, conflicts, countdown, onClose, onEdit, onRemove, onShowFile }: TicketPanelProps) {
  return (
    <aside
      aria-label={`${ticket.title} ticket`}
      className="relative order-first w-full lg:sticky lg:top-5 lg:order-last lg:w-[430px] lg:shrink-0 xl:w-[500px]"
    >
      <div className="absolute top-0 right-0 flex gap-2">
        <IconButton label="edit ticket" variant="outline" size="sm" onClick={onEdit}>
          <PencilIcon className="size-3.5" />
        </IconButton>
        <IconButton label="delete ticket" variant="outline" size="sm" onClick={onRemove}>
          <TrashIcon className="size-3.5" />
        </IconButton>
        <IconButton label="close details" variant="outline" size="sm" onClick={onClose}>
          <CloseIcon className="size-2.5" />
        </IconButton>
      </div>

      <p className="text-[13px] font-medium tracking-caps">_your ticket</p>

      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row">
        <CoverCase src={ticket.coverUrl} title={ticket.title} />
        <MovieFacts facts={facts} />
      </div>

      <h2 className="font-wide mt-3.5 text-[40px] leading-none tracking-[-0.02em] break-words">{ticket.title}</h2>
      {countdown && <p className="mt-2 text-[11px] tracking-[0.3em] text-pink-soft">{countdown}</p>}

      {conflicts.length > 0 && (
        <div className="mt-5 space-y-1.5">
          {conflicts.map((conflict) => (
            <ConflictBadge key={conflict.text} {...conflict} />
          ))}
        </div>
      )}

      <div className="mt-6">
        {ticket.image ? (
          <Button onClick={onShowFile} className="flex items-center gap-2">
            <TicketIcon className="size-4" />
            show ticket
          </Button>
        ) : (
          <button type="button" onClick={onEdit} className="text-[11px] font-semibold tracking-[0.14em] text-pink underline underline-offset-4">
            add your QR code or PDF
          </button>
        )}
      </div>
    </aside>
  );
}
