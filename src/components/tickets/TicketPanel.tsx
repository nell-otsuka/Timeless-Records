import { CoverCase } from '@/components/detail/CoverCase';
import { MovieFacts } from '@/components/detail/MovieFacts';
import { PanelTitle } from '@/components/detail/PanelTitle';
import { Button } from '@/components/ui/Button';
import { ConflictBadge } from '@/components/ui/ConflictBadge';
import { ArrowIcon, CloseIcon, PencilIcon, TicketIcon, TrashIcon } from '@/components/ui/icons';
import { IconButton } from '@/components/ui/IconButton';
import { PanelCard } from '@/components/ui/PanelCard';
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
    <aside aria-label={`${ticket.title} ticket`} className="relative order-first w-full lg:sticky lg:top-[var(--panel-top)] lg:order-last lg:w-[37%] lg:shrink-0">
      <PanelCard
        label="your ticket"
        actions={
          <>
            <IconButton label="edit ticket" variant="outline" size="sm" onClick={onEdit}>
              <PencilIcon className="size-3.5" />
            </IconButton>
            <IconButton label="delete ticket" variant="outline" size="sm" onClick={onRemove}>
              <TrashIcon className="size-3.5" />
            </IconButton>
            <IconButton label="close details" variant="outline" size="sm" onClick={onClose}>
              <CloseIcon className="size-2.5" />
            </IconButton>
          </>
        }
      >
        <div className="flex items-start gap-[30px]">
          <CoverCase src={ticket.coverUrl} title={ticket.title} />
          <MovieFacts facts={facts} />
        </div>
      </PanelCard>

      <PanelTitle title={ticket.title} subtitle={countdown} />

      {conflicts.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {conflicts.map((conflict) => (
            <ConflictBadge key={conflict.text} {...conflict} />
          ))}
        </div>
      )}

      <div className="mt-[18px]">
        {ticket.image ? (
          <Button onClick={onShowFile}>
            <TicketIcon className="size-[18px]" />
            show ticket
            <ArrowIcon className="ml-1 size-3" />
          </Button>
        ) : (
          <button type="button" onClick={onEdit} className="text-[17px] font-bold text-pink italic underline underline-offset-4">
            add your QR code or PDF
          </button>
        )}
      </div>
    </aside>
  );
}
