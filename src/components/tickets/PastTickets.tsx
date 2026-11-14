import type { TicketDayGroup } from '@/types/view-models';
import { TicketAgenda } from './TicketAgenda';

interface PastTicketsProps {
  groups: TicketDayGroup[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Tickets whose screening is over, collapsed by default. */
export function PastTickets({ groups, selectedId, onSelect }: PastTicketsProps) {
  const count = groups.reduce((sum, group) => sum + group.rows.length, 0);
  if (count === 0) return null;

  return (
    <details className="mt-14">
      <summary className="cursor-pointer text-[11px] font-semibold tracking-[0.3em] text-pink-soft select-none hover:text-pink">
        _past tickets ({count})
      </summary>
      <div className="mt-6">
        <TicketAgenda groups={groups} selectedId={selectedId} onSelect={onSelect} />
      </div>
    </details>
  );
}
