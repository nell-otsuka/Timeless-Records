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
      <summary className="w-fit cursor-pointer bg-ink px-4 py-1.5 text-[17px] font-extrabold text-white italic select-none [clip-path:polygon(0_0,100%_0,94%_100%,0_100%)] hover:bg-pink">
        past tickets ({count})
      </summary>
      <div className="mt-8">
        <TicketAgenda groups={groups} selectedId={selectedId} onSelect={onSelect} />
      </div>
    </details>
  );
}
